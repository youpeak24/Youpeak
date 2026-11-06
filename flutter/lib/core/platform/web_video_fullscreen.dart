import 'package:get/get.dart';
import 'package:youpeak/core/platform/browser_fullscreen.dart';

// Fullscreen for the video player in the web app. The phone app goes
// fullscreen by rotating to landscape; a browser window can't rotate, so the
// player shows its landscape (fullscreen) layout while [active] is true and
// asks the browser for real fullscreen.
class WebVideoFullscreen {
  WebVideoFullscreen._();

  static final RxBool active = false.obs;
  static bool _listening = false;

  static void enter() {
    if (!_listening) {
      _listening = true;
      // Esc / F11 leave browser fullscreen without our button.
      onBrowserFullscreenChange((isFullscreen) {
        if (!isFullscreen) active.value = false;
      });
    }
    active.value = true;
    requestBrowserFullscreen();
  }

  static void exit() {
    active.value = false;
    exitBrowserFullscreen();
  }
}
