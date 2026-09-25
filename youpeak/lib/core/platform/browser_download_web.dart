import 'dart:js_interop';

import 'package:http/http.dart' as http;
import 'package:web/web.dart' as web;

// Fetches the file and hands it to the browser as a download. If the media
// host doesn't allow cross-origin reads (no CORS), the file is opened in a new
// tab instead, where the browser's own player offers "Save".
Future<bool> saveInBrowser(String url, String fileName) async {
  try {
    final response = await http.get(Uri.parse(url));
    if (response.statusCode != 200) throw StateError("HTTP ${response.statusCode}");

    final contentType = response.headers["content-type"] ?? "video/mp4";
    final blob = web.Blob(<JSAny>[response.bodyBytes.toJS].toJS, web.BlobPropertyBag(type: contentType));
    final objectUrl = web.URL.createObjectURL(blob);
    _click(objectUrl, download: fileName);
    Future.delayed(const Duration(minutes: 1), () => web.URL.revokeObjectURL(objectUrl));
    return true;
  } catch (_) {
    try {
      _click(url, newTab: true);
      return true;
    } catch (_) {
      return false;
    }
  }
}

void _click(String href, {String? download, bool newTab = false}) {
  final anchor = web.HTMLAnchorElement()
    ..href = href
    ..style.display = "none";
  if (download != null) anchor.download = download;
  if (newTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener";
  }
  web.document.body!.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
