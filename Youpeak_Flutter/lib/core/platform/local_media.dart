import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';

// Media the user picked or recorded is passed around the app as a path
// string. On Android/iOS that is a file path; in the browser it is a blob:
// object URL, which dart:io's File cannot open. Everything that reads a
// picked file goes through here so both cases work.
class LocalMedia {
  LocalMedia._();

  // Blob URLs carry no file name or type, so the picker's XFile is kept to
  // give uploads a correct name and Content-Type.
  static final Map<String, XFile> _webFiles = {};

  static String remember(XFile file) {
    if (kIsWeb) _webFiles[file.path] = file;
    return file.path;
  }

  static XFile _file(String path) => _webFiles[path] ?? XFile(path);

  static bool exists(String path) {
    if (path.isEmpty) return false;
    if (kIsWeb) return true;
    return File(path).existsSync();
  }

  static Future<Uint8List> readBytes(String path) => _file(path).readAsBytes();

  static Future<int> length(String path) => _file(path).length();

  static String? mimeType(String path) {
    final known = _webFiles[path]?.mimeType;
    if (known != null && known.isNotEmpty) return known;
    final name = fileName(path).toLowerCase();
    if (name.endsWith(".mp4")) return "video/mp4";
    if (name.endsWith(".mov")) return "video/quicktime";
    if (name.endsWith(".webm")) return "video/webm";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    return null;
  }

  static String fileName(String path) {
    final known = _webFiles[path]?.name;
    if (known != null && known.isNotEmpty) return known;
    return path.split(RegExp(r"[\\/]")).last;
  }

  static ImageProvider imageProvider(String path) => kIsWeb ? NetworkImage(path) : FileImage(File(path)) as ImageProvider;

  static Widget image(String path, {double? height, double? width, BoxFit? fit}) => kIsWeb
      ? Image.network(path, height: height, width: width, fit: fit)
      : Image.file(File(path), height: height, width: width, fit: fit);

  static VideoPlayerController videoController(String path) =>
      kIsWeb ? VideoPlayerController.networkUrl(Uri.parse(path)) : VideoPlayerController.file(File(path));

  static Future<http.MultipartFile> multipartFile(String field, String path) async {
    if (!kIsWeb) return http.MultipartFile.fromPath(field, path);
    return http.MultipartFile.fromBytes(field, await readBytes(path), filename: fileName(path));
  }
}
