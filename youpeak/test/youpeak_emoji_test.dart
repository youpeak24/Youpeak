import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/custom/custom_ui/youpeak_emoji.dart';

String render(String text) => YouPeakEmoji.spans(text, null)
    .map((s) => s is TextSpan ? s.text! : '[${((s as WidgetSpan).child as Image).semanticLabel}]')
    .join();

void main() {
  test('swaps known emoji, keeps surrounding text', () {
    expect(render('Great video 🔥🔥 thanks 🙏'), 'Great video [🔥][🔥] thanks [🙏]');
  });

  test('consumes the variation selector with the emoji', () {
    expect(render('love ❤️ it'), 'love [❤️] it');
  });

  test('leaves skin-tone and ZWJ sequences native', () {
    expect(render('👍🏽'), '👍🏽');
    expect(render('🤦‍♂️'), '🤦‍♂️');
    expect(render('❤️‍🔥'), '❤️‍🔥');
  });

  test('plain text and unknown emoji untouched', () {
    expect(render('no emoji here 🦄'), 'no emoji here 🦄');
  });

  test('every mapped asset is declared and picker covers the whole set', () {
    expect(YouPeakEmoji.picker.toSet(), YouPeakEmoji.assets.keys.toSet());
  });
}
