import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/profile_page/setting_page/grievance_page/grievance_api.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

// IT Rules 2021 — Grievance Officer disclosure + in-app grievance filing/tracking.
class GrievanceView extends StatefulWidget {
  const GrievanceView({super.key});

  @override
  State<GrievanceView> createState() => _GrievanceViewState();
}

class _GrievanceViewState extends State<GrievanceView> {
  bool isLoadingOfficer = true;
  Map<String, dynamic>? officer;

  bool isSubmitting = false;
  String selectedCategory = "OTHER";
  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController contactEmailController = TextEditingController();

  bool isTracking = false;
  final TextEditingController trackIdController = TextEditingController();
  Map<String, dynamic>? trackedGrievance;

  late final List<MapEntry<String, String>> categories = [
    MapEntry("ANTI_NATIONAL", AppStrings.grievanceCategoryAntiNational.tr),
    MapEntry("HATE_SPEECH", AppStrings.grievanceCategoryHateSpeech.tr),
    MapEntry("DEFAMATION", AppStrings.grievanceCategoryDefamation.tr),
    MapEntry("COPYRIGHT", AppStrings.grievanceCategoryCopyright.tr),
    MapEntry("HARASSMENT", AppStrings.grievanceCategoryHarassment.tr),
    MapEntry("OTHER", AppStrings.grievanceCategoryOther.tr),
  ];

  @override
  void initState() {
    super.initState();
    loadOfficer();
  }

  @override
  void dispose() {
    descriptionController.dispose();
    contactEmailController.dispose();
    trackIdController.dispose();
    super.dispose();
  }

  Future<void> loadOfficer() async {
    final data = await GrievanceApi.getOfficerDetails();
    if (!mounted) return;
    setState(() {
      officer = data;
      isLoadingOfficer = false;
    });
  }

  Future<void> onSubmitGrievance() async {
    if (descriptionController.text.trim().length < 5) {
      CustomToast.show(AppStrings.pleaseDescribeGrievance.tr);
      return;
    }
    setState(() => isSubmitting = true);
    final result = await GrievanceApi.fileGrievance(
      category: selectedCategory,
      description: descriptionController.text.trim(),
      contactEmail: contactEmailController.text.trim(),
    );
    if (!mounted) return;
    setState(() => isSubmitting = false);

    if (result["status"] == true) {
      descriptionController.clear();
      contactEmailController.clear();
      CustomToast.show(AppStrings.grievanceFiledSuccess.tr);
      showReferenceDialog(result["grievanceId"]?.toString() ?? "", result["deadlineAt"]?.toString());
    } else {
      CustomToast.show(result["message"]?.toString() ?? AppStrings.someThingWentWrong.tr);
    }
  }

