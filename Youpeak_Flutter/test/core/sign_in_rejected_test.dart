import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/features/auth/api/sign_up_api.dart';

void main() {
  test("a login refused with 401 says what is wrong: no key compiled in vs an out-of-date key", () {
    final noKey = signInRejectedMessage(keyCompiledIn: false);
    final staleKey = signInRejectedMessage(keyCompiledIn: true);
    expect(noKey, contains("without its API key"));
    expect(noKey, contains("scripts/run-web-dev.ps1"));
    expect(staleKey, contains("install the latest version"));
    expect(noKey, isNot(equals(staleKey)));
  });
}
