import 'dart:convert';

FileUploadModel fileUploadModelFromJson(String str) => FileUploadModel.fromJson(json.decode(str));
String fileUploadModelToJson(FileUploadModel data) => json.encode(data.toJson());

class FileUploadModel {
  FileUploadModel({
    bool? status,
    String? message,
    String? url,
  }) {
    _status = status;
    _message = message;
    _url = url;
  }

  FileUploadModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _url = json['url'];
  }
  bool? _status;
  String? _message;
  String? _url;
  FileUploadModel copyWith({
    bool? status,
    String? message,
    String? url,
  }) =>
      FileUploadModel(
        status: status ?? _status,
        message: message ?? _message,
        url: url ?? _url,
      );
  bool? get status => _status;
  String? get message => _message;
  String? get url => _url;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['url'] = _url;
    return map;
  }
}
