import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/file_upload/file_upload_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class ConvertVideoApi {
  static FileUploadModel? _fileUploadModel;
  static Future<String?> callApi(String videoPath, bool isNormalVideo) async {
    AppSettings.showLog("Convert Video Api Calling...");

    try {
      var headers = {'key': Constant.secretKey};

      var request = http.MultipartRequest('PUT', Uri.parse(Constant.baseURL + Constant.fileUpload));
      request.fields.addAll(
        isNormalVideo
            ? {'folderStructure': Constant.normalVideo, 'keyName': '${DateTime.now().millisecondsSinceEpoch}.mp4'}
            : {'folderStructure': Constant.shortsVideo, 'keyName': '${DateTime.now().millisecondsSinceEpoch}.mp4'},
      );

      request.files.add(await http.MultipartFile.fromPath('content', videoPath));

      request.headers.addAll(headers);

      final response = await request.send();

      if (response.statusCode == 200) {
        final responseBody = await response.stream.bytesToString();
        final jsonResult = jsonDecode(responseBody);
        _fileUploadModel = FileUploadModel.fromJson(jsonResult);
        AppSettings.showLog("Convert Video Api Response => ${_fileUploadModel?.url}");
        return _fileUploadModel!.url!;
      } else {
        AppSettings.showLog("Convert Video Api Response Error");
      }
      AppSettings.showLog("Convert Video Api Error");
      return null;
    } catch (e) {
      AppSettings.showLog("Convert Video Api Error => $e");
      return null;
    }
  }
}

// import 'dart:convert';
// import 'dart:io';
//
// import 'package:http/http.dart' as http;
// import 'package:Live1/pages/custom_pages/file_upload_page/file_upload_model.dart';
// import 'package:Live1/utils/constant/app_constant.dart';
// import 'package:Live1/utils/settings/app_settings.dart';
//
// class ConvertVideoApi {
//   static FileUploadModel? _fileUploadModel;
//
//   static Future<String?> callApi(String videoPath, bool isNormalVideo) async {
//     AppSettings.showLog("Convert Video Api Calling...");
//
//     try {
//       final client = http.Client();
//
//       var headers = {'key': Constant.secretKey};
//
//       var request = http.MultipartRequest('POST', Uri.parse(Constant.baseURL + Constant.fileUpload));
//       request.fields.addAll(
//         isNormalVideo
//             ? {'folderStructure': Constant.normalVideo, 'keyName': '${DateTime.now().millisecondsSinceEpoch}.mp4'}
//             : {'folderStructure': Constant.shortsVideo, 'keyName': '${DateTime.now().millisecondsSinceEpoch}.mp4'},
//       );
//
//       final fileStream = http.ByteStream.fromBytes(File(videoPath).readAsBytesSync());
//       final fileLength = await File(videoPath).length();
//
//       final multipartFile = http.MultipartFile('content', fileStream, fileLength, filename: 'your_file_name');
//
//       request.files.add(multipartFile);
//
//       request.headers.addAll(headers);
//
//       final response = await client.send(request).timeout(Duration(minutes: 5), onTimeout: () {
//         client.close(); // Close the client on timeout
//         throw TimeoutException('The connection timed out');
//       });
//
//       if (response.statusCode == 200) {
//         final responseBody = await response.stream.bytesToString();
//         final jsonResult = jsonDecode(responseBody);
//         _fileUploadModel = FileUploadModel.fromJson(jsonResult);
//         AppSettings.showLog("Convert Video Api Response => ${_fileUploadModel?.url}");
//         return _fileUploadModel!.url!;
//       } else {
//         AppSettings.showLog("Convert Video Api Response Error");
//       }
//       AppSettings.showLog("Convert Video Api Error");
//       return null;
//     } catch (e) {
//       AppSettings.showLog("Convert Video Api Error => $e");
//       return null;
//     }
//   }
// }
