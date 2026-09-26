import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/network/app_session.dart';

/// A refusal or failure from the per-user API. [code] is the backend's
/// machine-readable reason (e.g. INSUFFICIENT_BALANCE, SECURITY_LOCK,
/// AUTH_REQUIRED); [data] carries any extra fields it sent back.
class ApiException implements Exception {
  const ApiException(this.code, this.message, {this.httpStatus, this.data = const {}});

  final String code;
  final String message;
  final int? httpStatus;
  final Map<String, dynamic> data;

  bool get isAuthError => httpStatus == 401 || code.startsWith("AUTH_");

  @override
  String toString() => "ApiException($code, $message)";
}

typedef IdTokenProvider = Future<String?> Function({bool forceRefresh});

/// JSON client for the per-user backend routes: sends the shared app key and
/// the Firebase ID token, retries once with a refreshed token on 401, and
/// turns `{status: false}` replies into [ApiException]s.
class AppApiClient {
  AppApiClient({http.Client? httpClient, IdTokenProvider? idToken, String? baseUrl, this.timeout = const Duration(seconds: 15)})
      : _http = httpClient ?? http.Client(),
        _idToken = idToken ?? AppSession.idToken,
        _baseUrl = baseUrl;

  final http.Client _http;
  final IdTokenProvider _idToken;
  final String? _baseUrl;
  final Duration timeout;

  String get baseUrl => _baseUrl ?? Constant.baseURL;

  Future<Map<String, dynamic>> get(String path) => _send("GET", path);

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) => _send("POST", path, body: body);

  Future<Map<String, dynamic>> _send(String method, String path, {Map<String, dynamic>? body, bool retried = false}) async {
    final token = await _idToken(forceRefresh: retried);
    if (token == null) {
      throw const ApiException("AUTH_REQUIRED", "Please sign in again to continue.", httpStatus: 401);
    }

    final request = http.Request(method, Uri.parse(baseUrl + path))
      ..headers.addAll({
        "key": Constant.secretKey,
        "Authorization": "Bearer $token",
        "Content-Type": "application/json; charset=UTF-8",
      });
    if (body != null) request.body = jsonEncode(body);

    http.Response response;
    try {
      response = await http.Response.fromStream(await _http.send(request).timeout(timeout));
    } on TimeoutException {
      throw const ApiException("NETWORK_TIMEOUT", "The server took too long to respond. Please try again.");
    } catch (_) {
      throw const ApiException("NETWORK_ERROR", "Couldn't reach YouPeak. Check your connection and try again.");
    }

    Map<String, dynamic> json;
    try {
      final decoded = jsonDecode(response.body);
      json = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    } catch (_) {
      json = <String, dynamic>{};
    }

    if (response.statusCode == 401 && !retried && json["code"] == "AUTH_INVALID") {
      return _send(method, path, body: body, retried: true);
    }
    if (response.statusCode >= 400 || json["status"] != true) {
      throw ApiException(
        (json["code"] as String?) ?? (response.statusCode >= 500 ? "SERVER_ERROR" : "REQUEST_FAILED"),
        (json["message"] as String?) ?? "Something went wrong. Please try again.",
        httpStatus: response.statusCode,
        data: json,
      );
    }
    return json;
  }
}

final appApiClientProvider = Provider<AppApiClient>((ref) => AppApiClient());
