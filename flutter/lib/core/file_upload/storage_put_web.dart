import 'dart:async';
import 'dart:js_interop';

import 'package:web/web.dart' as web;
import 'package:youpeak/core/file_upload/upload_models.dart';

/// PUTs the picked file (a blob: URL in the browser) to [url] with an
/// XMLHttpRequest, so the page can show real progress and abort the transfer.
Future<StoragePutResult> putFileToStorage({
  required String url,
  required String path,
  required String contentType,
  required void Function(double fraction) onProgress,
  required UploadCancelToken cancel,
}) async {
  final done = Completer<StoragePutResult>();
  final xhr = web.XMLHttpRequest();
  try {
    // The picker's blob: URL is read by the browser itself; nothing is copied
    // into the Dart heap.
    final blob = await (await web.window.fetch(path.toJS).toDart).blob().toDart;
    onProgress(0);

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = ((web.ProgressEvent e) {
      if (e.lengthComputable && e.total > 0) onProgress((e.loaded / e.total).clamp(0.0, 1.0).toDouble());
    }).toJS;
    xhr.onload = ((web.Event _) {
      if (done.isCompleted) return;
      onProgress(1);
      done.complete(StoragePutResult(status: xhr.status, body: xhr.responseText));
    }).toJS;
    xhr.onerror = ((web.Event _) {
      if (!done.isCompleted) done.complete(const StoragePutResult(status: 0, networkError: true));
    }).toJS;
    xhr.ontimeout = ((web.Event _) {
      if (!done.isCompleted) done.complete(const StoragePutResult(status: 0, networkError: true));
    }).toJS;
    xhr.onabort = ((web.Event _) {
      if (!done.isCompleted) done.complete(const StoragePutResult(status: 0, aborted: true));
    }).toJS;
    xhr.timeout = 0; // no overall limit: a long video on a slow link is legitimate

    cancel.attach(() => xhr.abort());
    xhr.send(blob);
    return await done.future;
  } catch (_) {
    if (cancel.isCancelled) return const StoragePutResult(status: 0, aborted: true);
    return const StoragePutResult(status: 0, networkError: true);
  } finally {
    cancel.detach();
  }
}
