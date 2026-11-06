library easy_deep_links;

import 'package:youpeak/core/deep_link/config/easy_deep_links.dart';
export 'package:youpeak/core/deep_link/config/easy_deep_link_config.dart';
export 'package:youpeak/core/deep_link/config/easy_deep_link_manager.dart';

class EasyDeepLinks {
  EasyDeepLinks._();

  static EasyDeepLinkManager get _manager => EasyDeepLinkManager.instance;

  static Future<void> initialize(EasyDeepLinkConfig config) async {
    await _manager.initialize(config);
  }

  static Stream<DeepLinkInfo> get linkStream => _manager.linkStream;

  static String generateLink(String path, [Map<String, String>? params]) {
    return _manager.generateLink(path, params);
  }

  static void dispose() {
    _manager.dispose();
  }
}
