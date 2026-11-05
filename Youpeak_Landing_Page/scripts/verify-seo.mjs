import fs from "node:fs";
import path from "node:path";

const dist = path.join(process.cwd(), "dist");
const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(home.length > 40_000, "Homepage does not contain substantial prerendered HTML.");
check(!home.includes('<div id="root"></div>'), "Homepage root is empty.");
check((home.match(/<h1\b/g) || []).length === 1, "Homepage must contain exactly one H1.");
for (const text of ["Watch Videos", "Everything You Need", "How It Works", "Illustrative Estimate", "Got questions?"]) {
  check(home.includes(text), `Prerendered homepage is missing: ${text}`);
}
check(home.includes('<main id="main-content">'), "Main landmark is missing.");
check(home.includes('href="https://www.youpeak.org/"'), "Absolute canonical is missing.");
check(home.includes('property="og:url" content="https://www.youpeak.org/"'), "Absolute og:url is missing.");
check(home.includes('name="twitter:card"'), "Twitter card must use the name attribute.");
check(!/name="keywords"/i.test(home), "Obsolete meta keywords tag remains.");
check(!/placehold\.co|href="https:\/\/(play\.google\.com|apps\.apple\.com)"/.test(home), "Placeholder or unverified store URL remains.");
check(!/VITE_GROQ|GROQ_API_KEY/.test(home), "A secret variable name leaked into HTML.");

const schemaMatches = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
check(schemaMatches.length === 1, "Expected one JSON-LD graph.");
for (const match of schemaMatches) {
  try {
    const schema = JSON.parse(match[1]);
    check(Array.isArray(schema["@graph"]), "JSON-LD must contain an @graph.");
    const types = schema["@graph"].map((item) => item["@type"]);
    for (const type of ["Organization", "WebSite", "WebPage"]) check(types.includes(type), `JSON-LD is missing ${type}.`);
  } catch (error) {
    failures.push(`JSON-LD does not parse: ${error.message}`);
  }
}

for (const match of home.matchAll(/<img\b[^>]*>/g)) {
  check(/\bwidth="\d+"/.test(match[0]) && /\bheight="\d+"/.test(match[0]), `Image lacks intrinsic dimensions: ${match[0].slice(0, 120)}`);
}

const ids = new Set([...home.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
for (const match of home.matchAll(/href="([^"]+)"/g)) {
  const href = match[1];
  if (href.startsWith("#")) check(ids.has(href.slice(1)), `Broken fragment link: ${href}`);
  if (href.startsWith("/") && !href.startsWith("//")) {
    const pathname = href.split(/[?#]/)[0];
    if (pathname === "/") continue;
    const target = pathname.includes(".")
      ? path.join(dist, pathname)
      : path.join(dist, `${pathname}.html`);
    check(fs.existsSync(target), `Broken internal link: ${href}`);
  }
}

const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
check(robots.includes("Sitemap: https://www.youpeak.org/sitemap.xml"), "robots.txt lacks the canonical sitemap URL.");
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const locCount = (sitemap.match(/<loc>/g) || []).length;
check(locCount >= 8, `Sitemap must be detailed with all accessible pages (found ${locCount} URLs).`);
check(sitemap.includes("<loc>https://www.youpeak.org/</loc>"), "Sitemap canonical URL is incorrect.");
check(sitemap.includes("<loc>https://www.youpeak.org/sitemap</loc>"), "Sitemap HTML index URL is missing.");
check(sitemap.includes("<loc>https://www.youpeak.org/privacy</loc>"), "Sitemap privacy URL is missing.");
check(sitemap.includes("<loc>https://www.youpeak.org/terms</loc>"), "Sitemap terms URL is missing.");
JSON.parse(fs.readFileSync(path.join(dist, "site.webmanifest"), "utf8"));

const bundles = fs.readdirSync(path.join(dist, "assets"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => fs.readFileSync(path.join(dist, "assets", name), "utf8"))
  .join("\n");
check(!/VITE_GROQ|api\.groq\.com|GROQ_API_KEY/.test(bundles), "Client JavaScript contains Groq endpoint or secret identifiers.");
check(fs.existsSync(path.join(dist, "404.html")), "Custom noindex 404 document is missing.");
check(fs.existsSync(path.join(dist, "sitemap.html")), "HTML sitemap document is missing.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`SEO verification passed: ${(home.length / 1024).toFixed(1)} KB prerendered HTML, one H1, valid JSON-LD, crawler files and internal links.`);
