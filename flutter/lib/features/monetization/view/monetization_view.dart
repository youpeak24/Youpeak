import 'package:youpeak/core/platform/responsive.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/shimmer/container_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/monetization/api/monetization_api.dart';
import 'package:youpeak/features/monetization/model/monetization_model.dart';
import 'package:youpeak/features/monetization/api/monetization_request_api.dart';
import 'package:youpeak/features/monetization/model/monetization_request_model.dart';
import 'package:youpeak/features/monetization/view/preview_monetization.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:percent_indicator/percent_indicator.dart';

class MonetizationView extends StatefulWidget {
  const MonetizationView({super.key});

  @override
  State<MonetizationView> createState() => _MonetizationViewState();
}

class _MonetizationViewState extends State<MonetizationView> {
  MonetizationModel? _monetizationModel;
  MonetizationRequestModel? _monetizationRequestModel;
  RxBool isLoading = false.obs;

  void onGetMonetization() async {
    AppSettings.showLog(Database.loginUserId!);
    _monetizationModel = null;
    isLoading.value = true;
    if (Database.loginUserId != null) {
      _monetizationModel = await MonetizationApi.callApi(Database.loginUserId!);
    }
    if (_monetizationModel != null) {
      isLoading.value = false;
    }
  }

  @override
  void initState() {
    onGetMonetization();
    super.initState();
  }

  Future<void> _onAction() async {
    if ((_monetizationModel?.dataOfMonetization?.isMonetization ?? false)) {
      Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
      _monetizationRequestModel = await MonetizationRequestApi.callApi(Database.loginUserId!);
      Get.back();
      if (_monetizationRequestModel != null) {
        if (_monetizationRequestModel?.monetizationRequest?.status == 1) {
          CustomToast.show(AppStrings.requestSendToAdmin.tr);
        } else if (_monetizationRequestModel?.monetizationRequest?.status == 3) {
          CustomToast.show(AppStrings.requestDeclineByAdmin.tr);
        } else if (_monetizationRequestModel?.monetizationRequest?.status == 2) {
          Get.to(const PreviewMonetization());
        } else {
          CustomToast.show(AppStrings.someThingWentWrong.tr);
        }
      } else {
        CustomToast.show(AppStrings.someThingWentWrong.tr);
      }
    } else {
      CustomToast.show(AppStrings.monetizationPendingText.tr);
    }
  }

  @override
  Widget build(BuildContext context) {
    final alreadyMonetized = GetProfileApi.profileModel?.user?.isMonetization ?? false;
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.monetization.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: Obx(() {
        final data = _monetizationModel?.dataOfMonetization;
        return MonetizationLayout(
          loading: isLoading.value,
          name: GetProfileApi.profileModel?.user?.fullName ?? "",
          watchProgress: requirementProgress(double.tryParse(data?.totalWatchTime ?? "0"), data?.minWatchTime),
          watchLabel: "${data?.totalWatchTime ?? 0} Hr / ${data?.minWatchTime ?? 0} Hr",
          subscriberProgress: requirementProgress(data?.totalSubscribers, data?.minSubScriber),
          subscriberLabel: "${data?.totalSubscribers ?? 0} / ${data?.minSubScriber ?? 0}",
          eligible: data?.isMonetization ?? false,
          showAction: !alreadyMonetized,
          onAction: _onAction,
        );
      }),
    );
  }
}

/// How far [current] is towards [required], always within 0..1 (a missing
/// value counts as 0, a requirement of 0 is already met).
double requirementProgress(num? current, num? required) {
  if (required == null || required <= 0) return 1.0;
  final ratio = (current ?? 0) / required;
  if (ratio.isNaN) return 0.0;
  return ratio.clamp(0.0, 1.0).toDouble();
}

//// The Monetization page body.
///
/// Phones: introduction, one eligibility card, and the action docked to the
/// bottom of the screen. From 720 wide the action sits right under the
/// requirements instead; from 840 the introduction puts its text beside the
/// illustration and each requirement gets its own card in a grid.
class MonetizationLayout extends StatelessWidget {
  const MonetizationLayout({
    super.key,
    required this.loading,
    required this.name,
    required this.watchProgress,
    required this.watchLabel,
    required this.subscriberProgress,
    required this.subscriberLabel,
    required this.eligible,
    required this.showAction,
    required this.onAction,
  });

  final bool loading;
  final String name;
  final double watchProgress;
  final String watchLabel;
  final double subscriberProgress;
  final String subscriberLabel;
  final bool eligible;
  final bool showAction;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final width = PageWidth.of(context);
    final wide = width >= Responsive.splitFrom;
    final inlineAction = width >= Responsive.inlineActionFrom;
    final dockedAction = showAction && !loading && !inlineAction;

    final requirements = [
      _Requirement(title: AppStrings.minimumWatchTime.tr, progress: watchProgress, label: watchLabel),
      _Requirement(title: AppStrings.minimumSubscriber.tr, progress: subscriberProgress, label: subscriberLabel),
    ];

