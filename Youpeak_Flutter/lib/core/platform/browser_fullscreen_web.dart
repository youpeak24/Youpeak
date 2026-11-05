import 'dart:js_interop';

import 'package:web/web.dart' as web;

Future<void> requestBrowserFullscreen() async {
  try {
    await web.document.documentElement?.requestFullscreen().toDart;
  } catch (_) {
    // Refused (no user gesture, iframe without allowfullscreen, iOS Safari):
    // the player still fills the window.
  }
}

Future<void> exitBrowserFullscreen() async {
  try {
    if (web.document.fullscreenElement != null) await web.document.exitFullscreen().toDart;
  } catch (_) {}
}

// Also fires when the user leaves fullscreen with Esc / F11.
void onBrowserFullscreenChange(void Function(bool isFullscreen) listener) {
  web.document.addEventListener(
    'fullscreenchange',
    ((web.Event _) => listener(web.document.fullscreenElement != null)).toJS,
  );
}
