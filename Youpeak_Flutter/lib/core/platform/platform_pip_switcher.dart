import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:floating/floating.dart';

// PiPSwitcher polls the native picture-in-picture state every 100 ms; in the
// browser that native call doesn't exist and would throw on every poll, so
// the web app always shows the normal (non-PiP) layout.
class PlatformPiPSwitcher extends StatelessWidget {
  const PlatformPiPSwitcher({super.key, required this.childWhenEnabled, required this.childWhenDisabled});

  final Widget childWhenEnabled;
  final Widget childWhenDisabled;

  @override
  Widget build(BuildContext context) =>
      kIsWeb ? childWhenDisabled : PiPSwitcher(childWhenEnabled: childWhenEnabled, childWhenDisabled: childWhenDisabled);
}
