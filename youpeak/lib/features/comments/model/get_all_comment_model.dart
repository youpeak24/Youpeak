import 'dart:convert';

GetAllCommentModel getAllCommentModelFromJson(String str) => GetAllCommentModel.fromJson(json.decode(str));

String getAllCommentModelToJson(GetAllCommentModel data) => json.encode(data.toJson());

class GetAllCommentModel {
  GetAllCommentModel({
    bool? status,
    String? message,
    List<VideoComment>? videoComment,
  }) {
    _status = status;
    _message = message;
    _videoComment = videoComment;
  }

  GetAllCommentModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['videoComment'] != null) {
      _videoComment = [];
      json['videoComment'].forEach((v) {
        _videoComment?.add(VideoComment.fromJson(v));
      });
    }
  }

  bool? _status;
  String? _message;
  List<VideoComment>? _videoComment;

  GetAllCommentModel copyWith({
    bool? status,
    String? message,
    List<VideoComment>? videoComment,
  }) =>
      GetAllCommentModel(
        status: status ?? _status,
        message: message ?? _message,
        videoComment: videoComment ?? _videoComment,
      );

  bool? get status => _status;

  String? get message => _message;

  List<VideoComment>? get videoComment => _videoComment;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_videoComment != null) {
      map['videoComment'] = _videoComment?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

VideoComment videoCommentFromJson(String str) => VideoComment.fromJson(json.decode(str));

String videoCommentToJson(VideoComment data) => json.encode(data.toJson());

class VideoComment {
  VideoComment({
    String? id,
    int? like,
    int? dislike,
    int? totalReplies,
    dynamic recursiveCommentId,
    String? videoId,
    String? commentText,
    String? createdAt,
    String? userId,
    String? fullName,
    String? userImage,
    bool? isLike,
    bool? isDislike,
    String? time,
  }) {
    _id = id;
    _like = like;
    _dislike = dislike;
    _totalReplies = totalReplies;
    _recursiveCommentId = recursiveCommentId;
    _videoId = videoId;
    _commentText = commentText;
    _createdAt = createdAt;
    _userId = userId;
    _fullName = fullName;
    _userImage = userImage;
    _isLike = isLike;
    _isDislike = isDislike;
    _time = time;
  }

  VideoComment.fromJson(dynamic json) {
    _id = json['_id'];
    _like = json['like'];
    _dislike = json['dislike'];
    _totalReplies = json['totalReplies'];
    _recursiveCommentId = json['recursiveCommentId'];
    _videoId = json['videoId'];
    _commentText = json['commentText'];
    _createdAt = json['createdAt'];
    _userId = json['userId'];
    _fullName = json['fullName'];
    _userImage = json['userImage'];
    _isLike = json['isLike'];
    _isDislike = json['isDislike'];
    _time = json['time'];
  }

  String? _id;
  int? _like;
  int? _dislike;
  int? _totalReplies;
  dynamic _recursiveCommentId;
  String? _videoId;
  String? _commentText;
  String? _createdAt;
  String? _userId;
  String? _fullName;
  String? _userImage;
  bool? _isLike;
  bool? _isDislike;
  String? _time;

  VideoComment copyWith({
    String? id,
    int? like,
    int? dislike,
    int? totalReplies,
    dynamic recursiveCommentId,
    String? videoId,
    String? commentText,
    String? createdAt,
    String? userId,
    String? fullName,
    String? userImage,
    bool? isLike,
    bool? isDislike,
    String? time,
  }) =>
      VideoComment(
        id: id ?? _id,
        like: like ?? _like,
        dislike: dislike ?? _dislike,
        totalReplies: totalReplies ?? _totalReplies,
        recursiveCommentId: recursiveCommentId ?? _recursiveCommentId,
        videoId: videoId ?? _videoId,
        commentText: commentText ?? _commentText,
        createdAt: createdAt ?? _createdAt,
        userId: userId ?? _userId,
        fullName: fullName ?? _fullName,
        userImage: userImage ?? _userImage,
        isLike: isLike ?? _isLike,
        isDislike: isDislike ?? _isDislike,
        time: time ?? _time,
      );

  String? get id => _id;

  int? get like => _like;

  int? get dislike => _dislike;

  int? get totalReplies => _totalReplies;

  dynamic get recursiveCommentId => _recursiveCommentId;

  String? get videoId => _videoId;

  String? get commentText => _commentText;

  String? get createdAt => _createdAt;

  String? get userId => _userId;

  String? get fullName => _fullName;

  String? get userImage => _userImage;

  bool? get isLike => _isLike;

  bool? get isDislike => _isDislike;

  String? get time => _time;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['like'] = _like;
    map['dislike'] = _dislike;
    map['totalReplies'] = _totalReplies;
    map['recursiveCommentId'] = _recursiveCommentId;
    map['videoId'] = _videoId;
    map['commentText'] = _commentText;
    map['createdAt'] = _createdAt;
    map['userId'] = _userId;
    map['fullName'] = _fullName;
    map['userImage'] = _userImage;
    map['isLike'] = _isLike;
    map['isDislike'] = _isDislike;
    map['time'] = _time;
    return map;
  }
}
