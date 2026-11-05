"""Package image-generation deliverables without altering the working app."""
from pathlib import Path
import csv, json, shutil, zipfile, hashlib, math
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PACKAGE = HERE / 'YouPeak-Premium-Asset-Pack'
ASSETS = PACKAGE / 'assets' / 'icons'
MASTERS = PACKAGE / 'generated-masters'
ASSETS.mkdir(parents=True, exist_ok=True)
MASTERS.mkdir(parents=True, exist_ok=True)
jobs = json.loads((HERE / 'generation-jobs.json').read_text(encoding='utf-8-sig'))
results = json.loads((HERE / 'generation-results.json').read_text(encoding='utf-8-sig'))
by_name = {r['file']: r for r in results}
vector_dir = HERE / 'vector-derived-controls'
manifest = []
def export_folder(row):
    folders={'Additional UI control':'additional-controls', 'Case-sensitive declared alias':'declared-path-additions', 'Built-in UI control':'built-in-controls','Small status variant':'small-status-variants'}
    return PACKAGE / folders.get(row['category'], 'assets/icons')
for job in jobs:
    name = job['Filename']
    original = ROOT / 'youpeak' / 'assets' / 'icons' / name
    result = by_name.get(name, {})
    hint = result.get('hint') or ''
    # The built-in tool supplies the saved filename in output_hint.
    marker = ' as '
    saved = hint.split(marker, 1)[-1].split(' by default.', 1)[0] if marker in hint else ''
    generated = Path(saved) if saved else None
    vector_source = vector_dir / name
    is_vector_control = job['Category'] == 'UI glyph' and vector_source.exists()
    flat_status_source=HERE/'small-status-variants'/name
    is_flat_status=flat_status_source.exists()
    if is_vector_control or is_flat_status:
        if generated and generated.is_file():
            alternate = PACKAGE / ('alternate-ai-status-artwork' if is_flat_status else 'alternate-ai-control-concepts')
            alternate.mkdir(exist_ok=True)
            shutil.copy2(generated, alternate / name)
        generated = flat_status_source if is_flat_status else vector_source
    if generated and generated.is_file():
        master_name = name if name.lower().endswith('.png') else name + '.png'
        shutil.copy2(generated, MASTERS / master_name)
        with Image.open(generated) as opened:
            opened.load()
            image = opened.convert('RGBA')
            size = 256 if is_flat_status else 128 if job['Category'] == 'UI glyph' else 768
            if job['Category'] == 'Background/composition':
                size = 1600
                with Image.open(original) as template:
                    ow, oh = template.size
                edge = min(size, max(1024, ow, oh))
                target = (edge, max(1, round(edge * oh / ow))) if ow >= oh else (max(1, round(edge * ow / oh)), edge)
                image = ImageOps.fit(image, target, method=Image.Resampling.LANCZOS)
            elif name == 'video_placeholder.png':
                image = ImageOps.pad(image, (768, 432), method=Image.Resampling.LANCZOS, color=(0,0,0,0))
            else:
                image.thumbnail((size, size), Image.Resampling.LANCZOS)
            if name.lower().endswith(('.jpg', '.jpeg')):
                bg = Image.new('RGB', image.size, '#FFFFFF')
                bg.paste(image, mask=image.getchannel('A'))
                bg.save(ASSETS / name, quality=95)
            else:
                image.save(ASSETS / name, format='WEBP' if name.endswith('.webp') else 'PNG')
            alpha = opened.getchannel('A').getextrema() if opened.mode == 'RGBA' else None
            status = 'new vector-derived PNG' if is_vector_control or is_flat_status else 'newly generated'
            detail = {'master_dimensions': list(opened.size), 'alpha_range': alpha}
    else:
        shutil.copy2(original, ASSETS / name)
        preserved = job['Category'] in ['Official third-party asset', 'Brand/system asset', 'Motion asset']
        status = 'preserved existing' if preserved else 'generation pending or failed — original retained'
        detail = {'error': result.get('error')}
    manifest.append({'filename': name, 'category': job['Category'], 'status': status, **detail,
                     'sha256': hashlib.sha256((ASSETS / name).read_bytes()).hexdigest()})

