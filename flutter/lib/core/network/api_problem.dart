import 'package:youpeak/core/network/app_api_client.dart';

/// Why a per-user API call did not give the app what it asked for, kept
/// apart so the screen can say the right thing and offer the right action
/// ("Sign in again" is not the answer to a dropped connection, and "Retry" is
/// not the answer to a blocked account).
enum ApiProblemKind {
  /// No signed-in session on this device (nothing to send).
  noSession,

  /// A session exists but the server no longer accepts it.
  sessionExpired,

  /// The server knows who this is and refuses the action (not their channel,
  /// a mismatched account, …).
  forbidden,

  /// The account itself is blocked.
  blocked,

  /// The thing asked for doesn't exist.
  notFound,

  /// No answer at all (offline, DNS, TLS).
  offline,

  /// No answer in time.
  timeout,

  /// The server failed (HTTP 5xx).
  server,

  /// The server answered and said no, with a reason.
  refused,

  /// The server answered with something this app can't read.
  unreadable,
}

/// A classified API failure: [message] is what to show, [code] and
/// [diagnostic] are short, sanitized details for support and logs (never a
/// token, key or URL).
class ApiProblem {
  const ApiProblem(this.kind, {this.code = "", this.serverMessage = "", this.httpStatus});

  factory ApiProblem.fromException(ApiException e) {
    final status = e.httpStatus;
    final code = e.code;
    final text = e.message.trim();
    final lower = text.toLowerCase();

    if (code == "NETWORK_TIMEOUT") return ApiProblem(ApiProblemKind.timeout, code: code, serverMessage: text);
    if (code == "NETWORK_ERROR") return ApiProblem(ApiProblemKind.offline, code: code, serverMessage: text);
    if (code == "AUTH_REQUIRED") return ApiProblem(ApiProblemKind.noSession, code: code, httpStatus: status);
    if (code == "AUTH_NO_ACCOUNT") {
      return ApiProblem(ApiProblemKind.notFound, code: code, serverMessage: "This account no longer exists. Sign in again or create a new account.", httpStatus: status);
    }
    if (code == "AUTH_INVALID" || code == "AUTH_EXPIRED" || (status == 401)) {
      return ApiProblem(ApiProblemKind.sessionExpired, code: code, httpStatus: status);
    }
    if (code == "USER_BLOCKED" || (lower.contains("blocked") && (status == 403 || status == 200))) {
      return ApiProblem(ApiProblemKind.blocked, code: code, serverMessage: text, httpStatus: status);
    }
    if (status == 403) return ApiProblem(ApiProblemKind.forbidden, code: code, serverMessage: text, httpStatus: status);
    if (status == 404 || code.endsWith("_NOT_FOUND") || (status == 200 && lower.contains("does not found"))) {
      return ApiProblem(ApiProblemKind.notFound, code: code, serverMessage: text, httpStatus: status);
    }
    if (status != null && status >= 500) return ApiProblem(ApiProblemKind.server, code: code, httpStatus: status);
    // A reply with no JSON body at all (a proxy page, an HTML error) or a 200
    // that isn't one of ours.
    if (e.data.isEmpty) return ApiProblem(ApiProblemKind.unreadable, code: code, httpStatus: status);
    return ApiProblem(ApiProblemKind.refused, code: code, serverMessage: text, httpStatus: status);
  }

  /// An unreadable reply that arrived as HTTP 200 (the shape wasn't what the
  /// app expects).
  const ApiProblem.unreadable({int? httpStatus}) : this(ApiProblemKind.unreadable, httpStatus: httpStatus);

  final ApiProblemKind kind;
  final String code;
  final String serverMessage;
  final int? httpStatus;

  bool get needsSignIn => kind == ApiProblemKind.noSession || kind == ApiProblemKind.sessionExpired;

  /// Trying the same thing again can plausibly work.
  bool get canRetry => kind == ApiProblemKind.offline || kind == ApiProblemKind.timeout || kind == ApiProblemKind.server || kind == ApiProblemKind.unreadable;

  /// Short code to show in small print / quote to support, e.g. "HTTP 401 AUTH_INVALID".
  String get diagnostic {
    final parts = <String>[if (httpStatus != null) "HTTP $httpStatus", if (code.isNotEmpty) code, if (code.isEmpty && httpStatus == null) kind.name];
    return parts.join(" ");
  }

  /// What to tell the person. [what] completes "…couldn't open [your channel]".
  String message({String what = "this"}) {
    switch (kind) {
      case ApiProblemKind.noSession:
        return "You're not signed in on this device. Sign in again to continue.";
      case ApiProblemKind.sessionExpired:
        return "Your session has expired. Sign in again to continue.";
      case ApiProblemKind.blocked:
        return "Your account is blocked, so $what isn't available. Contact YouPeak support.";
      case ApiProblemKind.forbidden:
        return serverMessage.isNotEmpty ? serverMessage : "This account isn't allowed to open $what.";
      case ApiProblemKind.notFound:
        return serverMessage.isNotEmpty ? serverMessage : "YouPeak couldn't find $what.";
      case ApiProblemKind.offline:
        return "Couldn't reach YouPeak. Check your internet connection and try again.";
      case ApiProblemKind.timeout:
        return "YouPeak took too long to answer. Check your connection and try again.";
      case ApiProblemKind.server:
        return "YouPeak had a problem on its side. Please try again in a moment.";
      case ApiProblemKind.unreadable:
        return "YouPeak sent a reply this version of the app couldn't read. Update the app, or try again later.";
      case ApiProblemKind.refused:
        return serverMessage.isNotEmpty ? serverMessage : "YouPeak couldn't open $what. Please try again.";
    }
  }
}
