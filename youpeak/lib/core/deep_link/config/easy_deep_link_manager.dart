import 'dart:async';
import 'package:flutter/material.dart';
import 'package:youpeak/core/deep_link/config/easy_deep_link_config.dart';
import 'package:app_links/app_links.dart';

class EasyDeepLinkManager {
  static EasyDeepLinkManager? _instance;
  static EasyDeepLinkManager get instance => _instance ??= EasyDeepLinkManager._();
  EasyDeepLinkManager._();

  EasyDeepLinkConfig? _config;
  AppLinks? _appLinks;

  StreamSubscription<Uri>? _linkSubscription;

  final StreamController<DeepLinkInfo> _linkController = StreamController<DeepLinkInfo>.broadcast();

  Stream<DeepLinkInfo> get linkStream => _linkController.stream;

  Future<void> initialize(EasyDeepLinkConfig config) async {
    _config = config;
    _appLinks = AppLinks();
    await _handleInitialLink();
    _startListening();
    if (config.debug) {
      debugPrint('EasyDeepLinks: Initialized with domain ${config.domain}');
    }
  }

  Future<void> _handleInitialLink() async {
    try {
      final initialLink = await _appLinks!.getInitialLink();
      if (initialLink != null) {
        _processLink(initialLink, isInitial: true);
      }
    } catch (e) {
      if (_config?.debug == true) {
        debugPrint('EasyDeepLinks: Failed to get initial link: $e');
      }
    }
  }

  void _startListening() {
    _linkSubscription = _appLinks!.uriLinkStream.listen(
      (uri) => _processLink(uri, isInitial: false),
      onError: (error) {
        if (_config?.debug == true) {
          debugPrint('EasyDeepLinks: Link stream error: $error');
        }
      },
    );
  }

  void _processLink(Uri uri, {required bool isInitial}) {
    if (_config == null) return;

    final isOurHttpsLink = (uri.scheme == 'https' || uri.scheme == 'http') && uri.host == _config!.domain;
    final isOurCustomScheme = _config!.customScheme != null && uri.scheme == _config!.customScheme;

    if (!isOurHttpsLink && !isOurCustomScheme) {
      if (_config!.debug) {
        debugPrint('EasyDeepLinks: Ignoring link $uri (not for our app)');
      }
      return;
    }

    final linkInfo = DeepLinkInfo(url: uri.toString(), pathSegments: uri.pathSegments, queryParams: uri.queryParameters, isInitialLink: isInitial);

    if (_config!.debug) {
      debugPrint('EasyDeepLinks: Processed link: $linkInfo');
    }

    _linkController.add(linkInfo);
  }

  String generateLink(String path, [Map<String, String>? params]) {
    if (_config == null) {
      throw StateError('EasyDeepLinks not initialized');
    }

    final uri = Uri.https(_config!.domain, path, params);
    return uri.toString();
  }

  void dispose() {
    _linkSubscription?.cancel();
    _linkController.close();
    _instance = null;
  }
}
