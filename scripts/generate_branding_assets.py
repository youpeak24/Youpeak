"""
Deterministic Brand Asset Generator for YouPeak.
Extracts the authoritative logo from the pristine master, removes the exterior white
background with subpixel antialiasing and zero white/black halos, preserves the internal
gradient, video mark, white play triangle, and YouPeak lettering, and generates all
platform variants for Flutter (Web, Android, iOS, Windows, macOS), Admin Panel, and
shared branding assets.
"""

import os
import sys
import shutil
import base64
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

def build_transparent_master(source_path):
    print(f"Loading authoritative source: {source_path}")
    im = Image.open(source_path).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    h, w, _ = arr.shape

    # Distance from pure white
    diff_from_white = np.max(255.0 - arr, axis=2)

    # 1. Flood fill from outer image borders to detect exterior background
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for y in range(h):
        for x in [0, w - 1]:
            if diff_from_white[y, x] < 30 and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h - 1]:
            if diff_from_white[y, x] < 30 and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if diff_from_white[ny, nx] < 40:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Binary mask: 255 inside logo, 0 outside
    bin_mask = np.where(~visited, 255, 0).astype(np.uint8)
    mask_img = Image.fromarray(bin_mask, mode='L')

    # Antialias mask slightly: 0.75px Gaussian blur gives smooth subpixel edges
    blurred_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=0.75))
    alpha_arr = np.array(blurred_mask, dtype=np.float32) / 255.0

    # Ensure inner logo core is strictly 1.0 (no blur inside)
    inner_safe = mask_img.filter(ImageFilter.MinFilter(size=5))
    inner_safe_arr = np.array(inner_safe) == 255
    alpha_arr[inner_safe_arr] = 1.0

    # Ensure far exterior is strictly 0.0
    outer_safe = mask_img.filter(ImageFilter.MaxFilter(size=5))
    outer_safe_arr = np.array(outer_safe) == 0
    alpha_arr[outer_safe_arr] = 0.0

    # De-halo / un-matte edge pixels (recover true foreground color)
    clean_rgb = arr.copy()
    edge_mask = (alpha_arr > 0.05) & (alpha_arr < 0.98)
    for c in range(3):
        a = alpha_arr[edge_mask]
        orig_c = arr[edge_mask, c]
        unmatted = (orig_c - (1.0 - a) * 254.0) / np.maximum(a, 0.05)
        clean_rgb[edge_mask, c] = np.clip(unmatted, 0, 255)

    rgba = np.dstack([clean_rgb, alpha_arr * 255.0]).astype(np.uint8)
    master = Image.fromarray(rgba, 'RGBA')
    print("Master transparent logo created successfully.")
    return master

def build_mark_centered_squircle(master):
    """Derives an icon-only squircle variant with the video mark centered (for tiny favicons)."""
    arr = np.array(master)
    h, w, _ = arr.shape

    # Video mark bbox: [175, 196, 1081, 781]
    mark_crop = master.crop((175, 196, 1081, 781))

    # Erase text area inside squircle with pure white
    icon_arr = arr.copy()
    for y in range(780, 1140):
        for x in range(140, 1114):
            if icon_arr[y, x, 3] == 255:
                icon_arr[y, x] = [255, 255, 255, 255]

    # Erase mark from original position
    for y in range(180, 785):
        for x in range(160, 1100):
            if icon_arr[y, x, 3] == 255:
                icon_arr[y, x] = [255, 255, 255, 255]

    base = Image.fromarray(icon_arr)
    target_x = (w - mark_crop.width) // 2
    target_y = (h - mark_crop.height) // 2
    base.paste(mark_crop, (target_x, target_y), mark_crop)
    return base

def build_horizontal_wordmark(master):
    """Creates a 1536x420 horizontal logo lockup from the video mark and Youpeak lettering."""
    target_h = 420
    target_w = 1536
    wordmark = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))

    # Lettering tight crop: [144, 860, 1112, 1094]
    text_crop = master.crop((144, 860, 1112, 1094))
    # Mark crop: [175, 196, 1081, 781]
    mark_crop = master.crop((175, 196, 1081, 781))

    scale_m = 320.0 / mark_crop.height
    m_scaled = mark_crop.resize((int(mark_crop.width * scale_m), 320), Image.Resampling.LANCZOS)

    scale_t = 220.0 / text_crop.height
    t_scaled = text_crop.resize((int(text_crop.width * scale_t), 220), Image.Resampling.LANCZOS)

    gap = 50
    total_w = m_scaled.width + gap + t_scaled.width
    start_x = (target_w - total_w) // 2

    mark_y = (target_h - 320) // 2
    text_y = (target_h - 220) // 2

    wordmark.paste(m_scaled, (start_x, mark_y), m_scaled)
    wordmark.paste(t_scaled, (start_x + m_scaled.width + gap, text_y), t_scaled)
    return wordmark

