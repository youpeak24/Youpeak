# YouPeak Premium Asset Pack

This archive contains 485 asset files, covering the 328 original asset filenames plus generated additional controls and declared-path aliases. Provenance is recorded in manifest.csv and manifest.json.

Status counts: {"new vector-derived PNG": 333, "newly generated": 54, "preserved existing": 24, "generation pending or failed \u2014 original retained": 71, "derived from newly generated master": 3}

IMPORTANT: 71 images still use the existing project artwork because the daily image-generation limit was reached. This is the current asset bundle, not a claim that every image has been newly generated. See REMAINING-IMAGES.md and remaining-generation.json.

## Contents
- assets/icons: app-sized image exports, preserving existing filenames.
- generated-masters: full-resolution new image-generation outputs.
- alternate-ai-control-concepts: available AI control drafts, retained for reference; use the consistent vector-derived controls in assets/icons for the main family.
- additional-controls: dedicated new controls from the prompt guide; these need code references when adopted.
- built-in-controls: PNG equivalents of all 110 currently source-listed Flutter Icons symbols; optional exports with a direct Dart-symbol mapping. Variants can share a meaning with the main family.
- small-status-variants: 20 flat notification/status images recommended at 16–44 logical pixels. These also supply the corresponding original filenames in assets/icons. Available sculpted alternatives are retained in alternate-ai-status-artwork.
- declared-path-additions: the lower-case internet.png alias is separate because Windows cannot safely keep Internet.png and internet.png in one directory. Choose a distinct semantic filename and update its code reference when adopting it.
- android-native-res: preserved existing launcher, splash, drawable and shortcut resources, with a separate provenance manifest. Keep their existing Android references when adopting them.
- previews: labeled contact sheets for visual review.
- prompts: complete source prompts and inventory.

## Use
Review the contact sheets first. Back up assets before selectively copying replacements into your Flutter project. This package does not modify app code. Most UI glyphs are black alpha images intended for the existing runtime color tint. Full-color illustrations should not receive that tint. Official provider logos, approved YouPeak brand assets and mic.json are preserved existing files, not newly generated images. The manifest makes this distinction explicit.

New asset subfolders must be registered in pubspec.yaml when adopted. Additional controls and built-in exports need explicit widget references; the original asset names are retained for selective replacement.

Small UI controls are newly rendered PNGs from the Material Icons vector font, with custom YouPeak navigation and financial geometry; attribution/license and per-control source maps are included. Larger illustrations use new built-in image-generation outputs where available; remaining originals are explicitly listed. The native family was selected to keep controls consistent at small display sizes. These deliverables are raster PNGs, not editable SVGs. Check at real display sizes before release, especially badges, player controls, text-like glyphs and Android launcher/notification assets. Existing brand/system assets are retained to preserve your identity and platform-specific behavior. This archive is an asset deliverable, not a verified application build. Any missing or failed generation is clearly labeled and retains the old file instead of silently disappearing.
