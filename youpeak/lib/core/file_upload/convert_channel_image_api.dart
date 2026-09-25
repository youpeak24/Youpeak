import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/file_upload/file_upload_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class ConvertChannelImageApi {
  static FileUploadModel? _fileUploadModel;
  static Future<String?> callApi(String imagePath) async {
    AppSettings.showLog("Convert Image Api Calling...");
    try {
      var headers = {'key': Constant.secretKey};

      var request = http.MultipartRequest('PUT', Uri.parse(Constant.baseURL + Constant.fileUpload));
      request.fields.addAll({'folderStructure': Constant.channelImage, 'keyName': '${DateTime.now().millisecondsSinceEpoch}.jpg'});

      request.files.add(await http.MultipartFile.fromPath('content', imagePath));

      request.headers.addAll(headers);

      final response = await request.send();

      if (response.statusCode == 200) {
        final responseBody = await response.stream.bytesToString();
        final jsonResult = jsonDecode(responseBody);
        _fileUploadModel = FileUploadModel.fromJson(jsonResult);
        AppSettings.showLog("Convert Image Api Response => ${_fileUploadModel?.url}");
        return _fileUploadModel!.url!;
      } else {
        AppSettings.showLog("Convert Image Api Status Code Error");
      }
    } catch (e) {
      AppSettings.showLog("Convert Image Api Error");
    }

    return null;
  }
}