extra_results_path = HERE / 'additional-generation-results.json'
if extra_results_path.exists():
    extra_dir = PACKAGE / 'additional-controls'
    extra_dir.mkdir(exist_ok=True)
    extra_results = json.loads(extra_results_path.read_text(encoding='utf-8-sig'))
    for result in extra_results:
        name = result['file']
        hint = result.get('hint') or ''
        saved = hint.split(' as ', 1)[-1].split(' by default.', 1)[0] if ' as ' in hint else ''
        is_vector_control = (vector_dir / name).exists()
        if (not saved or not Path(saved).is_file()) and not is_vector_control:
            continue
        if is_vector_control:
            alternate = PACKAGE / 'alternate-ai-control-concepts'
            alternate.mkdir(exist_ok=True)
            if saved and Path(saved).is_file():
                shutil.copy2(saved, alternate / name)
            saved = str(vector_dir / name)
        shutil.copy2(saved, MASTERS / name)
        with Image.open(saved) as im:
            image = im.convert('RGBA')
            image.thumbnail((128, 128), Image.Resampling.LANCZOS)
            image.save(extra_dir / name)
        manifest.append({'filename': name, 'category': 'Additional UI control', 'status': 'new vector-derived PNG' if is_vector_control else 'newly generated',
                         'sha256': hashlib.sha256((extra_dir / name).read_bytes()).hexdigest()})

# Reuse generated masters for historical declared aliases; no duplicate design.
for alias, original_name in {'internet.png': 'language.png', 'colorFilter.png': 'filter.png', 'ArrowDown1.png': 'arrow_down.png'}.items():
    if ((vector_dir / original_name).exists() or by_name.get(original_name, {}).get('hint')) and (ASSETS / original_name).exists():
        alias_dir = PACKAGE / 'declared-path-additions' if alias == 'internet.png' else ASSETS
        alias_dir.mkdir(exist_ok=True)
        shutil.copy2(ASSETS / original_name, alias_dir / alias)
        manifest.append({'filename': alias, 'category': 'Case-sensitive declared alias' if alias == 'internet.png' else 'New file for declared path',
                         'status': 'derived from newly generated master',
                         'sha256': hashlib.sha256((alias_dir / alias).read_bytes()).hexdigest()})
card_result = HERE / 'missing-card-result.json'
if (vector_dir / 'card.png').exists() or card_result.exists():
    if (vector_dir / 'card.png').exists():
        saved = str(vector_dir / 'card.png')
    else:
        result = json.loads(card_result.read_text(encoding='utf-8-sig'))
        saved = result['hint'].split(' as ', 1)[-1].split(' by default.', 1)[0]
    if Path(saved).exists():
        shutil.copy2(saved, MASTERS / 'card.png')
        with Image.open(saved) as im:
            card = im.convert('RGBA')
            card.thumbnail((128, 128), Image.Resampling.LANCZOS)
            card.save(ASSETS / 'card.png')
        manifest.append({'filename': 'card.png', 'category': 'New file for declared path',
                         'status': 'new vector-derived PNG' if (vector_dir / 'card.png').exists() else 'newly generated',
                         'sha256': hashlib.sha256((ASSETS / 'card.png').read_bytes()).hexdigest()})