    return Column(
      children: [
        Expanded(
          child: AdaptiveScroll(
            maxWidth: 1120,
            child: loading
                ? const _MonetizationShimmer()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _Introduction(name: name, wide: wide),
                      SizedBox(height: wide ? 24 : 20),
                      if (wide)
                        ResponsiveGrid(
                          minTileWidth: 320,
                          maxColumns: 2,
                          children: [
                            for (final r in requirements) SurfaceCard(padding: const EdgeInsets.all(24), child: _RequirementRow(requirement: r, large: true)),
                          ],
                        )
                      else
                        SurfaceCard(
                          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              for (var i = 0; i < requirements.length; i++) ...[
                                if (i > 0) const SizedBox(height: 22),
                                _RequirementRow(requirement: requirements[i]),
                              ],
                            ],
                          ),
                        ),
                      if (showAction && inlineAction) ...[
                        const SizedBox(height: 24),
                        Align(
                          alignment: wide ? Alignment.centerLeft : Alignment.center,
                          child: ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: wide ? 360 : double.infinity),
                            child: _ActionButton(eligible: eligible, onTap: onAction),
                          ),
                        ),
                      ],
                    ],
                  ),
          ),
        ),
        if (dockedAction)
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: _ActionButton(eligible: eligible, onTap: onAction),
            ),
          ),
      ],
    );
  }
}

class _Introduction extends StatelessWidget {
  const _Introduction({required this.name, required this.wide});

  final String name;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final text = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text("Hello, $name", style: GoogleFonts.urbanist(fontSize: wide ? 28 : 18, fontWeight: FontWeight.bold)),
        SizedBox(height: wide ? 12 : 8),
        Text(
          AppStrings.monetizationParagraph.tr,
          style: GoogleFonts.urbanist(fontSize: wide ? 16 : 12, height: 1.55, fontWeight: FontWeight.w500),
        ),
      ],
    );
    // The artwork is square: it is sized by height so it stays proportional.
    if (!wide) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(child: Image.asset(AppIcons.monetizationImage, height: 220, fit: BoxFit.contain)),
          const SizedBox(height: 14),
          text,
        ],
      );
    }
    return SurfaceCard(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 28),
      child: Row(
        children: [
          Expanded(child: text),
          const SizedBox(width: 40),
          Image.asset(AppIcons.monetizationImage, height: 240, fit: BoxFit.contain),
        ],
      ),
    );
  }
}

class _Requirement {
  const _Requirement({required this.title, required this.progress, required this.label});

  final String title;
  final double progress;
  final String label;
}

class _RequirementRow extends StatelessWidget {
  const _RequirementRow({required this.requirement, this.large = false});

  final _Requirement requirement;
  final bool large;

  @override
  Widget build(BuildContext context) {
    // On the dark card the brand green is lifted (brightGreen) so the text and
    // the bar stay readable; the track is a faint light line, not a white bar.
    final dark = Theme.of(context).brightness == Brightness.dark;
    final accent = dark ? AppColor.brightGreen : AppColor.primaryColor.withValues(alpha: 0.8);
    final title = Text(requirement.title, style: GoogleFonts.urbanist(fontSize: 14, color: accent, fontWeight: FontWeight.w600));
    final value = Text(requirement.label, style: GoogleFonts.urbanist(fontSize: large ? 24 : 13, color: accent, fontWeight: FontWeight.bold));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (large) ...[
          title,
          const SizedBox(height: 8),
          value,
        ] else
          Row(children: [Expanded(child: title), const SizedBox(width: 12), value]),
        SizedBox(height: large ? 16 : 10),
        LinearPercentIndicator(
          padding: EdgeInsets.zero,
          lineHeight: 10.0,
          percent: requirement.progress.clamp(0.0, 1.0),
          animation: true,
          barRadius: const Radius.circular(10),
          backgroundColor: dark ? AppColor.white.withValues(alpha: 0.14) : AppColor.grey_200,
          progressColor: dark ? AppColor.brightGreen : AppColor.primaryColor,
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({required this.eligible, required this.onTap});

  final bool eligible;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      key: const ValueKey('monetization-action'),
      onTap: onTap,
      child: Container(
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: eligible ? AppColor.primaryColor : AppColor.primaryColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          AppStrings.monetization.tr,
          textAlign: TextAlign.center,
          style: GoogleFonts.urbanist(fontWeight: FontWeight.w600, fontSize: 16, color: eligible ? AppColor.white : AppColor.primaryColor),
        ),
      ),
    );
  }
}

class _MonetizationShimmer extends StatelessWidget {
  const _MonetizationShimmer();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        ContainerShimmerUi(height: 220, radius: 20, width: double.infinity),
        SizedBox(height: 20),
        ContainerShimmerUi(height: 140, radius: 20, width: double.infinity),
        SizedBox(height: 20),
        ContainerShimmerUi(height: 48, radius: 30, width: double.infinity),
      ],
    );
  }
}
