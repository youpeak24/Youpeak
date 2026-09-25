import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';

import 'package:youpeak/main.dart';

import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';

import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class MoreOptionBottomSheet {
  static void show({
    required BuildContext context,
    required Callback editCallBack,
    required Callback deleteCallback,
  }) async {
    Get.bottomSheet(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      SizedBox(
        height: 150,
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Container(
                width: SizeConfig.blockSizeHorizontal * 12,
                height: 3,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(60),
                  color: AppColor.grey_300,
                ),
              ),
              const SizedBox(height: 16),
              Text(AppStrings.moreOption.tr, style: titalstyle1),
              const SizedBox(height: 8),
              Divider(indent: 25, endIndent: 25, color: AppColor.grey_200),
              const SizedBox(height: 8),
              BottomShitButton(
                widget: const ImageIcon(AssetImage(AppIcons.icEditVideo), size: 20),
                name: AppStrings.edit.tr,
                onTap: editCallBack,
              ),
              const SizedBox(height: 16),
              BottomShitButton(
                widget: const ImageIcon(AssetImage(AppIcons.icDeleteVideo), size: 23),
                name: AppStrings.delete.tr,
                onTap: deleteCallback,
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(30),
          topLeft: Radius.circular(30),
        ),
      ),
    );
  }
}
