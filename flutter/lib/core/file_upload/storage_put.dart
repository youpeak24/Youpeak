// Sends one file to a presigned storage URL. The browser build streams the
// picked file as a Blob (no copy in memory) and reports progress; the phone
// build keeps the plain request that has always worked there.
export 'storage_put_io.dart' if (dart.library.js_interop) 'storage_put_web.dart';