def build_adaptive_foreground(master):
    """Scales master logo to 65% safe zone of 1024x1024 canvas for Android adaptive launcher icon."""
    fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    # Android adaptive icon safe zone is central 66% (676px)
    logo_scaled = master.resize((676, 676), Image.Resampling.LANCZOS)
    pos = (1024 - 676) // 2
    fg.paste(logo_scaled, (pos, pos), logo_scaled)
    return fg

def build_maskable_pwa(master, size):
    """Creates a PWA maskable icon with opaque white background and 80% safe zone."""
    maskable = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    safe_size = int(size * 0.80)
    logo_scaled = master.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
    pos = (size - safe_size) // 2
    maskable.paste(logo_scaled, (pos, pos), logo_scaled)
    return maskable

def build_notification_silhouette(master):
    """Creates an Android notification icon: white silhouette on transparent background."""
    # Video mark crop
    mark_crop = master.crop((175, 196, 1081, 781))
    arr = np.array(mark_crop)
    # The camera body is colored (diff_from_white > 30)
    diff = np.max(255.0 - arr[:, :, :3], axis=2)
    # The play button inside is white (diff < 20)
    # Silhouette: opaque white wherever camera body is colored, transparent elsewhere
    cam_body = (diff > 35) & (arr[:, :, 3] > 128)
    h, w = cam_body.shape
    sil_arr = np.zeros((h, w, 4), dtype=np.uint8)
    sil_arr[cam_body] = [255, 255, 255, 255]
    sil_img = Image.fromarray(sil_arr, 'RGBA')
    # Pad to square
    max_dim = max(h, w)
    sq = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    sq.paste(sil_img, ((max_dim - w) // 2, (max_dim - h) // 2))
    return sq

def save_ico(im, filepath, sizes):
    """Saves a multi-resolution Windows/browser .ico file."""
    icons = [im.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    icons[0].save(filepath, format='ICO', sizes=[(s, s) for s in sizes])

def create_svg_wrapper(png_image, width, height):
    """Creates an SVG wrapping a base64 encoded PNG for crisp rendering."""
    import io
    buf = io.BytesIO()
    png_image.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {width} {height}" width="100%" height="100%">\n  <image href="data:image/png;base64,{b64}" width="{width}" height="{height}" />\n</svg>\n'
    return svg

def main():
    root = r'e:\Legendary One\youpeak\source'
    canonical_source = r'e:\Legendary One\youpeak\documents\pic\ChatGPT Image Sep 25, 2026, 03_58_39 PM.png'

    if not os.path.exists(canonical_source):
        canonical_source = os.path.join(root, 'Youpeak_Flutter/assets/icons/logo.png')

    print(f"Using source: {canonical_source}")

    # Build master transparent image
    master_1254 = build_transparent_master(canonical_source)
    mark_squircle = build_mark_centered_squircle(master_1254)
    wordmark = build_horizontal_wordmark(master_1254)
    adaptive_fg = build_adaptive_foreground(master_1254)
    notif_sil = build_notification_silhouette(master_1254)

    # 1. Canonical Shared Branding Directories
    for branding_dir in [
        os.path.join(root, 'assets/branding'),
        os.path.join(root, 'Youpeak_Flutter/assets/branding')
    ]:
        os.makedirs(branding_dir, exist_ok=True)
        shutil.copyfile(canonical_source, os.path.join(branding_dir, 'youpeak_logo_canonical.png'))
        master_1254.save(os.path.join(branding_dir, 'youpeak_logo_transparent.png'))
        mark_squircle.save(os.path.join(branding_dir, 'youpeak_mark_icon.png'))
        wordmark.save(os.path.join(branding_dir, 'youpeak_wordmark.png'))
        notif_sil.save(os.path.join(branding_dir, 'youpeak_notification_silhouette.png'))

    # 2. Flutter App Assets (Youpeak_Flutter/assets/icons)
    icons_dir = os.path.join(root, 'Youpeak_Flutter/assets/icons')
    os.makedirs(icons_dir, exist_ok=True)

    master_1254.save(os.path.join(icons_dir, 'logo.png'))

    # appLogo.png (1024x1024 master launcher icon)
    logo_1024 = master_1254.resize((1024, 1024), Image.Resampling.LANCZOS)
    logo_1024.save(os.path.join(icons_dir, 'appLogo.png'))
    logo_1024.save(os.path.join(icons_dir, 'app_logo.png'))
    logo_1024.save(os.path.join(icons_dir, 'app_logo_icon.png'))

    # splash_logo.png (1152x1152 with safe margin)
    splash_1152 = Image.new('RGBA', (1152, 1152), (0, 0, 0, 0))
    splash_inner = master_1254.resize((960, 960), Image.Resampling.LANCZOS)
    splash_1152.paste(splash_inner, ((1152 - 960) // 2, (1152 - 960) // 2), splash_inner)
    splash_1152.save(os.path.join(icons_dir, 'splash_logo.png'))

    # wordmark
    wordmark.save(os.path.join(icons_dir, 'youpeak_wordmark.png'))

    # adaptive foreground and notification icon
    adaptive_fg.save(os.path.join(icons_dir, 'ic_launcher_foreground.png'))
    notif_96 = notif_sil.resize((96, 96), Image.Resampling.LANCZOS)
    notif_96.save(os.path.join(icons_dir, 'ic_notification.png'))

    # 3. Flutter Web (Youpeak_Flutter/web)
    web_dir = os.path.join(root, 'Youpeak_Flutter/web')
    # favicon.png: 64x64 crisp icon-only squircle
    fav_64 = mark_squircle.resize((64, 64), Image.Resampling.LANCZOS)
    fav_64.save(os.path.join(web_dir, 'favicon.png'))

    web_icons = os.path.join(web_dir, 'icons')
    os.makedirs(web_icons, exist_ok=True)
    master_1254.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(web_icons, 'Icon-192.png'))
    master_1254.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(web_icons, 'Icon-512.png'))
    build_maskable_pwa(master_1254, 192).save(os.path.join(web_icons, 'Icon-maskable-192.png'))
    build_maskable_pwa(master_1254, 512).save(os.path.join(web_icons, 'Icon-maskable-512.png'))

    # 4. Android Native Resources
    res_dir = os.path.join(root, 'Youpeak_Flutter/android/app/src/main/res')
    # Drawables
    drawable_dir = os.path.join(res_dir, 'drawable')
    drawable_logo = master_1254.resize((512, 512), Image.Resampling.LANCZOS)
    drawable_logo.save(os.path.join(drawable_dir, 'splash_logo.png'))
    drawable_logo.save(os.path.join(drawable_dir, 'ic_splash.png'))
    drawable_logo.save(os.path.join(drawable_dir, 'logo.png'))

    drawable_v21_dir = os.path.join(res_dir, 'drawable-v21')
    if os.path.exists(drawable_v21_dir):
        drawable_logo.save(os.path.join(drawable_v21_dir, 'splash_logo.png'))

    # Notification icon in drawable
    notif_96.save(os.path.join(drawable_dir, 'ic_notification.png'))

    # Mipmap densities:
    # mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192
    # adaptive fg densities (108dp base):
    # mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432
    densities = {
        'mipmap-mdpi': (48, 108, 24),
        'mipmap-hdpi': (72, 162, 36),
        'mipmap-xhdpi': (96, 216, 48),
        'mipmap-xxhdpi': (144, 324, 72),
        'mipmap-xxxhdpi': (192, 432, 96),
    }

    for mdir, (icon_sz, fg_sz, notif_sz) in densities.items():
        dpath = os.path.join(res_dir, mdir)
        os.makedirs(dpath, exist_ok=True)
        legacy_icon = master_1254.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS)
        legacy_icon.save(os.path.join(dpath, 'ic_launcher.png'))
        legacy_icon.save(os.path.join(dpath, 'ic_launcher_round.png'))
        legacy_icon.save(os.path.join(dpath, 'launcher_icon.png'))

        fg_icon = adaptive_fg.resize((fg_sz, fg_sz), Image.Resampling.LANCZOS)
        fg_icon.save(os.path.join(dpath, 'ic_launcher_foreground.png'))

    # 5. Windows (.ico)
    win_res = os.path.join(root, 'Youpeak_Flutter/windows/runner/resources')
    if os.path.exists(win_res):
        save_ico(mark_squircle, os.path.join(win_res, 'app_icon.ico'), [16, 24, 32, 48, 64, 128, 256])

    # 6. macOS AppIcon
    mac_appicon = os.path.join(root, 'Youpeak_Flutter/macos/Runner/Assets.xcassets/AppIcon.appiconset')
    if os.path.exists(mac_appicon):
        for sz in [16, 32, 64, 128, 256, 512, 1024]:
            master_1254.resize((sz, sz), Image.Resampling.LANCZOS).save(
                os.path.join(mac_appicon, f'app_icon_{sz}.png')
            )

    # 7. Admin Frontend
    admin_public = os.path.join(root, 'Admin_Panel/frontend/public')
    admin_images = os.path.join(root, 'Admin_Panel/frontend/src/assets/images')

    save_ico(mark_squircle, os.path.join(admin_public, 'favicon.ico'), [16, 24, 32, 48, 64, 128, 256])
    logo_512 = master_1254.resize((512, 512), Image.Resampling.LANCZOS)
    logo_192 = master_1254.resize((192, 192), Image.Resampling.LANCZOS)

    logo_192.save(os.path.join(admin_public, 'logo192.png'))
    logo_512.save(os.path.join(admin_public, 'logo512.png'))
    logo_512.save(os.path.join(admin_public, 'YouPeakLogo.png'))

    logo_512.save(os.path.join(admin_images, 'logo.png'))
    logo_512.save(os.path.join(admin_images, 'YouPeakLogo.png'))

    svg_content = create_svg_wrapper(master_1254, 1254, 1254)
    with open(os.path.join(admin_images, 'logo.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)

    print("All branding assets generated and deployed successfully!")

if __name__ == '__main__':
    main()
