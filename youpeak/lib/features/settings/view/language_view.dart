import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/localization/localization_service.dart';
import 'package:youpeak/core/localization/models/language_info.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/settings/api/fetch_language_api.dart';
import 'package:youpeak/features/settings/model/fetch_language_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

import 'package:youpeak/core/storage/prefrens.dart';

class LanguageView extends StatefulWidget {
  const LanguageView({super.key});

  @override
  State<LanguageView> createState() => _LanguageViewState();
}

class _LanguageViewState extends State<LanguageView> {
  bool isLoading = true;
  List<LanguageInfo> apiLanguages = [];
  LanguageInfo? selectedLanguage;
  String? prefLanguageCode;

  @override
  void initState() {
    super.initState();
    getLanguageData();
  }

  getLanguageData() async {
    prefLanguageCode = Database.selectedLanguage;

    FetchLanguageModel? model = await FetchLanguageApi.callApi(start: 0, limit: 1000);
    if (model != null && model.data != null) {
      apiLanguages = model.data!;
      try {
        selectedLanguage = apiLanguages.firstWhere((element) {
          String langCode = element.code;
          if (langCode.contains('_')) {
            langCode = langCode.split('_')[0];
          }
          return langCode == prefLanguageCode;
        });
      } catch (e) {
        if (apiLanguages.isNotEmpty) {
          selectedLanguage = apiLanguages.firstWhere((element) => element.isDefault, orElse: () => apiLanguages[0]);
        }
      }
    }

    if (mounted) {
      setState(() {
        isLoading = false;
      });
    }
  }

  onLanguageSave() {
    Get.back();
  }

  void onChangeLanguage(LanguageInfo value) async {
    selectedLanguage = value;

    String langCode = value.code;
    String countryCode = "US"; // Fallback as in user snippet

    if (langCode.contains('_')) {
      var split = langCode.split('_');
      langCode = split[0];
      countryCode = split[1];
    } else {
      // Try to find if there's an underscore in the nativeName or other fields? 
      // Usually the 'code' is the source of truth.
    }

    await Database.onSetSelectedLanguage(langCode);
    await Database.onSetSelectedLanguageCountryCode(countryCode);
    
    // Also update Preference if still used elsewhere
    Preference.shared.setString(Preference.selectedLanguage, langCode);
    Preference.shared.setString(Preference.selectedCountryCode, countryCode);

    final localizationService = Get.find<LocalizationService>();
    await localizationService.switchLanguage(value.code, countryCode);

    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15), onTap: () => Get.back()),
        leadingWidth: 33,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.language.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
              onPressed: () {
                onLanguageSave();
              },
              icon: const Icon(Icons.done))
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColor.primaryColor))
          : SingleChildScrollView(
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  for (int i = 0; i < apiLanguages.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(left: 10, bottom: 0),
                      child: GestureDetector(
                        onTap: () {
                          onChangeLanguage(apiLanguages[i]);
                        },
                        child: Container(
                          color: AppColor.transparent,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              Text(
                                apiLanguages[i].name, 
                                style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              if (apiLanguages[i].nativeName.isNotEmpty && apiLanguages[i].nativeName != apiLanguages[i].name) ...[
                                const SizedBox(width: 5),
                                Text(
                                  "(${apiLanguages[i].nativeName})", 
                                  style: GoogleFonts.urbanist(fontSize: 14),
                                ),
                              ],
                              const Spacer(),
                              Radio<LanguageInfo>(
                                  value: apiLanguages[i],
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  activeColor: AppColor.primaryColor,
                                  groupValue: selectedLanguage,
                                  onChanged: (value) {
                                    if (value != null) onChangeLanguage(value);
                                  }),
                            ],
                          ).paddingOnly(bottom: 15, left: 15, right: 15),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
