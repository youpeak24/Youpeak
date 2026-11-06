import 'package:flutter_web_plugins/url_strategy.dart';

// GetX names each route after its page class ("/NormalVideoDetailsView"),
// and release builds minify class names, so the address bar used to show
// routes like "#/minified:Du" (and reloading one of them opened a route
// that doesn't exist). Routes aren't addressable, so keep the hash at "/":
// history entries are still pushed, so the browser Back button still pops
// pages, and a reload starts the app from the splash screen.
class _StableHashUrlStrategy extends HashUrlStrategy {
  const _StableHashUrlStrategy();

  // Old bookmarks may still carry a "#/minified:…" route; start from "/".
  @override
  String getPath() => '/';

  @override
  String prepareExternalUrl(String internalUrl) => super.prepareExternalUrl('/');
}

void configureBrowserUrl() => setUrlStrategy(const _StableHashUrlStrategy());
