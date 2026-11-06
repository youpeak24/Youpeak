import 'package:youpeak/core/network/app_api_client.dart';

/// Why a video upload stopped, in words a person can act on. [code] is stable
/// (for logs and tests); [retryable] says whether trying again can help.
class UploadFailure implements Exception {
  const UploadFailure(this.code, this.userMessage, {this.retryable = false, this.diagnostic = ""});

  final String code;
  final String userMessage;
  final bool retryable;

  /// Sanitized detail for the log: an HTTP status or a short reason. Never a
  /// URL with its signature, a token or a key.
  final String diagnostic;

  @override
  String toString() => "UploadFailure($code${diagnostic.isEmpty ? "" : ": $diagnostic"})";
}

/// Lets the user stop an upload that is in flight.
class UploadCancelToken {
  bool _cancelled = false;
  void Function()? _onCancel;

  bool get isCancelled => _cancelled;

  /// Called once by the transfer that is currently running.
  void attach(void Function() onCancel) {
    _onCancel = onCancel;
    if (_cancelled) onCancel();
  }

  void detach() => _onCancel = null;

  void cancel() {
    if (_cancelled) return;
    _cancelled = true;
    _onCancel?.call();
  }

  void throwIfCancelled() {
    if (_cancelled) throw const UploadFailure("CANCELLED", "Upload cancelled.");
  }
}

/// The outcome of one PUT to the storage URL.
class StoragePutResult {
  const StoragePutResult({required this.status, this.body = "", this.networkError = false, this.aborted = false, this.readError = false});

  /// HTTP status, or 0 when no response was received at all.
  final int status;
  final String body;

  /// No response: offline, DNS, TLS, or (in a browser) a CORS refusal.
  final bool networkError;
  final bool aborted;

  /// The file couldn't be read from the phone (moved, deleted, permission).
  final bool readError;

  bool get ok => status >= 200 && status < 300;
}

/// Maps a failed storage PUT to a [UploadFailure].
UploadFailure failureForStoragePut(StoragePutResult result, {required bool isWeb}) {
  if (result.aborted) return const UploadFailure("CANCELLED", "Upload cancelled.");
  if (result.readError) {
    return const UploadFailure("FILE_UNREADABLE", "Couldn't read the selected video from your phone. Pick it again and retry.", diagnostic: "file read failed");
  }
  if (result.networkError || result.status == 0) {
    return UploadFailure(
      "STORAGE_UNREACHABLE",
      "Couldn't reach the video storage. Check your connection and try again.",
      retryable: true,
      diagnostic: isWeb ? "no response (offline, or blocked by the storage server's CORS policy)" : "no response",
    );
  }
  final status = result.status;
  final detail = "HTTP $status${_s3Code(result.body)}";
  if (status == 403) {
    return UploadFailure("UPLOAD_AUTH_EXPIRED", "The upload permission expired. Starting again…", retryable: true, diagnostic: detail);
  }
  if (status == 413 || result.body.contains("EntityTooLarge")) {
    return UploadFailure("FILE_TOO_LARGE", "This video is too large to upload.", diagnostic: detail);
  }
  if (status == 408 || status == 429 || status >= 500) {
    return UploadFailure("STORAGE_BUSY", "The video storage is busy. Trying again…", retryable: true, diagnostic: detail);
  }
  return UploadFailure("STORAGE_REJECTED", "The video storage refused the upload. Please try again.", diagnostic: detail);
}

String _s3Code(String body) {
  final match = RegExp(r"<Code>([A-Za-z]+)</Code>").firstMatch(body);
  return match == null ? "" : " ${match.group(1)}";
}

/// Maps a refusal from our own API to a [UploadFailure].
UploadFailure failureForApi(ApiException e) {
  final status = e.httpStatus;
  if (e.isAuthError) {
    return UploadFailure("AUTH_REQUIRED", "Your session has ended. Please sign in again.", diagnostic: e.code);
  }
  if (status == 403) {
    // The server knows who this is and says no (a mismatched account, a
    // channel that isn't theirs): signing in again would not change that.
    return UploadFailure("PERMISSION_DENIED", e.message.isNotEmpty ? e.message : "This account isn't allowed to upload here.", diagnostic: "HTTP 403 ${e.code}");
  }
  switch (e.code) {
    case "NETWORK_ERROR":
    case "NETWORK_TIMEOUT":
      return UploadFailure("NETWORK", e.message, retryable: true, diagnostic: e.code);
    case "INVALID_VIDEO_TYPE":
      return UploadFailure("VIDEO_FORMAT", "This video format isn't supported. Use MP4, MOV or WebM.", diagnostic: e.code);
    case "FILE_TOO_LARGE":
    case "UPLOAD_TOO_LARGE":
      return UploadFailure("FILE_TOO_LARGE", e.message, diagnostic: e.code);
    case "R2_NOT_CONFIGURED":
    case "R2_DELIVERY_NOT_CONFIGURED":
      return UploadFailure("UPLOAD_UNAVAILABLE", "Video uploads are temporarily unavailable. Please try again later.", diagnostic: e.code);
    case "UPLOAD_NOT_FOUND":
    case "UPLOAD_EXPIRED":
    case "UPLOAD_INCOMPLETE":
      return UploadFailure("UPLOAD_LOST", e.message, diagnostic: e.code);
    case "UPLOAD_NOT_OWNED":
    case "UPLOAD_ALREADY_USED":
      return UploadFailure("UPLOAD_CONFLICT", e.message, diagnostic: e.code);
  }
  if (status != null && status >= 500) {
    return UploadFailure("SERVER_ERROR", "YouPeak had a problem on its side. Please try again in a moment.", retryable: true, diagnostic: "HTTP $status ${e.code}");
  }
  return UploadFailure("REQUEST_REFUSED", e.message, diagnostic: "HTTP ${status ?? 0} ${e.code}");
}
