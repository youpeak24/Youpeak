const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

// Reproducible alpha-preserving production exports from generated masters.
// Usage: node design/tools/export_reaction_asset.cjs R-01 path/to/master.png
async function main() {
  const [id, source] = process.argv.slice(2);
  const root = path.resolve(__dirname, '../..');
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'design/prompt_manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
  const record = inventory.find((entry) => entry.id === id);
  if (!record || !/^[RS]-\d\d$/.test(id)) throw new Error('Unknown reaction/sticker asset');
  const masterDir = path.join(root, 'design/masters');
  const largeDir = path.join(root, 'assets/emoji/large');
  fs.mkdirSync(masterDir, { recursive: true });
  fs.mkdirSync(largeDir, { recursive: true });
  const master = path.join(masterDir, record.name);
  fs.copyFileSync(source, master);
  const meta = await sharp(master).metadata();
  if (!meta.hasAlpha) throw new Error(`${id} must preserve a transparent alpha channel`);
  const reaction = id.startsWith('R-');
  const size = reaction ? 160 : 512;
  const target = path.join(root, 'assets/icons', record.name);
  await sharp(master).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9, palette: true, quality: 95, effort: 10 }).toFile(target);
  if (reaction) {
    await sharp(master).resize(480, 480, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9, palette: true, quality: 95, effort: 10 }).toFile(path.join(largeDir, record.name));
  }
  const manifestPath = path.join(root, 'design/reaction_generation_manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
  const entry = { id, name: record.name, prompt: record.prompt, generation: 'built-in image_gen', generatedSource: source, master: `design/masters/${record.name}`, output: `assets/icons/${record.name}`, width: size, height: size, hasAlpha: true, bytes: fs.statSync(target).size, ...(reaction ? { largeOutput: `assets/emoji/large/${record.name}`, largeWidth: 480, largeHeight: 480 } : {}) };
  const index = manifest.findIndex((item) => item.id === id);
  if (index >= 0) manifest[index] = entry;
  else manifest.push(entry);
  manifest.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ id, output: entry.output, bytes: entry.bytes, alpha: true }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
