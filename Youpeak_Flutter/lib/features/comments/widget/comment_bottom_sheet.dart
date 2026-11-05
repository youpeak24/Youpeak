import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/youpeak_emoji.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/features/comments/widget/comment_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/comments/controller/comment_controller.dart';
import 'package:youpeak/features/comments/api/create_comment_api.dart';
import 'package:youpeak/features/comments/api/get_all_comment_api.dart';
import 'package:youpeak/features/comments/widget/reply_bottom_sheet.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

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

    await AppSheet.show(
      Container(
        padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 4, right: SizeConfig.blockSizeHorizontal * 3),
        height: SizeConfig.screenHeight / 1.3,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.24) : AppColor.grey_300,
              ),
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(AppStrings.comments.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
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
            Divider(indent: 5, endIndent: 5, color: AppElevation.hairline(isDarkMode.value)),
            const SizedBox(height: 8),
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.zero,
                itemCount: commentTypes.length,
                itemBuilder: (context, index) {
                  return GetBuilder<CommentController>(
                    id: "onChangeCommentType",
                    builder: (controller) {
                      final selected = controller.selectedCommentType == index;
                      final dark = isDarkMode.value;
                      return AppPressable(
                        onTap: () => controller.onChangeCommentType(index, videoId),
                        pressedScale: 0.94,
                        child: AnimatedContainer(
                          duration: AppMotion.of(context),
                          curve: AppMotion.curve,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          margin: const EdgeInsets.fromLTRB(0, 6, 8, 6),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: selected ? AppColor.primaryColor : (dark ? AppColor.white.withValues(alpha: 0.09) : AppColor.secondaryMintGreen),
                            borderRadius: BorderRadius.circular(AppRadius.chip),
                          ),
                          child: Text(
                            commentTypes[index],
                            textAlign: TextAlign.center,
                            style: GoogleFonts.urbanist(
                              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                              fontSize: 14,
                              color: selected ? AppColor.white : (dark ? AppColor.white : AppColor.primaryTextIcons),
                            ),
                          ),
                        ),
                      );
                    },
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
                      fillColor: isDarkMode.value ? AppColor.white.withValues(alpha: 0.08) : AppColor.searchContainerBg,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(26), borderSide: BorderSide.none),
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
                        icon: const Icon(Icons.send_rounded, color: AppColor.primaryColor),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
            Divider(indent: 5, endIndent: 5, color: AppElevation.hairline(isDarkMode.value)),
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
                                                      size: 36,
                                                      id: controller.mainComments[controller.selectedCommentType][index].id ?? "",
                                                      image: controller.mainComments[controller.selectedCommentType][index].userImage ?? "",
                                                      fit: BoxFit.cover,
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                    Flexible(
                                                      fit: FlexFit.loose,
                                                      child: Text(
                                                        controller.mainComments[controller.selectedCommentType][index].fullName.toString(),
                                                        style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, fontSize: 14.5),
                                                      ),
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                    Text(
                                                      " ·  ${controller.mainComments[controller.selectedCommentType][index].time}",
                                                      style: GoogleFonts.urbanist(fontSize: 12.5, color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 10),
                                                SizedBox(
                                                  width: SizeConfig.screenWidth / 1.1,
                                                  child: EmojiText(controller.mainComments[controller.selectedCommentType][index].commentText.toString(),
                                                      style: GoogleFonts.urbanist(fontSize: 14.5, height: 1.35, fontWeight: FontWeight.w500), maxLines: 3, overflow: TextOverflow.ellipsis),
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
                                                Divider(indent: 5, endIndent: 5, color: AppElevation.hairline(isDarkMode.value)),
                                                const SizedBox(height: 6),
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
      backgroundColor: isDarkMode.value ? AppColor.darkElevated : AppColor.white,
      shape: const RoundedRectangleBorder(borderRadius: AppRadius.sheetBorder),
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
