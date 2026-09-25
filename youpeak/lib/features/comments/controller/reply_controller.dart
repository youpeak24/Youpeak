import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/features/comments/api/get_all_reply_api.dart';
import 'package:youpeak/features/comments/model/get_all_reply_model.dart';
import 'package:youpeak/features/comments/api/like_dislike_comment_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class RepliesController extends GetxController {
  GetAllReplyModel? getAllReplyModel;
  // final _commentController = Get.find<CommentController>();

  List<RepliesOfComment> mainReplies = [];
  bool isLoadingMore = false;
  List customChanges = [];
  int totalRepliesCount = 0;
  bool isRepliesAvailable = true;

  final ScrollController scrollController = ScrollController();
  TextEditingController repliesController = TextEditingController();

  Future<void> getAllReplies(String loginUserId, String videoId, String commentId) async {
    GetAllReplyApi.startPagination = 1; // Reset
    GetAllReplyApi.hasMoreData = true;

    final replies = await GetAllReplyApi.callApi(loginUserId, videoId, commentId);

    if (replies != null) {
      mainReplies = replies;
      customChanges.clear();

      for (int index = 0; index < mainReplies.length; index++) {
        insertIntoCustomChanges(index);
      }
      totalRepliesCount = GetAllReplyApi.totalCount ?? mainReplies.length;

      update(["onChangeRepliesAvailable", "onChangeReplyList"]);
    }

    AppSettings.showLog("Total Reply => ${mainReplies.length}");
  }

  Future<void> loadMoreReplies(String loginUserId, String videoId, String commentId) async {
    if (isLoadingMore || !GetAllReplyApi.hasMoreData) return;

    isLoadingMore = true;
    update(["onChangeLoadMore"]);

    GetAllReplyApi.startPagination += 1;

    AppSettings.showLog("Loading reply page: ${GetAllReplyApi.startPagination}");

    final newReplies = await GetAllReplyApi.callApi(loginUserId, videoId, commentId);

    if (newReplies != null && newReplies.isNotEmpty) {
      final currentLength = mainReplies.length;
      mainReplies.addAll(newReplies);

      for (int i = currentLength; i < mainReplies.length; i++) {
        insertIntoCustomChanges(i);
      }

      update(["onChangeReplyList"]);
    }

    isLoadingMore = false;
    update(["onChangeLoadMore"]);
  }

  void insertIntoCustomChanges(int index) {
    customChanges.add({
      "isLike": bool.parse(mainReplies[index].isLike.toString()),
      "isDisLike": bool.parse(mainReplies[index].isDislike.toString()),
      "like": mainReplies[index].like,
      "disLike": mainReplies[index].dislike,
    });
  }

  // void onPressLike(String loginUserId, String videoId, String commentId, int index) async {
  //   AppSettings.showLog("Comment Id => ${mainReplies[index].id}");
  //
  //   if (!customChanges[index]["isLike"]) {
  //     AppSettings.showLog("Is Already Not Liked");
  //     if (customChanges[index]["isDisLike"] == true) {
  //       AppSettings.showLog("Remove DisLike");
  //       customChanges[index]["isDisLike"] = false;
  //       customChanges[index]["disLike"]--;
  //       update(["onChangeDisLike"]);
  //     } else {
  //       AppSettings.showLog("No DisLike Available");
  //     }
  //     customChanges[index]["isLike"] = true;
  //     customChanges[index]["like"]++;
  //     update(["onChangeLike"]);
  //     await LikeDisLikeCommentApi.callApi(
  //       loginUserId,
  //       mainReplies[index].id!,
  //       true,
  //     );
  //     getAllReplies(loginUserId, videoId, commentId);
  //   } else {
  //     AppSettings.showLog("Is Already Liked");
  //   }
  // }
  void onPressLike(
    String loginUserId,
    String videoId,
    String commentId,
    int index,
  ) async {
    final item = customChanges[index];
    final replyId = mainReplies[index].id!;

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

      // If already disliked → remove dislike
      if (item["isDisLike"] == true) {
        item["isDisLike"] = false;
        item["disLike"]--;
      }

      apiType = "like";
    }

    update(["onChangeLike", "onChangeDisLike"]);

    await LikeDisLikeCommentApi.callApi(
      loginUserId,
      replyId,
      apiType,
    );

    getAllReplies(loginUserId, videoId, commentId);
  }

  // void onPressDisLike(String loginUserId, String videoId, String commentId, int index) async {
  //   AppSettings.showLog("Comment Id => ${mainReplies[index].id}");
  //   if (!(customChanges[index]["isDisLike"] ?? false)) {
  //     AppSettings.showLog("Is Already Not DisLiked");
  //     if (customChanges[index]["isLike"] == true) {
  //       AppSettings.showLog("Remove Like");
  //       customChanges[index]["isLike"] = false;
  //       customChanges[index]["like"]--;
  //       update(["onChangeLike"]);
  //     } else {
  //       AppSettings.showLog("No Like Available");
  //     }
  //     customChanges[index]["isDisLike"] = true;
  //     customChanges[index]["disLike"]++;
  //     update(["onChangeDisLike"]);
  //     await LikeDisLikeCommentApi.callApi(
  //       loginUserId,
  //       mainReplies[index].id!,
  //       false,
  //     );
  //     getAllReplies(loginUserId, videoId, commentId);
  //   } else {
  //     AppSettings.showLog("Is Already DisLiked");
  //   }
  // }
  void onPressDisLike(
    String loginUserId,
    String videoId,
    String commentId,
    int index,
  ) async {
    final item = customChanges[index];
    final replyId = mainReplies[index].id!;

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

      // If already liked → remove like
      if (item["isLike"] == true) {
        item["isLike"] = false;
        item["like"]--;
      }

      apiType = "dislike";
    }

    update(["onChangeLike", "onChangeDisLike"]);

    await LikeDisLikeCommentApi.callApi(
      loginUserId,
      replyId,
      apiType,
    );

    getAllReplies(loginUserId, videoId, commentId);
  }

  void customAddComment(String loginUserImage, String loginUserName, String messageText) {
    mainReplies.insert(
        0,
        RepliesOfComment(
          isLike: false,
          isDislike: false,
          like: 0,
          dislike: 0,
          totalReplies: 0,
          time: "now",
          commentText: messageText,
          userImage: loginUserImage,
          fullName: loginUserName,
        ));
    update(["onChangeReplyList"]);
  }

  void onCheckReplies(bool value) {
    isRepliesAvailable = value;
    update(["onChangeRepliesAvailable"]);
  }

  void advanceChanges() {
    customChanges.add({"isLike": false, "like": 0, "disLike": 0});
  }
}
