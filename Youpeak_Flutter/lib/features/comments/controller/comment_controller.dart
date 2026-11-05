import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/comments/api/get_all_comment_api.dart';
import 'package:youpeak/features/comments/model/get_all_comment_model.dart';
import 'package:youpeak/features/comments/api/like_dislike_comment_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class CommentController extends GetxController {
  TextEditingController commentController = TextEditingController();

  List<List<VideoComment>> mainComments = [[], [], []];
  List<bool> isCommentRefresh = [false, false, false];
  List<List> customChanges = <List>[[], [], []];
  bool isLoadingMore = false;
  int selectedCommentType = 0;
  bool isCommentAvailable = true;

  void onChangeCommentAvailable(bool value) {
    isCommentAvailable = value;
    update(["onChangeCommentAvailable"]);
  }

  Future<void> typeWiseGetComment(int commentType, String videoId) async {
    GetAllCommentApi.startPagination = 1; // Reset to page 1
    GetAllCommentApi.hasMoreData = true;

    var comments = await GetAllCommentApi.callApi(videoId, commentType);

    if (comments != null && commentType == 2) {
      // Only keep comments that have at least 1 like, and sort them by most liked descending
      comments = comments.where((c) => c.like != null && c.like! > 0).toList();
      comments.sort((a, b) => (b.like ?? 0).compareTo(a.like ?? 0));
    }

    if (commentType == 0) {
      final newCommentList = comments ?? [];
      mainComments[commentType] = newCommentList.reversed.toList();
    } else {
      mainComments[commentType] = comments ?? [];
    }

    customChanges[commentType].clear();

    for (int index = 0; index < mainComments[commentType].length; index++) {
      insertIntoCustomChanges(commentType, index);
    }

    update(["onChangeShimmer"]);

    if (mainComments[commentType].isEmpty) {
      isCommentAvailable = false;
      update(["onChangeCommentAvailable"]);
    } else {
      isCommentAvailable = true;
      update(["onChangeCommentAvailable"]);
    }
  }

  Future<void> loadMoreComments(String videoId) async {
    if (isLoadingMore || !GetAllCommentApi.hasMoreData) return;

    isLoadingMore = true;
    update(["onChangeLoadMore"]);

    // આગળનું page
    GetAllCommentApi.startPagination += 1; // 1→2→3→4...

    AppSettings.showLog("Loading page: ${GetAllCommentApi.startPagination}");

    var newComments =
        await GetAllCommentApi.callApi(videoId, selectedCommentType);

    if (newComments != null && newComments.isNotEmpty) {
      if (selectedCommentType == 2) {
        // Only keep comments that have at least 1 like
        newComments = newComments.where((c) => c.like != null && c.like! > 0).toList();
      }

      final currentLength = mainComments[selectedCommentType].length;

      mainComments[selectedCommentType].addAll(newComments);

      if (selectedCommentType == 2) {
        // Sort the entire list of most liked comments descending by likes
        mainComments[2].sort((a, b) => (b.like ?? 0).compareTo(a.like ?? 0));
        
        customChanges[2].clear();
        for (int i = 0; i < mainComments[2].length; i++) {
          insertIntoCustomChanges(2, i);
        }
      } else {
        for (int i = currentLength;
            i < mainComments[selectedCommentType].length;
            i++) {
          insertIntoCustomChanges(selectedCommentType, i);
        }
      }

      update(["onChangeCommentList"]);
    }

    isLoadingMore = false;
    update(["onChangeLoadMore"]);
  }

  void onChangeCommentType(int index, String videoId) {
    selectedCommentType = index;
    if (mainComments[0].isEmpty ||
        mainComments[1].isEmpty ||
        mainComments[2].isEmpty) {
      if (mainComments[selectedCommentType].isEmpty) {
        GetAllCommentApi.startPagination = 0;

        typeWiseGetComment(selectedCommentType, videoId);
      }
    }

    update(["onChangeCommentType", "onChangeCommentList"]);

    if (mainComments[0].isEmpty ||
        mainComments[1].isEmpty ||
        mainComments[2].isEmpty) {
      update(["onChangeShimmer"]);
    }
  }

  void insertIntoCustomChanges(int commentType, int index) {
    customChanges[commentType].add({
      "isLike": bool.parse(mainComments[commentType][index].isLike.toString()),
      "isDisLike":
          bool.parse(mainComments[commentType][index].isDislike.toString()),
      "like": mainComments[commentType][index].like,
      "disLike": mainComments[commentType][index].dislike,
      "reply": mainComments[commentType][index].totalReplies
    });
  }

  void advanceCustomChanges() {
    customChanges[0].insert(0, {
      "isLike": false,
      "isDisLike": false,
      "like": 0,
      "disLike": 0,
      "reply": 0
    });
    customChanges[1].insert(0, {
      "isLike": false,
      "isDisLike": false,
      "like": 0,
      "disLike": 0,
      "reply": 0
    });
    // Do not add to customChanges[2] because a new comment starts with 0 likes
    // and "Most Liked" tab only displays comments with at least 1 like.
  }

  void onChangeReplies() {
    update(["onChangeReplies"]);
  }

  // void onPressLike(String videoId, int index) async {
  //   AppSettings.showLog("Comment Id => ${mainComments[selectedCommentType][index].id}");
  //
  //   if (!customChanges[selectedCommentType][index]["isLike"]) {
  //     AppSettings.showLog("Is Already Not Liked");
  //     if (customChanges[selectedCommentType][index]["isDisLike"] == true) {
  //       AppSettings.showLog("Remove DisLike");
  //       customChanges[selectedCommentType][index]["isDisLike"] = false;
  //       customChanges[selectedCommentType][index]["disLike"]--;
  //       update(["onChangeDisLike"]);
  //     } else {
  //       AppSettings.showLog("No DisLike Available");
  //     }
  //     customChanges[selectedCommentType][index]["isLike"] = true;
  //     customChanges[selectedCommentType][index]["like"]++;
  //     update(["onChangeLike"]);
  //     await LikeDisLikeCommentApi.callApi(
  //       Database.loginUserId!,
  //       mainComments[selectedCommentType][index].id!,
  //       true,
  //     );
  //
  //     final currentReplyCount = customChanges[selectedCommentType][index]["reply"];
  //
  //     GetAllCommentApi.startPagination = 0;
  //
  //     typeWiseGetComment(selectedCommentType, videoId);
  //
  //     if (customChanges[selectedCommentType].length > index) {
  //       customChanges[selectedCommentType][index]["reply"] = currentReplyCount;
  //     }
  //
  //     if (selectedCommentType != 0) {
  //       // isCommentRefresh[0] = true;
  //       mainComments[0].clear();
  //     }
  //     if (selectedCommentType != 1) {
  //       // isCommentRefresh[1] = true;
  //       mainComments[1].clear();
  //     }
  //     if (selectedCommentType != 2) {
  //       // isCommentRefresh[2] = true;
  //       mainComments[2].clear();
  //     }
  //   } else {
  //     AppSettings.showLog("Is Already Liked");
  //   }
  // }
  void onPressLike(String videoId, int index) async {
    final item = customChanges[selectedCommentType][index];
    final commentId = mainComments[selectedCommentType][index].id!;

    String apiType = "";

    if (item["isLike"] == true) {
      // 🔹 Remove Like
      item["isLike"] = false;
      item["like"]--;
      apiType = "likeremove";
    } else {
      // 🔹 Add Like
      item["isLike"] = true;
      item["like"]++;

      // If already disliked → remove dislike first
      if (item["isDisLike"] == true) {
        item["isDisLike"] = false;
        item["disLike"]--;
      }

      apiType = "like";
    }

    update(["onChangeLike", "onChangeDisLike"]);

    if (selectedCommentType != 0) {
      mainComments[0].clear();
    }
    if (selectedCommentType != 1) {
      mainComments[1].clear();
    }
    if (selectedCommentType != 2) {
      mainComments[2].clear();
    }

    await LikeDisLikeCommentApi.callApi(
      Database.loginUserId!,
      commentId,
      apiType,
    );
  }

  // void onPressDisLike(String videoId, int index) async {
  //   AppSettings.showLog("Comment Id => ${mainComments[selectedCommentType][index].id}");
  //   if (!customChanges[selectedCommentType][index]["isDisLike"]) {
  //     AppSettings.showLog("Is Already Not DisLiked");
  //     if (customChanges[selectedCommentType][index]["isLike"] == true) {
  //       AppSettings.showLog("Remove Like");
  //       customChanges[selectedCommentType][index]["isLike"] = false;
  //       customChanges[selectedCommentType][index]["like"]--;
  //       update(["onChangeLike"]);
  //     } else {
  //       AppSettings.showLog("No Like Available");
  //     }
  //     customChanges[selectedCommentType][index]["isDisLike"] = true;
  //     customChanges[selectedCommentType][index]["disLike"]++;
  //     update(["onChangeDisLike"]);
  //     await LikeDisLikeCommentApi.callApi(
  //       Database.loginUserId!,
  //       mainComments[selectedCommentType][index].id!,
  //       false,
  //     );
  //     GetAllCommentApi.startPagination = 0;
  //
  //     typeWiseGetComment(selectedCommentType, videoId);
  //     if (selectedCommentType != 0) {
  //       // isCommentRefresh[0] = true;
  //       mainComments[0].clear();
  //     }
  //     if (selectedCommentType != 1) {
  //       // isCommentRefresh[1] = true;
  //       mainComments[1].clear();
  //     }
  //     if (selectedCommentType != 2) {
  //       // isCommentRefresh[2] = true;
  //       mainComments[2].clear();
  //     }
  //   } else {
  //     AppSettings.showLog("Is Already DisLiked");
  //   }
  // }
  void onPressDisLike(String videoId, int index) async {
    final item = customChanges[selectedCommentType][index];
    final commentId = mainComments[selectedCommentType][index].id!;

    String apiType = "";

    if (item["isDisLike"] == true) {
      // 🔹 Remove Dislike
      item["isDisLike"] = false;
      item["disLike"]--;
      apiType = "dislikeremove";
    } else {
      // 🔹 Add Dislike
      item["isDisLike"] = true;
      item["disLike"]++;

      // If already liked → remove like first
      if (item["isLike"] == true) {
        item["isLike"] = false;
        item["like"]--;
      }

      apiType = "dislike";
    }

    update(["onChangeLike", "onChangeDisLike"]);

    if (selectedCommentType != 0) {
      mainComments[0].clear();
    }
    if (selectedCommentType != 1) {
      mainComments[1].clear();
    }
    if (selectedCommentType != 2) {
      mainComments[2].clear();
    }

    await LikeDisLikeCommentApi.callApi(
      Database.loginUserId!,
      commentId,
      apiType,
    );
  }

  void customAddComment(String messageText) {
    mainComments[0].insert(
        0,
        VideoComment(
          isLike: false,
          isDislike: false,
          like: 0,
          dislike: 0,
          totalReplies: 0,
          time: "now",
          commentText: messageText,
          userImage: AppSettings.profileImage.value,
          fullName: AppSettings.channelName.value,
        ));
    mainComments[1].insert(
        0,
        VideoComment(
          isLike: false,
          isDislike: false,
          like: 0,
          dislike: 0,
          totalReplies: 0,
          time: "now",
          commentText: messageText,
          userImage: AppSettings.profileImage.value,
          fullName: AppSettings.channelName.value,
        ));
    // Do not add to mainComments[2] because a new comment starts with 0 likes
    // and "Most Liked" tab only displays comments with at least 1 like.
    update(["onChangeCommentList"]);
  }
}
