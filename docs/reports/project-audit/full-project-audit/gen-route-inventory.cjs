// Static route inventory: parses every routes/**/*.js, resolves mount prefixes from the index files.
const fs=require("fs"),path=require("path");
const root="functions/backend/routes";
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
const rows=[];
function parseFile(file,prefix,mountMw){
  const src=read(file);
  const re=/\b(?:route|router)\.(get|post|put|patch|delete|all|use)\(\s*(["'`])([^"'`]*)\2\s*,?([^;]*?)\)\s*;/gs;
  let m;
  while((m=re.exec(src))){
    const [,method,,p,rest]=m; if(method==="use") continue;
    const parts=rest.split(",").map(s=>s.trim()).filter(Boolean);
    const handler=parts[parts.length-1]||"";
    const mw=parts.slice(0,-1).map(s=>s.replace(/\(\)$/,""));
    rows.push({method:method.toUpperCase(),path:(prefix+p).replace(/\/\//g,"/"),file,mw:[...mountMw,...mw],handler});
  }
  // router.use(mw) at file level
  const ure=/\b(?:route|router)\.use\(\s*([A-Za-z_.()]+)\s*\)\s*;/g; let u; const fileMw=[];
  while((u=ure.exec(src))) fileMw.push(u[1].replace(/\(\)$/,""));
  if(fileMw.length) for(const r of rows) if(r.file===file) r.mw=[...new Set([...fileMw,...r.mw])];
}
// top-level
const top=[["admin/index.js","/admin"],["client/index.js","/client"],["cron.route.js","/cron"],["payment.route.js","/payment"],["stream.route.js","/stream"],["internal.route.js","/internal"]];
// admin mounts
const adminIdx=read("admin/index.js");
const mount=/route\.use\("\/([A-Za-z]+)",\s*(AdminMiddleware,\s*CheckScope,\s*)?(?:require\("\.\/([A-Za-z.]+)"\)|([A-Za-z]+))\)/g;
let mm; const adminMounts=[];
while((mm=mount.exec(adminIdx))){const name=mm[1];const prot=!!mm[2];const file=mm[3]?mm[3].replace(/^\.\//,""):null;adminMounts.push({name,prot,var:mm[4],file});}
const reqs={};const rq=/const (\w+) = require\("\.\/([\w.]+)"\)/g;let rr;while((rr=rq.exec(adminIdx)))reqs[rr[1]]=rr[2];
for(const a of adminMounts){const f=(a.file||reqs[a.var]||"").replace(/\.js$/,"")+".js";if(!f||f===".js")continue;if(!fs.existsSync(path.join(root,"admin",f)))continue;parseFile("admin/"+f,"/admin/"+a.name,a.prot?["AdminMiddleware","CheckScope"]:[]);}
const clientIdx=read("client/index.js");
const cm=/route\.use\("\/([A-Za-z]+)",\s*([A-Za-z]+)\)/g;let cc;const creqs={};const crq=/const (\w+) = require\("\.\/([\w.]+)"\)/g;let cr;while((cr=crq.exec(clientIdx)))creqs[cr[1]]=cr[2];
while((cc=cm.exec(clientIdx))){const f=(creqs[cc[2]]||"")+".js";if(fs.existsSync(path.join(root,"client",f)))parseFile("client/"+f,"/client/"+cc[1],["withholdLockedPlayback(response wrapper)"]);}
parseFile("cron.route.js","/cron",[]);parseFile("payment.route.js","/payment",[]);parseFile("stream.route.js","/stream",[]);parseFile("internal.route.js","/internal",[]);
const md=["# Route inventory (static analysis of functions/backend/routes)","","Every route is also served under the `/api` prefix. Admin routes inherit `AdminMiddleware` (JWT + DB admin lookup + role allow-list) and `CheckScope` from `routes/admin/index.js` unless noted. `checkAccess` = shared public app key only. `bindAppUser` / `requireAppUser` = Firebase ID token. `optionalAppUser` = token optional; without it `userId` is stripped.","","| Method | Path | Middleware chain | Handler | Auth level |","|---|---|---|---|---|"];
const level=(mw)=>mw.some(x=>/AdminMiddleware/.test(x))?"admin JWT":mw.some(x=>/bindAppUser|requireAppUser/.test(x))?"user token":mw.some(x=>/optionalAppUser/.test(x))?"key + optional token":mw.some(x=>/checkAccess/i.test(x))?"shared key only":"NONE (route-level)";
for(const r of rows.sort((a,b)=>a.path.localeCompare(b.path)||a.method.localeCompare(b.method))) md.push(`| ${r.method} | ${r.path} | ${r.mw.join(" → ")||"—"} | ${r.handler.replace(/\|/g,"/")} | ${level(r.mw)} |`);
fs.writeFileSync("reports/project-audit/full-project-audit/route-inventory.md",md.join("\n"));
const by={};for(const r of rows){const l=level(r.mw);by[l]=(by[l]||0)+1;}
console.log(rows.length,JSON.stringify(by));
console.log(rows.filter(r=>level(r.mw)==="NONE (route-level)").map(r=>r.method+" "+r.path).join("\n"));
