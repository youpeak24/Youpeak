import 'package:flutter/material.dart';

/// YouPeak's illustrated emoji set.
///
/// Comments and chat are stored as plain text with standard Unicode emoji, so
/// other clients still read them; this app swaps the known ones for artwork
/// when rendering.
abstract final class YouPeakEmoji {
  static const Map<String, String> assets = {
    '👍': 'assets/icons/react_like.png',
    '❤': 'assets/icons/react_love.png',
    '💚': 'assets/icons/react_green_heart.png',
    '😂': 'assets/icons/react_laugh.png',
    '🤣': 'assets/icons/react_rofl.png',
    '😮': 'assets/icons/react_wow.png',
    '😢': 'assets/icons/react_sad.png',
    '😡': 'assets/icons/react_angry.png',
    '😍': 'assets/icons/react_heart_eyes.png',
    '🤩': 'assets/icons/react_star_struck.png',
    '🔥': 'assets/icons/react_fire.png',
    '👏': 'assets/icons/react_clap.png',
    '💯': 'assets/icons/react_100.png',
    '🤯': 'assets/icons/react_mind_blown.png',
    '😎': 'assets/icons/react_cool.png',
    '🤔': 'assets/icons/react_thinking.png',
    '🙏': 'assets/icons/react_namaste.png',
    '🥳': 'assets/icons/react_party.png',
    '🤗': 'assets/icons/react_hug.png',
    '😉': 'assets/icons/react_wink.png',
    '💀': 'assets/icons/react_skull.png',
    '👀': 'assets/icons/react_eyes.png',
    '🍿': 'assets/icons/react_popcorn.png',
    '🚀': 'assets/icons/react_rocket.png',
    '💪': 'assets/icons/react_muscle.png',
    '🤦': 'assets/icons/react_facepalm.png',
    '👌': 'assets/icons/react_ok.png',
    '⛰': 'assets/icons/react_peak.png',
    '🤑': 'assets/icons/react_coin_eyes.png',
    '👑': 'assets/icons/react_crown_face.png',
  };

  /// Order for the quick-reaction bar: most-used first, brand emoji last.
  static const List<String> picker = [
    '👍', '❤', '😂', '🔥', '👏', '😍', '🙏', '💯', '⛰', '🤩', '😮', '🥳', '🚀', '💪', '👌', '😎',
    '🤣', '😢', '😡', '🤯', '🤔', '🤗', '😉', '💀', '👀', '🍿', '🤦', '💚', '🤑', '👑',
  ];

  // Longest keys first so multi-code-unit emoji never match partially. The
  // variation selector (U+FE0F) is consumed with the emoji; skin-tone and ZWJ
  // sequences (👍🏽, 🤦‍♂️, ❤️‍🔥) are left alone so they render natively.
  static final RegExp _pattern = RegExp(
    r'(?<!‍)'
    '(${(assets.keys.toList()..sort((a, b) => b.length.compareTo(a.length))).map(RegExp.escape).join('|')})'
    r'(?!️?[\u{1F3FB}-\u{1F3FF}‍])️?',
    unicode: true,
  );

  static List<InlineSpan> spans(String text, TextStyle? style, {double scale = 1.3}) {
    final size = (style?.fontSize ?? 14) * scale;
    final result = <InlineSpan>[];
    var last = 0;
    for (final match in _pattern.allMatches(text)) {
      if (match.start > last) result.add(TextSpan(text: text.substring(last, match.start)));
      result.add(WidgetSpan(
        alignment: PlaceholderAlignment.middle,
        child: Image.asset(assets[match.group(1)]!, width: size, height: size, semanticLabel: match.group(0)),
      ));
      last = match.end;
    }
    if (last < text.length) result.add(TextSpan(text: text.substring(last)));
    return result;
  }
}

/// Drop-in replacement for [Text] that renders YouPeak emoji artwork.
class EmojiText extends StatelessWidget {
  const EmojiText(this.text, {super.key, this.style, this.maxLines, this.overflow, this.textAlign});

  final String text;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) => Text.rich(
        TextSpan(children: YouPeakEmoji.spans(text, style ?? DefaultTextStyle.of(context).style)),
        style: style,
        maxLines: maxLines,
        overflow: overflow,
        textAlign: textAlign,
      );
}

/// Horizontal strip of emoji artwork; [onPick] receives the Unicode emoji.
class EmojiQuickBar extends StatelessWidget {
  const EmojiQuickBar({super.key, required this.onPick, this.size = 30});

  final ValueChanged<String> onPick;
  final double size;

  /// Inserts [emoji] at the cursor (or appends) and keeps the caret after it.
  static void insertInto(TextEditingController controller, String emoji) {
    final value = controller.value;
    final start = value.selection.isValid ? value.selection.start : value.text.length;
    final end = value.selection.isValid ? value.selection.end : value.text.length;
    controller.value = TextEditingValue(
      text: value.text.replaceRange(start, end, emoji),
      selection: TextSelection.collapsed(offset: start + emoji.length),
    );
  }

  @override
  Widget build(BuildContext context) => SizedBox(
        height: size + 12,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 6),
          itemCount: YouPeakEmoji.picker.length,
          itemBuilder: (context, index) {
            final emoji = YouPeakEmoji.picker[index];
            return InkResponse(
              onTap: () => onPick(emoji),
              radius: size * 0.75,
              child: Padding(
                padding: const EdgeInsets.all(6),
                child: Image.asset(YouPeakEmoji.assets[emoji]!, width: size, height: size, semanticLabel: emoji),
              ),
            );
          },
        ),
      );
}
