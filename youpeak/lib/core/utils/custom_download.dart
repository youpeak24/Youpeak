import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:path_provider/path_provider.dart';

class CustomDownload {
  static Future<String?> download(String videoUrl, String videoId) async {
    try {
      final response = await http.get(Uri.parse(videoUrl));
      if (response.statusCode == 200) {
        final Uint8List bytes = response.bodyBytes;

        final filePath = Platform.isAndroid
            ? await getExternalStorageDirectory()
            : await getApplicationSupportDirectory();

        final downloadPath = '${filePath?.path}/MyDownload';

        Directory(downloadPath).createSync(recursive: true);

        final downloaded = '$downloadPath/$videoId.mp4';

        AppSettings.showLog("Downloaded Video Path => $downloaded");

        final File file = File(downloaded);

        await file.writeAsBytes(bytes);

        CustomToast.celebrate(AppStrings.videoDownloadSuccess.tr, AppVisuals.downloadDone);

        return downloaded;
      } else {
        AppSettings.showLog('Download Video Error !!!');
        CustomToast.show(AppStrings.videoDownloadingFailed.tr);
      }
    } catch (e) {
      AppSettings.showLog("Download Video Failed !!!");
      CustomToast.show(AppStrings.videoDownloadingFailed.tr);
    }
    return null;
  }
}
