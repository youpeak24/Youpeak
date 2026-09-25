import 'dart:convert';

import 'package:youpeak/core/localization/models/language_info.dart';

FetchLanguageModel fetchLanguageModelFromJson(String str) => FetchLanguageModel.fromJson(json.decode(str));

String fetchLanguageModelToJson(FetchLanguageModel data) => json.encode(data.toJson());

class FetchLanguageModel {
  bool? status;
  String? message;
  List<LanguageInfo>? data;
  int? total;

  FetchLanguageModel({
    this.status,
    this.message,
    this.data,
    this.total,
  });

  factory FetchLanguageModel.fromJson(Map<String, dynamic> json) => FetchLanguageModel(
        status: json["status"],
        message: json["message"],
        data: (json["docs"] != null)
            ? List<LanguageInfo>.from(json["docs"].map((x) => LanguageInfo.fromJson(x)))
            : (json["data"] != null)
                ? List<LanguageInfo>.from(json["data"].map((x) => LanguageInfo.fromJson(x)))
                : [],
        total: json["total"] ?? 0,
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "data": data == null ? [] : List<dynamic>.from(data!.map((x) => x.toJson())),
        "total": total,
      };
}
