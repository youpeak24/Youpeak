// Browser address-bar handling (web build only; a no-op in the phone app).
export 'browser_url_stub.dart' if (dart.library.js_interop) 'browser_url_web.dart';