builtin_manifest = HERE / 'built-in-controls-manifest.json'
builtin_count = 0
if builtin_manifest.exists():
    builtin_rows = json.loads(builtin_manifest.read_text())
    builtin_count = len(builtin_rows)
    for row in builtin_rows:
        name=row['filename']
        target=PACKAGE/'built-in-controls'/name
        target.parent.mkdir(exist_ok=True)
        native=HERE/'built-in-controls'/name
        master=MASTERS/'built-in-controls'/name
        master.parent.mkdir(exist_ok=True)
        shutil.copy2(native,master)
        with Image.open(native) as im:
            im.thumbnail((128,128),Image.Resampling.LANCZOS)
            im.save(target)
        manifest.append({'filename':name,'category':'Built-in UI control','status':'new vector-derived PNG',
                         'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    shutil.copy2(builtin_manifest,PACKAGE/'built-in-controls-manifest.json')

status_manifest=HERE/'small-status-manifest.json'
if status_manifest.exists():
    for row in json.loads(status_manifest.read_text()):
        name=row['filename'];native=HERE/'small-status-variants'/name
        target=PACKAGE/'small-status-variants'/name
        target.parent.mkdir(exist_ok=True)
        master=MASTERS/'small-status-variants'/name
        master.parent.mkdir(exist_ok=True)
        shutil.copy2(native,master)
        with Image.open(native) as im:
            im.thumbnail((256,256),Image.Resampling.LANCZOS);im.save(target)
        manifest.append({'filename':name,'category':'Small status variant','status':'new vector-derived PNG','sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    shutil.copy2(status_manifest,PACKAGE/'small-status-manifest.json')

(PACKAGE / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
with (PACKAGE / 'manifest.csv').open('w', newline='', encoding='utf-8') as stream:
    writer = csv.DictWriter(stream, fieldnames=['filename', 'category', 'status', 'sha256'])
    writer.writeheader()
    writer.writerows({k: r[k] for k in writer.fieldnames} for r in manifest)
prompts = PACKAGE / 'prompts'
prompts.mkdir(exist_ok=True)
licenses = PACKAGE / 'licenses'
licenses.mkdir(exist_ok=True)
shutil.copy2(vector_dir / 'Material-Icons-LICENSE.txt', licenses / 'Material-Icons-LICENSE.txt')
shutil.copy2(HERE / 'vector-controls-manifest.json', PACKAGE / 'vector-controls-manifest.json')
reference = Path('C:/Users/User/Downloads/Icon-192.png')
if reference.exists():
    reference_dir = PACKAGE / 'brand-reference'
    reference_dir.mkdir(exist_ok=True)
    shutil.copy2(reference, reference_dir / 'YouPeak-user-supplied-logo.png')
native_source = ROOT / 'youpeak/android/app/src/main/res'
native_files = []
for native in native_source.rglob('*'):
    if native.is_file() and native.parent.name.startswith(('drawable', 'mipmap')) and native.suffix.lower() in ['.png', '.webp', '.jpg', '.xml']:
        relative = native.relative_to(native_source)
        target = PACKAGE / 'android-native-res' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(native, target)
        native_files.append({'path':str(relative).replace('\\','/'), 'status':'preserved existing native Android resource'})
(PACKAGE / 'android-native-res-manifest.json').write_text(json.dumps(native_files,indent=2))
for name in ['YouPeak-complete-icon-prompts.md', 'YouPeak-start-here-navigation-prompts.md', 'YouPeak-icon-inventory.csv']:
    shutil.copy2(HERE / name, prompts / name)

# Contact sheets are review artifacts; they are not production sprite sheets.
preview_dir = PACKAGE / 'previews'
preview_dir.mkdir(exist_ok=True)
font_path = Path('C:/Windows/Fonts/segoeui.ttf')
font = ImageFont.truetype(str(font_path), 14) if font_path.exists() else ImageFont.load_default()
visuals = [r for r in manifest if r['filename'].lower().endswith(('.png', '.jpg', '.webp'))]
for page in range(math.ceil(len(visuals) / 48)):
    sheet = Image.new('RGB', (1440, 1440), '#E9EEEB')
    draw = ImageDraw.Draw(sheet)
    for i, row in enumerate(visuals[page*48:(page+1)*48]):
        x, y = (i % 8)*180, (i // 8)*240
        draw.rounded_rectangle((x+5, y+5, x+175, y+212), radius=12, fill='white')
        preview_folder = export_folder(row)
        preview_path = preview_folder / row['filename']
        with Image.open(preview_path) as im:
            tile = im.convert('RGBA')
            tile.thumbnail((144, 168), Image.Resampling.LANCZOS)
            sheet.paste(tile, (x+90-tile.width//2, y+96-tile.height//2), tile)
        draw.text((x+8, y+216), row['filename'][:24], fill='#173126', font=font)
    sheet.save(preview_dir / f'contact-sheet-{page+1:02d}.jpg', quality=90)

counts = {}
for r in manifest:
    counts[r['status']] = counts.get(r['status'], 0) + 1
pending=[r for r in manifest if 'pending or failed' in r['status']]
remaining=[]
for r in pending:
    job=next(j for j in jobs if j['Filename']==r['filename'])
    remaining.append({'filename':r['filename'],'reason':'daily image-generation limit reached; existing project artwork retained','prompt':job['Complete prompt']})
(PACKAGE/'remaining-generation.json').write_text(json.dumps(remaining,indent=2))
(PACKAGE/'REMAINING-IMAGES.md').write_text('# Images still awaiting regeneration\n\n'+str(len(remaining))+' images use existing project artwork in this archive. New replacements could not be generated because the daily image-generation limit was reached. See remaining-generation.json for the exact prompts.\n\n'+'\n'.join('- '+r['filename'] for r in remaining),encoding='utf-8')
readme = f'''# YouPeak Premium Asset Pack

This archive contains {len(manifest)} asset files, covering the 328 original asset filenames plus generated additional controls and declared-path aliases. Provenance is recorded in manifest.csv and manifest.json.

Status counts: {json.dumps(counts)}

IMPORTANT: {len(pending)} images still use the existing project artwork because the daily image-generation limit was reached. This is the current asset bundle, not a claim that every image has been newly generated. See REMAINING-IMAGES.md and remaining-generation.json.

## Contents
- assets/icons: app-sized image exports, preserving existing filenames.
- generated-masters: full-resolution new image-generation outputs.
- alternate-ai-control-concepts: available AI control drafts, retained for reference; use the consistent vector-derived controls in assets/icons for the main family.
- additional-controls: dedicated new controls from the prompt guide; these need code references when adopted.
- built-in-controls: PNG equivalents of all {builtin_count} currently source-listed Flutter Icons symbols; optional exports with a direct Dart-symbol mapping. Variants can share a meaning with the main family.
- small-status-variants: 20 flat notification/status images recommended at 16–44 logical pixels. These also supply the corresponding original filenames in assets/icons. Available sculpted alternatives are retained in alternate-ai-status-artwork.
- declared-path-additions: the lower-case internet.png alias is separate because Windows cannot safely keep Internet.png and internet.png in one directory. Choose a distinct semantic filename and update its code reference when adopting it.
- android-native-res: preserved existing launcher, splash, drawable and shortcut resources, with a separate provenance manifest. Keep their existing Android references when adopting them.
- previews: labeled contact sheets for visual review.
- prompts: complete source prompts and inventory.

## Use
Review the contact sheets first. Back up assets before selectively copying replacements into your Flutter project. This package does not modify app code. Most UI glyphs are black alpha images intended for the existing runtime color tint. Full-color illustrations should not receive that tint. Official provider logos, approved YouPeak brand assets and mic.json are preserved existing files, not newly generated images. The manifest makes this distinction explicit.

New asset subfolders must be registered in pubspec.yaml when adopted. Additional controls and built-in exports need explicit widget references; the original asset names are retained for selective replacement.

Small UI controls are newly rendered PNGs from the Material Icons vector font, with custom YouPeak navigation and financial geometry; attribution/license and per-control source maps are included. Larger illustrations use new built-in image-generation outputs where available; remaining originals are explicitly listed. The native family was selected to keep controls consistent at small display sizes. These deliverables are raster PNGs, not editable SVGs. Check at real display sizes before release, especially badges, player controls, text-like glyphs and Android launcher/notification assets. Existing brand/system assets are retained to preserve your identity and platform-specific behavior. This archive is an asset deliverable, not a verified application build. Any missing or failed generation is clearly labeled and retains the old file instead of silently disappearing.
'''
(PACKAGE / 'README.md').write_text(readme, encoding='utf-8')
archive = HERE / ('YouPeak-Current-Asset-Pack.zip' if pending else 'YouPeak-Premium-Asset-Pack.zip')
archive_tmp = archive.with_name(archive.stem + '.building.zip')
with zipfile.ZipFile(archive_tmp, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for file in PACKAGE.rglob('*'):
        if file.is_file():
            z.write(file, file.relative_to(HERE))
with zipfile.ZipFile(archive_tmp) as z:
    assert z.testzip() is None
    for r in manifest:
        relative = (export_folder(r) / r['filename']).relative_to(HERE).as_posix()
        assert relative in z.namelist()
archive_tmp.replace(archive)
print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'status': counts,
                  'asset_count': len(manifest)}, indent=2))
