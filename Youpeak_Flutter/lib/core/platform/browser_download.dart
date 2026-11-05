// Saves a remote file to the browser's Downloads folder (web build only; the
// phone app keeps downloads in app storage for offline playback instead).
export 'browser_download_stub.dart' if (dart.library.js_interop) 'browser_download_web.dart';
