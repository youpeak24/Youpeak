import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/main.dart' show isDarkMode;
import 'package:youpeak/shared/widgets/app_pressable.dart';

/// A single-choice row: title, optional explanation, and a selection mark.
/// Used by every "pick one" page (visibility, audience, comments, ...), so
/// they read and behave the same.
class OptionTile extends StatelessWidget {
  const OptionTile({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    final accent = dark ? AppColor.brightGreen : AppColor.primaryColor;
    return Semantics(
      inMutuallyExclusiveGroup: true,
      selected: selected,
      button: true,
      label: subtitle == null ? title : "$title. $subtitle",
      excludeSemantics: true,
      child: AppPressable(
        onTap: onTap,
        haptic: true,
        pressedScale: 0.985,
        child: AnimatedContainer(
          duration: AppMotion.of(context),
          curve: AppMotion.curve,
          constraints: const BoxConstraints(minHeight: 56),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: selected ? accent.withValues(alpha: dark ? 0.16 : 0.07) : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: selected ? accent : AppElevation.hairline(dark), width: selected ? 1.6 : 1),
          ),
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(title, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800)),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle!,
                        style: GoogleFonts.urbanist(
                          fontSize: 13.5,
                          height: 1.3,
                          fontWeight: FontWeight.w500,
                          color: dark ? AppColor.mutedTextDark : AppColor.mutedText,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              AnimatedContainer(
                duration: AppMotion.of(context),
                height: 24,
                width: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? accent : Colors.transparent,
                  border: Border.all(color: selected ? accent : (dark ? AppColor.mutedTextDark : AppColor.grey), width: 2),
                ),
                child: selected ? const Icon(Icons.check_rounded, size: 16, color: AppColor.white) : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
