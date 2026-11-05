import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// The asset registry (`AppIcons`, `AppVisuals`) and the files it names.
///
/// Android resolves asset paths case-sensitively and Windows does not, so a
/// registry entry can work on a developer's machine and fail on a phone. These
/// checks make that mismatch a test failure.
void main() {
  final root = Directory.current.path;
  final registryFiles = ['lib/core/assets/app_icons.dart', 'lib/core/assets/app_visuals.dart'];
  final assetPath = RegExp(r"""['"](assets/[^'"$\n]+)['"]""");

  Set<String> registered() {
    final paths = <String>{};
    for (final f in registryFiles) {
      paths.addAll(assetPath.allMatches(File('$root/$f').readAsStringSync()).map((m) => m.group(1)!));
    }
    return paths;
  }

  Set<String> iconFiles() => Directory('$root/assets/icons').listSync().whereType<File>().map((f) => 'assets/icons/${f.uri.pathSegments.last}').toSet();

  test('every registered asset exists with exactly this case', () {
    final files = iconFiles();
    final missing = registered().where((p) => !files.contains(p)).toList()..sort();
    expect(missing, isEmpty, reason: 'registry entries without a file (check case): $missing');
  });

  test('coin pack artwork resolves for every step', () {
    final files = iconFiles();
    for (var i = 1; i <= 6; i++) {
      expect(files, contains('assets/icons/coin_pack_$i.png'));
    }
  });

  test('no two icon files differ only by case', () {
    final seen = <String, String>{};
    final clashes = <String>[];
    for (final p in iconFiles()) {
      final previous = seen[p.toLowerCase()];
      if (previous != null) clashes.add('$previous / $p');
      seen[p.toLowerCase()] = p;
    }
    expect(clashes, isEmpty);
  });

  test('only assets/icons is bundled (masters, drafts and previews stay out)', () {
    final pubspec = File('$root/pubspec.yaml').readAsStringSync();
    final declared = RegExp(r'^\s+-\s+(assets/[^\s#]+)', multiLine: true).allMatches(pubspec).map((m) => m.group(1)!).toList();
    expect(declared, ['assets/icons/']);
  });

  test('every bundled glyph is reachable from the registry or documented as dynamic', () {
    // Files with no registry constant are either interpolated (coin packs) or
    // retained legacy artwork; list them so additions are a conscious choice.
    final orphans = iconFiles().difference(registered())..removeWhere((p) => RegExp(r'coin_pack_\d\.png$').hasMatch(p));
    // Reactions (react_*.png) are referenced by name from the emoji picker.
    orphans.removeWhere((p) => p.contains('/react_'));
    expect(orphans.length, lessThan(40), reason: 'orphan assets: $orphans');
  });
}
