// Optimizes the full-resolution source art in assets_original/ into
// web-ready files in public/assets/.
//
//   npm run images
//
// Each image is resized to ~2x the largest size it is displayed at on the
// site (crisp on retina screens) and encoded as high-quality WebP, which is
// visually indistinguishable from the source. Favicons stay PNG and the social preview stays JPG, since
// browsers and link-preview crawlers expect those formats.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "assets_original";
const OUT = "public/assets";

// First matching rule wins. `max` caps the longest side in pixels.
const RULES = [
  { test: /^favicon_(32|180|512)\.png$/, format: "png" },
  { test: /^favicon\.png$/, skip: true }, // 1024px master; favicon_512 covers it
  { test: /^app_logo_original\.png$/, skip: true }, // superseded by app_logo
  { test: /^og_image\.png$/, format: "jpg", resize: { width: 1200, height: 630, fit: "cover" } },
  { test: /^app_logo\.png$/, max: 512, alsoPng: true }, // PNG copy for apple-touch/meta fallbacks
  { test: /^logo_mark\.png$/, max: 256 },
  { test: /^icons\//, max: 256 },
  { test: /^emoji\//, max: 160 },
  { test: /^float_/, max: 320 },
  { test: /^persona_/, max: 720 },
  { test: /^(screen_|hero_screen)/, max: 1080 },
  { test: /^cta_art\.png$/, max: 1200 },
  { test: /^(payout_art|support_art|empty_state)\.png$/, max: 720 },
  { test: /^bg\/hero_bg\.jpg$/, max: 1920, quality: 82 },
  { test: /^bg\/.*\.jpg$/, max: 1536, quality: 82 },
  { test: /^bg\//, max: 1024 },
  { test: /^razorPay\.png$/, lossless: true }, // tiny logo, keep pixel-exact
  { test: /\.png$/, max: 1200 },
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;

let before = 0;
let after = 0;

for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join("/");
  const rule = RULES.find((r) => r.test.test(rel));
  if (!rule || rule.skip) continue;

  const base = rel.replace(/\.(png|jpe?g)$/i, "");
  const resize = rule.resize ?? (rule.max && {
    width: rule.max,
    height: rule.max,
    fit: "inside",
    withoutEnlargement: true,
  });
  const pipeline = () => (resize ? sharp(file).resize(resize) : sharp(file));

  const outputs = [];
  if (rule.format === "png") {
    outputs.push([`${base}.png`, pipeline().png({ compressionLevel: 9, effort: 10 })]);
  } else if (rule.format === "jpg") {
    outputs.push([`${base}.jpg`, pipeline().jpeg({ quality: 90, mozjpeg: true })]);
  } else {
    const webp = rule.lossless
      ? { lossless: true, effort: 6 }
      : { quality: rule.quality ?? 90, alphaQuality: 100, smartSubsample: true, effort: 6 };
    outputs.push([`${base}.webp`, pipeline().webp(webp)]);
    if (rule.alsoPng) {
      outputs.push([`${base}.png`, pipeline().png({ compressionLevel: 9, effort: 10 })]);
    }
  }

  const srcSize = fs.statSync(file).size;
  for (const [outRel, img] of outputs) {
    const dest = path.join(OUT, outRel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const { size } = await img.toFile(dest);
    before += srcSize;
    after += size;
    console.log(`${outRel.padEnd(36)} ${kb(srcSize).padStart(7)} -> ${kb(size).padStart(6)}`);
  }
}

console.log(`\nTotal: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB`);
