// Browser fullscreen (web build only; no-ops in the phone app, where
// fullscreen video means rotating to landscape).
export 'browser_fullscreen_stub.dart' if (dart.library.js_interop) 'browser_fullscreen_web.dart';
