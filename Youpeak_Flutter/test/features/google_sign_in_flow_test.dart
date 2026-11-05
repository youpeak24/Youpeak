import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/features/auth/service/google_login.dart';
import 'package:youpeak/features/auth/service/google_sign_in_flow.dart';

void main() {
  String? keyFor(String code) => GoogleSignInFlow.messageKeyFor(GoogleLoginOutcome.failed(code));

  test("closing the Google window is a quiet cancel, not an error", () {
    expect(GoogleSignInFlow.messageKeyFor(const GoogleLoginOutcome.cancelled()), isNull);
  });

  test("the deployed failure (unauthorized-domain) gets a specific message", () {
    expect(keyFor("unauthorized-domain"), AppStrings.googleSignInDomainNotAuthorized);
  });

  test("blocked popups, disabled provider, network and account conflicts are explained", () {
    expect(keyFor("popup-blocked"), AppStrings.googleSignInPopupBlocked);
    expect(keyFor("operation-not-allowed"), AppStrings.googleSignInDisabled);
    expect(keyFor("network-request-failed"), AppStrings.googleSignInNetwork);
    expect(keyFor("account-exists-with-different-credential"), AppStrings.googleSignInAccountExists);
  });

  test("anything else falls back to the generic failure message", () {
    expect(keyFor("internal-error"), AppStrings.googleLoginFailed);
    expect(keyFor("unknown"), AppStrings.googleLoginFailed);
  });

  test("no attempt is running at start", () {
    expect(GoogleSignInFlow.isRunning, isFalse);
  });
}
