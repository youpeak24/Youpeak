import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/platform/app_layout.dart';

void main() {
  testWidgets('app page frame keeps page content visible', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AppPageFrame(
          branded: true,
          child: ColoredBox(
            color: Colors.white,
            child: Center(child: Text('YouPeak page')),
          ),
        ),
      ),
    );

    expect(find.text('YouPeak page'), findsOneWidget);
  });

  testWidgets('wide web auth pages use the desktop brand panel',
      (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(1440, 900);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const MaterialApp(
        home: AppPageFrame(
          branded: true,
          child: ColoredBox(color: Colors.white),
        ),
      ),
    );

    expect(
      find.text('Watch. Create.\nReach your peak.'),
      kIsWeb ? findsOneWidget : findsNothing,
    );
  });
}
