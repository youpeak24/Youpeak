import 'dart:convert';

GetAllReplyModel getAllReplyModelFromJson(String str) => GetAllReplyModel.fromJson(json.decode(str));
String getAllReplyModelToJson(GetAllReplyModel data) => json.encode(data.toJson());

class GetAllReplyModel {
  GetAllReplyModel({
    bool? status,
    String? message,
    OriginalVideoComment? originalVideoComment,
    List<RepliesOfComment>? repliesOfComment,
  }) {
    _status = status;
    _message = message;
    _originalVideoComment = originalVideoComment;
    _repliesOfComment = repliesOfComment;
  }

  GetAllReplyModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _originalVideoComment =
        json['originalVideoComment'] != null ? OriginalVideoComment.fromJson(json['originalVideoComment']) : null;
    if (json['repliesOfComment'] != null) {
      _repliesOfComment = [];
      json['repliesOfComment'].forEach((v) {
        _repliesOfComment?.add(RepliesOfComment.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  OriginalVideoComment? _originalVideoComment;
  List<RepliesOfComment>? _repliesOfComment;
  GetAllReplyModel copyWith({
    bool? status,
    String? message,
    OriginalVideoComment? originalVideoComment,
    List<RepliesOfComment>? repliesOfComment,
  }) =>
      GetAllReplyModel(
        status: status ?? _status,
        message: message ?? _message,
        originalVideoComment: originalVideoComment ?? _originalVideoComment,
        repliesOfComment: repliesOfComment ?? _repliesOfComment,
      );
  bool? get status => _status;
  String? get message => _message;
  OriginalVideoComment? get originalVideoComment => _originalVideoComment;
  List<RepliesOfComment>? get repliesOfComment => _repliesOfComment;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_originalVideoComment != null) {
      map['originalVideoComment'] = _originalVideoComment?.toJson();
    }
    if (_repliesOfComment != null) {
      map['repliesOfComment'] = _repliesOfComment?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

RepliesOfComment repliesOfCommentFromJson(String str) => RepliesOfComment.fromJson(json.decode(str));
String repliesOfCommentToJson(RepliesOfComment data) => json.encode(data.toJson());

class RepliesOfComment {
  RepliesOfComment({
    String? id,
    int? like,
    int? dislike,
    int? totalReplies,
    String? recursiveCommentId,
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

  RepliesOfComment.fromJson(dynamic json) {
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
  String? _recursiveCommentId;
  String? _videoId;
  String? _commentText;
  String? _createdAt;
  String? _userId;
  String? _fullName;
  String? _userImage;
  bool? _isLike;
  bool? _isDislike;
  String? _time;
  RepliesOfComment copyWith({
    String? id,
    int? like,
    int? dislike,
    int? totalReplies,
    String? recursiveCommentId,
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
      RepliesOfComment(
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
  String? get recursiveCommentId => _recursiveCommentId;
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

OriginalVideoComment originalVideoCommentFromJson(String str) => OriginalVideoComment.fromJson(json.decode(str));
String originalVideoCommentToJson(OriginalVideoComment data) => json.encode(data.toJson());

class OriginalVideoComment {
  OriginalVideoComment({
    String? id,
    int? like,
    int? dislike,
    int? totalReplies,
    dynamic recursiveCommentId,
    UserId? userId,
    String? videoId,
    int? videoType,
    String? commentText,
    String? createdAt,
    String? updatedAt,
    bool? isLike,
    bool? isDislike,
  }) {
    _id = id;
    _like = like;
    _dislike = dislike;
    _totalReplies = totalReplies;
    _recursiveCommentId = recursiveCommentId;
    _userId = userId;
    _videoId = videoId;
    _videoType = videoType;
    _commentText = commentText;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
    _isLike = isLike;
    _isDislike = isDislike;
  }

  OriginalVideoComment.fromJson(dynamic json) {
    _id = json['_id'];
    _like = json['like'];
    _dislike = json['dislike'];
    _totalReplies = json['totalReplies'];
    _recursiveCommentId = json['recursiveCommentId'];
    _userId = json['userId'] != null ? UserId.fromJson(json['userId']) : null;
    _videoId = json['videoId'];
    _videoType = json['videoType'];
    _commentText = json['commentText'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
    _isLike = json['isLike'];
    _isDislike = json['isDislike'];
  }
  String? _id;
  int? _like;
  int? _dislike;
  int? _totalReplies;
  dynamic _recursiveCommentId;
  UserId? _userId;
  String? _videoId;
  int? _videoType;
  String? _commentText;
  String? _createdAt;
  String? _updatedAt;
  bool? _isLike;
  bool? _isDislike;
  OriginalVideoComment copyWith({
    String? id,
    int? like,
    int? dislike,
    int? totalReplies,
    dynamic recursiveCommentId,
    UserId? userId,
    String? videoId,
    int? videoType,
    String? commentText,
    String? createdAt,
    String? updatedAt,
    bool? isLike,
    bool? isDislike,
  }) =>
      OriginalVideoComment(
        id: id ?? _id,
        like: like ?? _like,
        dislike: dislike ?? _dislike,
        totalReplies: totalReplies ?? _totalReplies,
        recursiveCommentId: recursiveCommentId ?? _recursiveCommentId,
        userId: userId ?? _userId,
        videoId: videoId ?? _videoId,
        videoType: videoType ?? _videoType,
        commentText: commentText ?? _commentText,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
        isLike: isLike ?? _isLike,
        isDislike: isDislike ?? _isDislike,
      );
  String? get id => _id;
  int? get like => _like;
  int? get dislike => _dislike;
  int? get totalReplies => _totalReplies;
  dynamic get recursiveCommentId => _recursiveCommentId;
  UserId? get userId => _userId;
  String? get videoId => _videoId;
  int? get videoType => _videoType;
  String? get commentText => _commentText;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;
  bool? get isLike => _isLike;
  bool? get isDislike => _isDislike;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['like'] = _like;
    map['dislike'] = _dislike;
    map['totalReplies'] = _totalReplies;
    map['recursiveCommentId'] = _recursiveCommentId;
    if (_userId != null) {
      map['userId'] = _userId?.toJson();
    }
    map['videoId'] = _videoId;
    map['videoType'] = _videoType;
    map['commentText'] = _commentText;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    map['isLike'] = _isLike;
    map['isDislike'] = _isDislike;
    return map;
  }
}

UserId userIdFromJson(String str) => UserId.fromJson(json.decode(str));
String userIdToJson(UserId data) => json.encode(data.toJson());

class UserId {
  UserId({
    String? id,
    String? fullName,
    String? image,
  }) {
    _id = id;
    _fullName = fullName;
    _image = image;
  }

  UserId.fromJson(dynamic json) {
    _id = json['_id'];
    _fullName = json['fullName'];
    _image = json['image'];
  }
  String? _id;
  String? _fullName;
  String? _image;
  UserId copyWith({
    String? id,
    String? fullName,
    String? image,
  }) =>
      UserId(
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        image: image ?? _image,
      );
  String? get id => _id;
  String? get fullName => _fullName;
  String? get image => _image;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['image'] = _image;
    return map;
  }
}
