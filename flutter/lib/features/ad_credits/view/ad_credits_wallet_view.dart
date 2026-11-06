import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/ad_credits/controller/ad_credits_controller.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';

class AdCreditsWalletView extends StatelessWidget {
  const AdCreditsWalletView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AdCreditsController());
    final isDark = isDarkMode.value;
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final numberFormat = NumberFormat('#,##0.00');

    return Scaffold(
      backgroundColor: isDark ? AppColor.mainDark : AppColor.lightGreyBG,
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarBrightness: isDark ? Brightness.light : Brightness.dark,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 20, color: isDark ? AppColor.white : AppColor.black),
          onPressed: () => Get.back(),
        ),
        title: Text(
          AppStrings.adCreditsWalletTitle.tr,
          style: GoogleFonts.urbanist(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColor.white : AppColor.black,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.info_outline, color: isDark ? AppColor.white : AppColor.greyColor),
            tooltip: "About Ad Credits",
            onPressed: () => _showAdCreditsInfoDialog(context),
          ),
          IconButton(
            icon: Icon(Icons.refresh, color: isDark ? AppColor.white : AppColor.greyColor),
            tooltip: "Refresh Wallet",
            onPressed: () => controller.loadAll(),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final maxWidth = math.min(constraints.maxWidth, 1100.0);
          final isTabletOrDesktop = constraints.maxWidth >= 600;
          final isDesktop = constraints.maxWidth >= 900;

          return Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxWidth),
              child: GetBuilder<AdCreditsController>(
                builder: (controller) {
                  if (controller.isLoading) {
                    return const Center(child: CircularProgressIndicator(color: AppColor.primaryColor));
                  }

                  return RefreshIndicator(
                    onRefresh: () => controller.loadAll(),
                    color: AppColor.primaryColor,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Hero Balance Overview Card
                          _buildBalanceHeroCard(context, controller, isDark, numberFormat),
                          const SizedBox(height: 24),

                          // 2. Ad Credit Top-up Packs Section
                          _buildPacksSection(context, controller, isDark, isTabletOrDesktop, isDesktop, currencyFormat, numberFormat),
                          const SizedBox(height: 24),

                          // 3. Checkout Summary & Action Section
                          if (controller.selectedPack != null)
                            _buildCheckoutSection(context, controller, isDark, currencyFormat, numberFormat),
                          const SizedBox(height: 32),

                          // 4. Ledger Transaction History Section
                          _buildHistorySection(context, controller, isDark, numberFormat),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Hero Balance Card ───────────────────────────────────────────────────────
  Widget _buildBalanceHeroCard(
    BuildContext context,
    AdCreditsController controller,
    bool isDark,
    NumberFormat numberFormat,
  ) {
    final wallet = controller.wallet;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColor.greenLinearGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColor.primaryColor.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  AppStrings.availableAdCredits.tr.toUpperCase(),
                  style: GoogleFonts.urbanist(
                    color: AppColor.white.withValues(alpha: 0.85),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.1,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColor.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified, size: 14, color: AppColor.white),
                    const SizedBox(width: 4),
                    Text(
                      "PROMOTIONAL",
                      style: GoogleFonts.urbanist(
                        color: AppColor.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                numberFormat.format(wallet.available),
                style: GoogleFonts.urbanist(
                  color: AppColor.white,
                  fontSize: 38,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "Credits",
                style: GoogleFonts.urbanist(
                  color: AppColor.white.withValues(alpha: 0.9),
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 16),
          // 4-Column Breakdown Grid
          Row(
            children: [
              Expanded(
                child: _buildBreakdownPill(
                  label: AppStrings.planCredits.tr,
                  amount: numberFormat.format(wallet.plan),
                  subtitle: "Permanent Pass",
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildBreakdownPill(
                  label: AppStrings.topupCredits.tr,
                  amount: numberFormat.format(wallet.topup),
                  subtitle: "Purchased",
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildBreakdownPill(
                  label: AppStrings.bonusCredits.tr,
                  amount: numberFormat.format(wallet.bonus),
                  subtitle: "Promotional",
                ),
              ),
            ],
          ),
          if (wallet.expiringSoon > 0) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.amber.shade900.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.shade400.withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, size: 18, color: Colors.amberAccent),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "${numberFormat.format(wallet.expiringSoon)} credits expiring soon (${wallet.expiringSoonDate != null ? _formatDate(wallet.expiringSoonDate!) : 'in 30 days'}).",
                      style: GoogleFonts.urbanist(
                        color: Colors.amberAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBreakdownPill({
    required String label,
    required String amount,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.urbanist(
              color: AppColor.white.withValues(alpha: 0.8),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            amount,
            style: GoogleFonts.urbanist(
              color: AppColor.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.urbanist(
              color: AppColor.white.withValues(alpha: 0.6),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  // ── Top-up Packs Section ───────────────────────────────────────────────────
  Widget _buildPacksSection(
    BuildContext context,
    AdCreditsController controller,
    bool isDark,
    bool isTablet,
    bool isDesktop,
    NumberFormat currencyFormat,
    NumberFormat numberFormat,
  ) {
    final packs = controller.packs;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 6,
          children: [
            Text(
              AppStrings.topupPacks.tr,
              style: GoogleFonts.urbanist(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColor.white : AppColor.black,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? AppColor.darkCard : AppColor.secondaryMintGreen,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                "Validity: 730 Days",
                style: GoogleFonts.urbanist(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColor.primaryColor,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (packs.isEmpty)
          const DataNotFoundUi(title: "No credit packs available at this moment.")
        else
          GridView.builder(
            itemCount: packs.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isDesktop ? 3 : (isTablet ? 3 : 2),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              mainAxisExtent: 185,
            ),
            itemBuilder: (context, index) {
              final pack = packs[index];
              final isSelected = controller.selectedPackIndex == index;

              return GestureDetector(
                onTap: () => controller.selectPack(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? AppColor.darkCard : AppColor.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? AppColor.primaryColor : (isDark ? AppColor.darkCardBorder : AppColor.grey_200),
                      width: isSelected ? 2.2 : 1.0,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColor.primaryColor.withValues(alpha: 0.18),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Stack(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                pack.name,
                                style: GoogleFonts.urbanist(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? AppColor.white : AppColor.black,
                                ),
                              ),
                              if (pack.bonusPercent > 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColor.primaryColor,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    "${pack.bonusPercent}% BONUS",
                                    style: GoogleFonts.urbanist(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: AppColor.white,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "${numberFormat.format(pack.credits)} Credits",
                            style: GoogleFonts.urbanist(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: AppColor.primaryColor,
                            ),
                          ),
                          const SizedBox(height: 4),
                          if (pack.bonusCredits > 0)
                            Text(
                              "${numberFormat.format(pack.baseCredits)} + ${numberFormat.format(pack.bonusCredits)} bonus",
                              style: GoogleFonts.urbanist(
                                fontSize: 11,
                                color: isDark ? AppColor.grey : AppColor.greyColor,
                              ),
                            )
                          else
                            Text(
                              "Standard Pack",
                              style: GoogleFonts.urbanist(
                                fontSize: 11,
                                color: isDark ? AppColor.grey : AppColor.greyColor,
                              ),
                            ),
                          const Spacer(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                currencyFormat.format(pack.priceINR),
                                style: GoogleFonts.urbanist(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? AppColor.white : AppColor.black,
                                ),
                              ),
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected ? AppColor.primaryColor : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected ? AppColor.primaryColor : AppColor.grey,
                                    width: 1.5,
                                  ),
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check, size: 14, color: AppColor.white)
                                    : null,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  // ── Checkout Section ───────────────────────────────────────────────────────
  Widget _buildCheckoutSection(
    BuildContext context,
    AdCreditsController controller,
    bool isDark,
    NumberFormat currencyFormat,
    NumberFormat numberFormat,
  ) {
    final pack = controller.selectedPack!;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColor.darkCard : AppColor.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColor.darkCardBorder : AppColor.grey_200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Order Summary",
            style: GoogleFonts.urbanist(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColor.white : AppColor.black,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Selected Pack:",
                style: GoogleFonts.urbanist(fontSize: 14, color: isDark ? AppColor.grey : AppColor.greyColor),
              ),
              Text(
                pack.name,
                style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? AppColor.white : AppColor.black),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Credits Allocation:",
                style: GoogleFonts.urbanist(fontSize: 14, color: isDark ? AppColor.grey : AppColor.greyColor),
              ),
              Text(
                "${numberFormat.format(pack.baseCredits)} Base + ${numberFormat.format(pack.bonusCredits)} Bonus",
                style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600, color: AppColor.primaryColor),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Validity:",
                style: GoogleFonts.urbanist(fontSize: 14, color: isDark ? AppColor.grey : AppColor.greyColor),
              ),
              Text(
                "${pack.validityDays} Days",
                style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? AppColor.white : AppColor.black),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Total Amount Payable:",
                style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? AppColor.white : AppColor.black),
              ),
              Text(
                currencyFormat.format(pack.priceINR),
                style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800, color: AppColor.primaryColor),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Terms Checkbox
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Checkbox(
                  value: controller.isTermsAccepted,
                  onChanged: (val) => controller.toggleTerms(val),
                  activeColor: AppColor.primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => controller.toggleTerms(!controller.isTermsAccepted),
                  child: Text(
                    AppStrings.adCreditsTerms.tr,
                    style: GoogleFonts.urbanist(
                      fontSize: 12,
                      color: isDark ? AppColor.grey : AppColor.greyColor,
                      height: 1.3,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: (!controller.isTermsAccepted || controller.isPurchasing)
                  ? null
                  : () => controller.purchaseSelectedPack(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColor.primaryColor,
                disabledBackgroundColor: AppColor.grey_300,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: controller.isPurchasing
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white),
                    )
                  : Text(
                      "Pay ${currencyFormat.format(pack.priceINR)} & Add Credits",
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColor.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Ledger Transaction History Section ─────────────────────────────────────
  Widget _buildHistorySection(
    BuildContext context,
    AdCreditsController controller,
    bool isDark,
    NumberFormat numberFormat,
  ) {
    final history = controller.filteredHistory;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              AppStrings.creditHistory.tr,
              style: GoogleFonts.urbanist(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColor.white : AppColor.black,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Filter Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip(controller, "ALL", "All", isDark),
              const SizedBox(width: 8),
              _buildFilterChip(controller, "CREDIT", "Credits (+)", isDark),
              const SizedBox(width: 8),
              _buildFilterChip(controller, "DEBIT", "Debits (-)", isDark),
              const SizedBox(width: 8),
              _buildFilterChip(controller, "EXPIRY", "Expired", isDark),
            ],
          ),
        ),
        const SizedBox(height: 14),
        if (history.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isDark ? AppColor.darkCard : AppColor.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              "No transactions recorded for this filter.",
              style: GoogleFonts.urbanist(
                color: isDark ? AppColor.grey : AppColor.greyColor,
                fontSize: 14,
              ),
            ),
          )
        else
          ListView.separated(
            itemCount: history.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final item = history[index];
              final isCredit = item.direction.toUpperCase() == "CREDIT";
              final isExpiry = item.source == "EXPIRY";

              Color iconBg = isCredit ? AppColor.secondaryMintGreen : (isExpiry ? AppColor.grey_200 : const Color(0xFFFFECEB));
              Color iconColor = isCredit ? AppColor.primaryColor : (isExpiry ? AppColor.greyColor : AppColor.darkRed);
              IconData icon = isCredit ? Icons.add_circle_outline : (isExpiry ? Icons.hourglass_disabled : Icons.remove_circle_outline);

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? AppColor.darkCard : AppColor.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? AppColor.darkCardBorder : AppColor.grey_100),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: iconBg,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: iconColor, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _formatSourceName(item.source, item.purpose),
                            style: GoogleFonts.urbanist(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isDark ? AppColor.white : AppColor.black,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "${_formatDate(item.createdAt)} • ${item.type}",
                            style: GoogleFonts.urbanist(
                              fontSize: 11,
                              color: isDark ? AppColor.grey : AppColor.greyColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "${isCredit ? '+' : '-'}${numberFormat.format(item.credits)}",
                          style: GoogleFonts.urbanist(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isCredit ? AppColor.primaryColor : (isExpiry ? AppColor.greyColor : AppColor.darkRed),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Bal: ${numberFormat.format(item.balanceAfter)}",
                          style: GoogleFonts.urbanist(
                            fontSize: 11,
                            color: isDark ? AppColor.grey : AppColor.greyColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildFilterChip(
    AdCreditsController controller,
    String key,
    String label,
    bool isDark,
  ) {
    final isSelected = controller.historyFilter == key;

    return GestureDetector(
      onTap: () => controller.setFilter(key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColor.primaryColor : (isDark ? AppColor.darkCard : AppColor.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColor.primaryColor : (isDark ? AppColor.darkCardBorder : AppColor.grey_300),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.urbanist(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? AppColor.white : (isDark ? AppColor.white : AppColor.black),
          ),
        ),
      ),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  String _formatSourceName(String source, String? purpose) {
    switch (source.toUpperCase()) {
      case "TOPUP":
        return "Top-Up Purchase";
      case "STARTER_PASS":
        return "Starter Pass Benefit";
      case "PARTNER_LICENSE":
        return "Digital Partner License";
      case "SPEND":
        return purpose == "video_promotion"
            ? "Video Promotion Spend"
            : (purpose == "local_business_ad" ? "Local Business Ad" : "Ad Consumption");
      case "EXPIRY":
        return "Expired Credits";
      case "REVERSAL":
        return "Debit Reversal";
      default:
        return source;
    }
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd MMM yyyy, hh:mm a').format(date.toLocal());
    } catch (_) {
      return isoString;
    }
  }

  void _showAdCreditsInfoDialog(BuildContext context) {
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.info_outline, color: AppColor.primaryColor),
                  const SizedBox(width: 8),
                  Text(
                    "About Ad Credits",
                    style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                "• Ad Credits are purely dedicated for digital promotional services including creator video views, profile reach, and local business promotions.\n\n"
                "• Ad Credits are distinct from Reward Coins and cannot be converted to cash or withdrawn.\n\n"
                "• Top-up credits carry a validity of 730 days (2 years). Membership Starter Pass and Partner License credits do not expire.\n\n"
                "• When credits are spent, lots expiring earliest are consumed first to protect your value.",
                style: GoogleFonts.urbanist(fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Get.back(),
                  child: Text(
                    "Got it",
                    style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold, color: AppColor.primaryColor),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
