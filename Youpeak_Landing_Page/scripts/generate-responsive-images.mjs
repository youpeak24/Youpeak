import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assets = path.join(process.cwd(), "public", "assets");
const targets = [
  ["hero_screen.webp", [360, 540]],
  ["cta_art.webp", [480, 800]],
  ["persona_watch.webp", [360, 540]],
  ["persona_creator.webp", [360, 540]],
  ["persona_referral.webp", [360, 540]],
  ["screen_feed.webp", [360, 540]],
  ["screen_shorts.webp", [360, 540]],
  ["screen_wallet.webp", [360, 540]],
  ["screen_studio.webp", [360, 540]],
  ["screen_referral.webp", [360, 540]],
  ["screen_analytics.webp", [360, 540]],
  ["support_art.webp", [360]],
  ["payout_art.webp", [360]],
];

for (const [filename, widths] of targets) {
  const source = path.join(assets, filename);
  for (const width of widths) {
    const output = path.join(assets, filename.replace(/\.webp$/, `-${width}.webp`));
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6, smartSubsample: true })
      .toFile(output);
    const stat = await fs.stat(output);
    console.log(`${path.basename(output)} ${(stat.size / 1024).toFixed(1)} KB`);
  }
}
