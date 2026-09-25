// To parse this JSON data, do
//
//     final saveToWatchLaterModel = saveToWatchLaterModelFromJson(jsonString);

import 'dart:convert';

SaveToWatchLaterModel saveToWatchLaterModelFromJson(String str) => SaveToWatchLaterModel.fromJson(json.decode(str));

String saveToWatchLaterModelToJson(SaveToWatchLaterModel data) => json.encode(data.toJson());

class SaveToWatchLaterModel {
  bool? status;
  String? message;
  bool? isSaved;

  SaveToWatchLaterModel({
    this.status,
    this.message,
    this.isSaved,
  });

  factory SaveToWatchLaterModel.fromJson(Map<String, dynamic> json) => SaveToWatchLaterModel(
        status: json["status"],
        message: json["message"],
        isSaved: json["isSaved"],
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "isSaved": isSaved,
      };
}
