import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/auth/view/lets_you_in_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class OnBoardIngScreen extends StatefulWidget {
  const OnBoardIngScreen({super.key});

  @override
  State<OnBoardIngScreen> createState() => _OnBoardIngScreenState();
}

class _OnBoardIngScreenState extends State<OnBoardIngScreen> {
  PageController pageController = PageController();
  int initPage = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: pageController,
                onPageChanged: (value) {
                  setState(() {
                    initPage = value;
                  });
                },
                children: const [
                  OnBoardingScreen1(),
                  OnBoardingScreen2(),
                  OnBoardingScreen3(),
                ],
              ),
            ),
            BasicButton(
              title: AppStrings.next.tr,
              callback: () {
                if (initPage == 0) {
                  setState(() {
                    initPage = 1;
                    pageController.jumpToPage(1);
                  });
                } else if (initPage == 1) {
                  setState(() {
                    initPage = 2;
                    pageController.jumpToPage(2);
                  });
                } else if (initPage == 2) {
                  print("Database:::::::::::::::${Database.isOnBoarding}");
                  Database.onSetOnBoarding(true);
                  print("Database:::::::::::::::${Database.isOnBoarding}");
                  Get.offAll(() => const LetsYouInView());
                }
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}

class OnBoardingScreen1 extends StatelessWidget {
  const OnBoardingScreen1({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Image(
            image: const AssetImage(AppIcons.onBoarding1),
            height: SizeConfig.screenHeight / 2,
            width: SizeConfig.screenWidth / 1.3,
            fit: BoxFit.contain,
          ),
          SizedBox(
            width: SizeConfig.screenWidth / 1.5,
            child: Text(
              style: onBoardingTextStyle,
              textAlign: TextAlign.center,
              AppStrings.onBoardingText1.tr,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 08,
                width: 32,
                decoration: BoxDecoration(
                  color: AppColor.primaryColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              SizedBox(
                width: SizeConfig.blockSizeHorizontal * 2,
              ),
              Container(
                height: 08,
                width: 08,
                decoration: BoxDecoration(
                  color: AppColor.dotColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              SizedBox(
                width: SizeConfig.blockSizeHorizontal * 2,
              ),
              Container(
                height: 08,
                width: 08,
                decoration: BoxDecoration(
                  color: AppColor.dotColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class OnBoardingScreen2 extends StatelessWidget {
  const OnBoardingScreen2({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Image(
            image: const AssetImage(AppIcons.onBoarding2),
            height: SizeConfig.screenHeight / 2,
            width: SizeConfig.screenWidth / 1.3,
            fit: BoxFit.contain,
          ),
          SizedBox(
            width: SizeConfig.screenWidth / 1.5,
            child: Text(
              style: onBoardingTextStyle,
              textAlign: TextAlign.center,
              AppStrings.onBoardingText2.tr,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 08,
                width: 08,
                decoration: BoxDecoration(
                  color: AppColor.dotColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              SizedBox(
                width: SizeConfig.blockSizeHorizontal * 2,
              ),
              Container(
                height: 08,
                width: 32,
                decoration: BoxDecoration(
                  color: AppColor.primaryColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              SizedBox(
                width: SizeConfig.blockSizeHorizontal * 2,
              ),
              Container(
                height: 08,
                width: 08,
                decoration: BoxDecoration(
                  color: AppColor.dotColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class OnBoardingScreen3 extends StatelessWidget {
  const OnBoardingScreen3({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Image(
            image: const AssetImage(AppIcons.onBoarding3),
            height: SizeConfig.screenHeight / 2,
            width: SizeConfig.screenWidth / 1.3,
            fit: BoxFit.contain,
          ),
          SizedBox(
            width: SizeConfig.screenWidth / 1.5,
            child: Text(
              style: onBoardingTextStyle,
              textAlign: TextAlign.center,
              AppStrings.onBoardingText3.tr,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 08,
                width: 08,
                decoration: BoxDecoration(
                  color: AppColor.dotColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              SizedBox(
                width: SizeConfig.blockSizeHorizontal * 2,
              ),
              Container(
                height: 08,
                width: 08,
                decoration: BoxDecoration(
                  color: AppColor.dotColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              SizedBox(
                width: SizeConfig.blockSizeHorizontal * 2,
              ),
              Container(
                height: 08,
                width: 32,
                decoration: BoxDecoration(
                  color: AppColor.primaryColor,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
