import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/theme/theme_view.dart';
import 'package:youpeak/shared/dialogs/app_sheet.dart';

/// Bottom sheets must not span a desktop window; on a phone they keep the full width.
void main() {
  const content = SizedBox(key: Key('sheet'), width: double.infinity, height: 200, child: Text('sheet'));

  Future<Rect> openSheet(WidgetTester tester, Size size, void Function(BuildContext) open) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      GetMaterialApp(
        theme: Themes.light,
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(onPressed: () => open(context), child: const Text('open')),
          ),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    return tester.getRect(find.byKey(const Key('sheet')));
  }

  group('AppSheet (replaces Get.bottomSheet)', () {
    testWidgets('is a centred 640px panel on a wide window, flush to the bottom', (tester) async {
      final rect = await openSheet(tester, const Size(1440, 900), (_) => AppSheet.show(content));
      expect(rect.width, 640);
      expect(rect.center.dx, 720);
      expect(rect.bottom, 900);
    });

    testWidgets('keeps the full width on a phone', (tester) async {
      final rect = await openSheet(tester, const Size(390, 844), (_) => AppSheet.show(content));
      expect(rect.width, 390);
      expect(rect.left, 0);
    });

    testWidgets('returns the value the sheet is closed with', (tester) async {
      Object? result;
      await openSheet(
          tester,
          const Size(1440, 900),
          (_) async => result = await AppSheet.show<String>(
              TextButton(key: const Key('sheet'), onPressed: () => Get.back(result: 'done'), child: const Text('close'))));
      await tester.tap(find.text('close'));
      await tester.pumpAndSettle();
      expect(result, 'done');
    });

    testWidgets('uses the colour and shape it is given', (tester) async {
      await openSheet(
        tester,
        const Size(1440, 900),
        (_) => AppSheet.show(content,
            backgroundColor: Colors.red,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24)))),
      );
      final material = tester.widget<Material>(find.ancestor(of: find.byKey(const Key('sheet')), matching: find.byType(Material)).first);
      expect(material.color, Colors.red);
      expect(material.shape, isA<RoundedRectangleBorder>());
    });
  });

  group("Flutter's own showModalBottomSheet (theme constraint)", () {
    testWidgets('is capped at 640 on a wide window', (tester) async {
      final rect = await openSheet(
          tester, const Size(1440, 900), (context) => showModalBottomSheet<void>(context: context, builder: (_) => content));
      expect(rect.width, 640);
    });

    testWidgets('keeps the full width on a phone', (tester) async {
      final rect =
          await openSheet(tester, const Size(390, 844), (context) => showModalBottomSheet<void>(context: context, builder: (_) => content));
      expect(rect.width, 390);
    });
  });
}
