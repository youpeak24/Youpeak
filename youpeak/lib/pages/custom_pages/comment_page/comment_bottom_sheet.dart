import 'package:flutter/material.dart';
import 'package:youpeak/custom/custom_ui/youpeak_emoji.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/custom/shimmer/comment_shimmer_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/custom_pages/comment_page/comment_controller.dart';
import 'package:youpeak/pages/custom_pages/comment_page/create_comment_api.dart';
import 'package:youpeak/pages/custom_pages/comment_page/get_all_comment_api.dart';
import 'package:youpeak/pages/custom_pages/comment_page/reply_bottom_sheet.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/style/app_style.dart';

class CommentBottomSheet {
  static int afterChangeTotalComments = 0;
  static final _commentController = Get.find<CommentController>();
  static List commentTypes = ["top".tr, "newest".tr, "mostLiked".tr];
  final ScrollController scrollController = ScrollController();

  static Future<int> show(BuildContext context, String videoId, String channelId, int previousTotalComment, {VoidCallback? callback}) async {
    final ScrollController scrollController = ScrollController();

    scrollController.addListener(() {
      final maxScroll = scrollController.position.maxScrollExtent;
      final currentScroll = scrollController.position.pixels;
      const threshold = 200.0;

      if (currentScroll >= maxScroll - threshold) {
        _commentController.loadMoreComments(videoId);
      }
    });

    afterChangeTotalComments = previousTotalComment;

    _commentController.customChanges[0].clear();
    _commentController.customChanges[1].clear();
    _commentController.customChanges[2].clear();

    _commentController.mainComments[0].clear();
    _commentController.mainComments[1].clear();
    _commentController.mainComments[2].clear();

    if (previousTotalComment != 0) {
      _commentController.onChangeCommentAvailable(true);
      _commentController.selectedCommentType = 0;
      GetAllCommentApi.startPagination = 0;
      _commentController.typeWiseGetComment(0, videoId);
    } else {
      _commentController.onChangeCommentAvailable(false);
    }

    await Get.bottomSheet(
      Container(
        padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 4, right: SizeConfig.blockSizeHorizontal * 3),
        height: SizeConfig.screenHeight / 1.3,
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: SizeConfig.blockSizeHorizontal * 12,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: AppColor.grey_100,
              ),
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(AppStrings.comments.tr, style: profileTitleStyle),
                IconButton(
                  onPressed: () {
                    AppSettings.showLog("TAPP PERFECT ${callback != null}");
                    Get.back();
                    if (callback != null) callback.call();
                  },
                  icon: const ImageIcon(AssetImage(AppIcons.remove), size: 30),
                ),
              ],
            ),
            const Divider(indent: 5, endIndent: 5),
            SizedBox(
              height: 30,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.zero,
                itemCount: commentTypes.length,
                itemBuilder: (context, index) {
                  return GetBuilder<CommentController>(
                    id: "onChangeCommentType",
                    builder: (controller) => GestureDetector(
                      onTap: () => controller.onChangeCommentType(index, videoId),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
                        margin: const EdgeInsets.only(right: 5),
                        decoration: BoxDecoration(
                          color: controller.selectedCommentType != index
                              ? isDarkMode.value
                                  ? Colors.transparent
                                  : AppColor.white
                              : AppColor.primaryColor,
                          border: Border.all(color: AppColor.primaryColor),
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Center(
                          child: Text(
                            commentTypes[index],
                            textAlign: TextAlign.center,
                            style: GoogleFonts.urbanist(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: controller.selectedCommentType == index ? AppColor.white : AppColor.primaryColor,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            EmojiQuickBar(size: 26, onPick: (emoji) => EmojiQuickBar.insertInto(_commentController.commentController, emoji)),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Obx(
                  () => PreviewProfileImage(
                    size: 40,
                    id: Database.channelId ?? "",
                    image: AppSettings.profileImage.value,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _commentController.commentController,
                    keyboardType: TextInputType.multiline,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200,
                      contentPadding: const EdgeInsets.only(left: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      hintText: AppStrings.addComments.tr,
                      hintStyle: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14),
                      suffixIcon: IconButton(
                        onPressed: () async {
                          if (_commentController.commentController.text.isNotEmpty) {
                            FocusScope.of(context).requestFocus(FocusNode());

                            final messageText = _commentController.commentController.text;
                            _commentController.commentController.clear();

                            Get.dialog(barrierDismissible: false, const LoaderUi());
                            _commentController.advanceCustomChanges();
                            _commentController.customAddComment(messageText);
                            if (_commentController.isCommentAvailable == false) {
                              _commentController.onChangeCommentAvailable(true);
                            }

                            Get.back();

                            await CreateCommentApiClass.callApi(videoId, messageText);
                            GetAllCommentApi.startPagination = 0;

                            await _commentController.typeWiseGetComment(_commentController.selectedCommentType, videoId);

                            if (_commentController.selectedCommentType != 0) {
                              _commentController.mainComments[0].clear();
                            }
                            if (_commentController.selectedCommentType != 1) {
                              _commentController.mainComments[1].clear();
                            }
                            if (_commentController.selectedCommentType != 2) {
                              _commentController.mainComments[2].clear();
                            }

                            afterChangeTotalComments = _commentController.mainComments[_commentController.selectedCommentType].length;
                          } else {
                            AppSettings.showLog("Please enter your comment !!");
                          }
                        },
                        icon: const Icon(Icons.send_rounded, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
            const Divider(indent: 5, endIndent: 5),
            Expanded(
              child: SizedBox(
                height: 200,
                child: GetBuilder<CommentController>(
                  id: "onChangeCommentAvailable",
                  builder: (controller) => controller.isCommentAvailable == false
                      ? Center(child: Text(AppStrings.commentsNotAvailable.tr))
                      : GetBuilder<CommentController>(
                          id: "onChangeShimmer",
                          builder: (controller) => controller.mainComments[controller.selectedCommentType].isEmpty
                              ? const CommentShimmerUi()
                              : SingleChildScrollView(
                                  controller: scrollController, // આ add કરો
                                  physics: const BouncingScrollPhysics(),
                                  child: GetBuilder<CommentController>(
                                    id: "onChangeCommentList",
                                    builder: (controller) => Column(
                                      children: [
                                        ListView.builder(
                                          shrinkWrap: true,
                                          physics: const NeverScrollableScrollPhysics(),
                                          itemCount: controller.mainComments[controller.selectedCommentType].length,
                                          padding: const EdgeInsets.only(left: 5),
                                          itemBuilder: (context, index) {
                                            return Column(
                                              children: [
                                                Row(
                                                  children: [
                                                    PreviewProfileImage(
                                                      size: 30,
                                                      id: controller.mainComments[controller.selectedCommentType][index].id ?? "",
                                                      image: controller.mainComments[controller.selectedCommentType][index].userImage ?? "",
                                                      fit: BoxFit.cover,
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                    Flexible(
                                                      fit: FlexFit.loose,
                                                      child: Text(
                                                        controller.mainComments[controller.selectedCommentType][index].fullName.toString(),
                                                        style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
                                                      ),
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                    Text(
                                                      " •  ${controller.mainComments[controller.selectedCommentType][index].time}",
                                                      style: GoogleFonts.urbanist(fontSize: 13),
                                                    ),
                                                  ],
                                                ),
                                                SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                                SizedBox(
                                                  width: SizeConfig.screenWidth / 1.1,
                                                  child: EmojiText(controller.mainComments[controller.selectedCommentType][index].commentText.toString(),
                                                      style: GoogleFonts.urbanist(), maxLines: 3, overflow: TextOverflow.ellipsis),
                                                ),
                                                Row(
                                                  children: [
                                                    GetBuilder<CommentController>(
                                                      id: "onChangeLike",
                                                      builder: (controller) => GestureDetector(
                                                        onTap: () async => controller.onPressLike(videoId, index),
                                                        child: Container(
                                                          width: 50,
                                                          height: 50,
                                                          color: Colors.transparent,
                                                          child: Row(
                                                            children: [
                                                              ImageIcon(
                                                                AssetImage(
                                                                    controller.customChanges[controller.selectedCommentType][index]["isLike"] == true
                                                                        ? AppIcons.likeBold
                                                                        : AppIcons.like),
                                                                color:
                                                                    controller.customChanges[controller.selectedCommentType][index]["isLike"] == true
                                                                        ? AppColor.primaryColor
                                                                        : null,
                                                                size: 17,
                                                              ),
                                                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                              Text(
                                                                controller.customChanges[controller.selectedCommentType][index]["like"].toString(),
                                                                style: GoogleFonts.urbanist(fontSize: 13),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    GetBuilder<CommentController>(
                                                      id: "onChangeDisLike",
                                                      builder: (controller) => GestureDetector(
                                                        onTap: () async => controller.onPressDisLike(videoId, index),
                                                        child: Container(
                                                          width: 50,
                                                          height: 50,
                                                          color: Colors.transparent,
                                                          child: Row(
                                                            children: [
                                                              ImageIcon(
                                                                AssetImage(controller.customChanges[controller.selectedCommentType][index]
                                                                        ["isDisLike"]
                                                                    ? AppIcons.disLikeBold
                                                                    : AppIcons.disLike),
                                                                color: controller.customChanges[controller.selectedCommentType][index]["isDisLike"]
                                                                    ? AppColor.primaryColor
                                                                    : null,
                                                                size: 17,
                                                              ),
                                                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                              Text(
                                                                controller.customChanges[controller.selectedCommentType][index]["disLike"].toString(),
                                                                style: GoogleFonts.urbanist(fontSize: 13),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    GetBuilder<CommentController>(
                                                      id: "onChangeReplies",
                                                      builder: (controller) => GestureDetector(
                                                        onTap: () async {
                                                          controller.customChanges[controller.selectedCommentType][index]["reply"] =
                                                              await ReplyBottomSheet.show(
                                                            context,
                                                            index,
                                                            videoId,
                                                            controller.mainComments[controller.selectedCommentType][index].id!,
                                                            controller.customChanges[controller.selectedCommentType][index]["reply"],
                                                          );

                                                          controller.onChangeReplies();
                                                        },
                                                        child: Container(
                                                          width: 50,
                                                          height: 50,
                                                          color: Colors.transparent,
                                                          child: Row(
                                                            children: [
                                                              const ImageIcon(AssetImage(AppIcons.reply), size: 17),
                                                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                              Text(
                                                                controller.customChanges[controller.selectedCommentType][index]["reply"].toString(),
                                                                style: GoogleFonts.urbanist(fontSize: 13),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const Divider(indent: 5, endIndent: 5),
                                                SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                              ],
                                            );
                                          },
                                        ),
                                        GetBuilder<CommentController>(
                                          id: "onChangeLoadMore",
                                          builder: (ctrl) => ctrl.isLoadingMore
                                              ? const Padding(
                                                  padding: EdgeInsets.all(16),
                                                  child: Center(
                                                      child: CircularProgressIndicator(
                                                    color: AppColor.primaryColor,
                                                  )),
                                                )
                                              : const SizedBox.shrink(),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(25),
          topRight: Radius.circular(25),
        ),
      ),
    ).then(
      (value) {
        scrollController.dispose();
      },
    );

    if (_commentController.mainComments[0].isNotEmpty) {
      afterChangeTotalComments = _commentController.mainComments[0].length;
    }

    return afterChangeTotalComments;
  }
}
