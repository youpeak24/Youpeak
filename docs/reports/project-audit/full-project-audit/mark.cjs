// usage: node mark.cjs <status> <note> <file|prefix>...   (prefix ends with /)
const fs=require("fs");const p=__dirname+"/ledger.json";const L=JSON.parse(fs.readFileSync(p,"utf8"));
const [status,note,...t]=process.argv.slice(2);let n=0;
for(const k of Object.keys(L)) if(t.some(x=>x.endsWith("/")?k.startsWith(x):k===x)){L[k].status=status;if(note&&note!=="-")L[k].notes=note;n++;}
fs.writeFileSync(p,JSON.stringify(L,null,1));console.log("marked",n);
