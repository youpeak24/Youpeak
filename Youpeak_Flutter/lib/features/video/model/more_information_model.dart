class MoreInformationModel {
  String videoId;
  String channelId;

  String title;
  num videoType;
  num videoTime;
  String videoUrl;
  bool isSave;

  String channelName;
  String videoImage;
  num views;

  MoreInformationModel({
    required this.channelId,
    required this.videoId,
    required this.title,
    required this.videoType,
    required this.videoTime,
    required this.videoUrl,
    required this.videoImage,
    required this.channelName,
    required this.views,
    required this.isSave,
  });
}
