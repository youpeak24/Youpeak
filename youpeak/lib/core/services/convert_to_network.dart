import 'dart:io';
import 'package:youpeak/core/constants/app_constant.dart';

class ConvertToNetwork {
  static int maxConvertTime = 0;

  static Future<String> convert(String? filePath) async {
    if (filePath == null || filePath.trim().isEmpty) {
      return "";
    }

    String path = filePath.trim();

    // 1. If it already has http:// or https://, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // 2. If it's a local file that exists on device, return as-is
    try {
      if (File(path).existsSync()) {
        return path;
      }
    } catch (_) {}

    // 3. If relative path, prepend base domain
    String cleanDomain = Constant.domain.endsWith('/')
        ? Constant.domain.substring(0, Constant.domain.length - 1)
        : Constant.domain;
    String cleanPath = path.startsWith('/') ? path : '/$path';

    return '$cleanDomain$cleanPath';
  }

  static bool isValidVideoUrl(String? url) {
    if (url == null || url.trim().isEmpty) return false;
    String u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return true;
    try {
      if (File(u).existsSync()) return true;
    } catch (_) {}
    return false;
  }
}

