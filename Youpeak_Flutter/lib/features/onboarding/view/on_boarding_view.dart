import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/auth/view/lets_you_in_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class OnBoardIngScreen extends StatefulWidget {
  const OnBoardIngScreen({super.key});

  @override
  State<OnBoardIngScreen> createState() => _OnBoardIngScreenState();
}

class _OnBoardIngScreenState extends State<OnBoardIngScreen> {
  final PageController pageController = PageController();
  int initPage = 0;

  static final _pages = <({String image, String text})>[
    (image: AppIcons.onBoarding1, text: AppStrings.onBoardingText1),
    (image: AppIcons.onBoarding2, text: AppStrings.onBoardingText2),
    (image: AppIcons.onBoarding3, text: AppStrings.onBoardingText3),
  ];

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }

  void _next() {
    if (initPage < _pages.length - 1) {
      pageController.animateToPage(
        initPage + 1,
        duration: AppMotion.of(context, AppMotion.slow),
        curve: AppMotion.curve,
      );
    } else {
      Database.onSetOnBoarding(true);
      Get.offAll(() => const LetsYouInView());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: pageController,
                itemCount: _pages.length,
                onPageChanged: (value) => setState(() => initPage = value),
                itemBuilder: (context, index) => _OnBoardingPage(
                  image: _pages[index].image,
                  text: _pages[index].text,
                ),
              ),
            ),
            _PageDots(count: _pages.length, current: initPage),
            const SizedBox(height: 28),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: BasicButton(
                title: AppStrings.next.tr,
                width: double.infinity,
                callback: _next,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _OnBoardingPage extends StatelessWidget {
  const _OnBoardingPage({required this.image, required this.text});

  final String image;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // The illustrations carry their own soft backdrop.
          Flexible(
            flex: 5,
            child: Image(image: AssetImage(image), fit: BoxFit.contain),
          ),
          const SizedBox(height: 28),
          Flexible(
            flex: 2,
            child: Text(
              text.tr,
              textAlign: TextAlign.center,
              style: GoogleFonts.urbanist(fontSize: 27, fontWeight: FontWeight.w800, height: 1.2, letterSpacing: -0.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.current});

  final int count;
  final int current;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: AppMotion.of(context),
            curve: AppMotion.curve,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            height: 8,
            width: i == current ? 30 : 8,
            decoration: BoxDecoration(
              color: i == current ? AppColor.primaryColor : AppColor.dotColor,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
      ],
    );
  }
}
