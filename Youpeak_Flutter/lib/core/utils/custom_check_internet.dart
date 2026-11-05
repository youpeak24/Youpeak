import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class CustomCheckInternet {
  static RxBool isConnect = false.obs;
  static void onCheck() async {
    // Initial check to get the current status immediately
    final ConnectivityResult result = await Connectivity().checkConnectivity();
    _updateState(result);

    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      _updateState(result);
    });
  }

  static void _updateState(ConnectivityResult result) {
    switch (result) {
      case ConnectivityResult.none:
        isConnect.value = false;
        AppSettings.showLog("Network Not Connect...");
        break;
      default:
        isConnect.value = true;
        AppSettings.showLog("Network Connected...");
        break;
    }
  }
}
