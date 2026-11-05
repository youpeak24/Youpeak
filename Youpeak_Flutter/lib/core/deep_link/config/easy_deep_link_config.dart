class EasyDeepLinkConfig {
  final String domain;
  final String? customScheme;
  final bool debug;
  const EasyDeepLinkConfig({required this.domain, this.customScheme, this.debug = false});
}

class DeepLinkInfo {
  final String url;
  final List<String> pathSegments;
  final Map<String, String> queryParams;
  final bool isInitialLink;

  const DeepLinkInfo({required this.url, required this.pathSegments, required this.queryParams, required this.isInitialLink});

  @override
  String toString() {
    return 'DeepLinkInfo(url: $url, pathSegments: $pathSegments, queryParams: $queryParams)';
  }
}