  void showReferenceDialog(String grievanceId, String? deadlineAt) {
    Get.defaultDialog(
      title: AppStrings.grievanceFiledSuccess.tr,
      titleStyle: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      radius: 20,
      content: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("${AppStrings.referenceId.tr}: $grievanceId", style: GoogleFonts.urbanist(fontWeight: FontWeight.w600)),
            if (deadlineAt != null) ...[
              const SizedBox(height: 6),
              Text("${AppStrings.deadline.tr}: ${formatDate(deadlineAt)}", style: GoogleFonts.urbanist(fontSize: 12)),
            ],
          ],
        ),
      ),
      confirm: GestureDetector(
        onTap: () => Get.back(),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
          decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(25)),
          child: Text(AppStrings.ok.tr, style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }

  Future<void> onTrackGrievance() async {
    final id = trackIdController.text.trim();
    if (id.isEmpty) return;
    setState(() {
      isTracking = true;
      trackedGrievance = null;
    });
    final result = await GrievanceApi.trackGrievance(id);
    if (!mounted) return;
    setState(() {
      isTracking = false;
      if (result["status"] == true) {
        trackedGrievance = Map<String, dynamic>.from(result["grievance"] ?? {});
      } else {
        trackedGrievance = null;
      }
    });
    if (result["status"] != true) {
      CustomToast.show(result["message"]?.toString() ?? AppStrings.grievanceNotFound.tr);
    }
  }

  String formatDate(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return "${dt.day.toString().padLeft(2, '0')}-${dt.month.toString().padLeft(2, '0')}-${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";
  }

  InputDecoration hintDecoration(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey, fontWeight: FontWeight.w600),
        border: InputBorder.none,
      );

  BoxDecoration fieldDecoration() => BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
          child: Obx(() => Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15)),
          onTap: () => Get.back(),
        ),
        leadingWidth: 33,
        title: Text(AppStrings.grievanceOfficer.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Obx(
            () => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                Text(AppStrings.grievanceOfficerSubtitle.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
                const SizedBox(height: 15),
                if (isLoadingOfficer)
                  const Padding(padding: EdgeInsets.symmetric(vertical: 30), child: LoaderUi())
                else if (officer == null)
                  Text(AppStrings.someThingWentWrong.tr, style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey))
                else
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: fieldDecoration(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(officer!["officerName"]?.toString() ?? "", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(officer!["companyName"]?.toString() ?? "", style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey)),
                        const SizedBox(height: 10),
                        officerRow(Icons.email_outlined, officer!["contactEmail"]?.toString() ?? ""),
                        if ((officer!["contactPhone"]?.toString() ?? "").isNotEmpty) officerRow(Icons.phone_outlined, officer!["contactPhone"].toString()),
                        officerRow(Icons.location_on_outlined, officer!["address"]?.toString() ?? ""),
                        officerRow(Icons.schedule_outlined, officer!["workingHours"]?.toString() ?? ""),
                        officerRow(Icons.gavel_outlined, officer!["statutoryTurnaroundTime"]?.toString() ?? ""),
                      ],
                    ),
                  ),
                const SizedBox(height: 25),
                Text(AppStrings.fileAGrievance.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  decoration: fieldDecoration(),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: selectedCategory,
                      style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600, color: isDarkMode.value ? AppColor.white : AppColor.black),
                      dropdownColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                      items: categories
                          .map((c) => DropdownMenuItem<String>(value: c.key, child: Text(c.value)))
                          .toList(),
                      onChanged: (value) {
                        if (value != null) setState(() => selectedCategory = value);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
                  decoration: fieldDecoration(),
                  child: TextFormField(
                    controller: descriptionController,
                    minLines: 3,
                    maxLines: 6,
                    maxLength: 4000,
                    cursorColor: AppColor.grey,
                    style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
                    decoration: hintDecoration(AppStrings.grievanceDescriptionHint.tr),
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  height: 55,
                  padding: const EdgeInsets.only(left: 20),
                  decoration: fieldDecoration(),
                  child: Center(
                    child: TextFormField(
                      controller: contactEmailController,
                      keyboardType: TextInputType.emailAddress,
                      cursorColor: AppColor.grey,
                      style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
                      decoration: hintDecoration(AppStrings.contactEmailOptional.tr),
                    ),
                  ),
                ),
                const SizedBox(height: 15),
                GestureDetector(
                  onTap: isSubmitting ? null : onSubmitGrievance,
                  child: Container(
                    height: 48,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(100)),
                    child: isSubmitting
                        ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white))
                        : Text(AppStrings.submitGrievance.tr, style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 30),
                Divider(color: AppColor.grey_200),
                const SizedBox(height: 15),
                Text(AppStrings.trackAGrievance.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                Container(
                  height: 55,
                  padding: const EdgeInsets.only(left: 20),
                  decoration: fieldDecoration(),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: trackIdController,
                          cursorColor: AppColor.grey,
                          style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
                          decoration: hintDecoration(AppStrings.enterGrievanceReference.tr),
                        ),
                      ),
                      GestureDetector(
                        onTap: isTracking ? null : onTrackGrievance,
                        child: Container(
                          height: 55,
                          width: 55,
                          alignment: Alignment.center,
                          child: isTracking
                              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.search, color: AppColor.primaryColor),
                        ),
                      ),
                    ],
                  ),
                ),
                if (trackedGrievance != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: fieldDecoration(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        officerRow(Icons.info_outline, "${AppStrings.status.tr}: ${trackedGrievance!["status"] ?? "-"}"),
                        officerRow(Icons.calendar_today_outlined, "${AppStrings.filedOn.tr}: ${formatDate(trackedGrievance!["filedAt"]?.toString() ?? "")}"),
                        if (trackedGrievance!["deadlineAt"] != null)
                          officerRow(Icons.timer_outlined, "${AppStrings.deadline.tr}: ${formatDate(trackedGrievance!["deadlineAt"].toString())}"),
                        if ((trackedGrievance!["resolution"]?.toString() ?? "").isNotEmpty)
                          officerRow(Icons.check_circle_outline, "${AppStrings.resolution.tr}: ${trackedGrievance!["resolution"]}"),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget officerRow(IconData icon, String text) {
    if (text.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColor.grey),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
