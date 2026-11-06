import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/features/auth/phone/data/phone_auth_service.dart';
import 'package:youpeak/features/auth/phone/data/phone_number.dart';

/// Stands in for FirebaseAuth's native verifyPhoneNumber; each call runs [onVerify].
class _FakeAuth implements FirebaseAuth {
  _FakeAuth(this.onVerify);

  final void Function(Map<Symbol, dynamic> args) onVerify;
  int verifyCalls = 0;

  @override
  dynamic noSuchMethod(Invocation invocation) {
    if (invocation.memberName == #verifyPhoneNumber) {
      verifyCalls++;
      onVerify(invocation.namedArguments);
      return Future<void>.value();
    }
    return super.noSuchMethod(invocation);
  }
}

void sent(Map<Symbol, dynamic> a) => (a[#codeSent] as PhoneCodeSent)("verification-id", 7);

void main() {
  group("PhoneNumber.toE164", () {
    test("plain, spaced and pasted Indian numbers all give one +91 number", () {
      for (final input in ["9876543210", "98765 43210", "98765-43210", "919876543210", "+91 98765 43210", "09876543210", "(98765) 43210"]) {
        expect(PhoneNumber.toE164("91", input), "+919876543210", reason: input);
      }
    });

    test("never doubles the country code", () {
      expect(PhoneNumber.toE164("+91", "919876543210"), "+919876543210");
      expect(PhoneNumber.toE164("91", "+919876543210"), isNot(contains("9191")));
    });

    test("rejects Indian numbers that are not 10 digits starting 6-9", () {
      for (final input in ["", "12345", "987654321", "98765432101", "5876543210", "0000000000"]) {
        expect(PhoneNumber.toE164("91", input), isNull, reason: input);
      }
    });

    test("rejects a missing or malformed country code", () {
      expect(PhoneNumber.toE164("", "9876543210"), isNull);
      expect(PhoneNumber.toE164("0", "9876543210"), isNull);
      expect(PhoneNumber.toE164("9999", "9876543210"), isNull);
    });

    test("other countries pass through, an explicit + number wins", () {
      expect(PhoneNumber.toE164("1", "415 555 2671"), "+14155552671");
      expect(PhoneNumber.toE164("44", "7911 123456"), "+447911123456");
      expect(PhoneNumber.toE164("91", "+44 7911 123456"), "+447911123456");
    });

    test("rejects numbers longer than E.164 allows", () {
      expect(PhoneNumber.toE164("1", "1234567890123456"), isNull);
    });
  });

  group("error mapping", () {
    PhoneAuthFailure of(String code, [String? message]) =>
        PhoneAuthError.fromFirebase(FirebaseAuthException(code: code, message: message)).failure;

    test("the region-policy error is told apart from a disabled provider", () {
      expect(of("operation-not-allowed", "SMS unable to be sent until this region enabled by the app developer."),
          PhoneAuthFailure.regionBlocked);
      expect(of("operation-not-allowed", "The given sign-in provider is disabled for this Firebase project."),
          PhoneAuthFailure.providerDisabled);
      expect(of("operation-not-allowed"), PhoneAuthFailure.providerDisabled);
    });

    test("each real error code gets its own failure", () {
      expect(of("invalid-phone-number"), PhoneAuthFailure.invalidNumber);
      expect(of("quota-exceeded"), PhoneAuthFailure.quotaExceeded);
      expect(of("too-many-requests"), PhoneAuthFailure.rateLimited);
      expect(of("captcha-check-failed"), PhoneAuthFailure.captcha);
      expect(of("invalid-app-credential"), PhoneAuthFailure.captcha);
      expect(of("unauthorized-domain"), PhoneAuthFailure.unauthorizedDomain);
      expect(of("network-request-failed"), PhoneAuthFailure.network);
      expect(of("invalid-verification-code"), PhoneAuthFailure.invalidCode);
      expect(of("session-expired"), PhoneAuthFailure.codeExpired);
      expect(of("something-new"), PhoneAuthFailure.other);
    });

    test("user text never leaks Firebase's raw message", () {
      final e = PhoneAuthError.fromFirebase(
        FirebaseAuthException(
            code: "operation-not-allowed", message: "SMS unable to be sent until this region enabled by the app developer."),
      );
      expect(e.message, isNot(contains("app developer")));
      expect(e.message, contains("country"));
      expect(e.code, "operation-not-allowed");
    });
  });

  group("PhoneAuthService.sendCode", () {
    const number = "+919876543210";

    test("reports success only after Firebase confirmed codeSent", () async {
      final auth = _FakeAuth(sent);
      final v = await PhoneAuthService(auth: auth).sendCode(number);
      expect(v.verificationId, "verification-id");
      expect(auth.verifyCalls, 1);
    });

    test("a Firebase failure surfaces as a typed error, never as a sent code", () async {
      final auth = _FakeAuth((a) => (a[#verificationFailed] as PhoneVerificationFailed)(FirebaseAuthException(code: "too-many-requests")));
      final future = PhoneAuthService(auth: auth).sendCode(number);
      await expectLater(future, throwsA(isA<PhoneAuthError>().having((e) => e.failure, "failure", PhoneAuthFailure.rateLimited)));
    });

    test("the region error comes through with its failure kind", () async {
      final auth = _FakeAuth((a) => (a[#verificationFailed] as PhoneVerificationFailed)(
            FirebaseAuthException(
                code: "operation-not-allowed", message: "SMS unable to be sent until this region enabled by the app developer."),
          ));
      await expectLater(
        PhoneAuthService(auth: auth).sendCode(number),
        throwsA(isA<PhoneAuthError>().having((e) => e.failure, "failure", PhoneAuthFailure.regionBlocked)),
      );
    });

    test("a second send while one is in flight never reaches Firebase", () async {
      late Map<Symbol, dynamic> pending;
      final auth = _FakeAuth((a) => pending = a);
      final service = PhoneAuthService(auth: auth);

      final first = service.sendCode(number);
      await Future<void>.delayed(Duration.zero);
      await expectLater(
        service.sendCode(number),
        throwsA(isA<PhoneAuthError>().having((e) => e.failure, "failure", PhoneAuthFailure.throttled)),
      );
      expect(auth.verifyCalls, 1);

      (pending[#codeSent] as PhoneCodeSent)("verification-id", 1);
      await first;
    });

    test("after a failure the service is free again and the retry goes through", () async {
      var attempt = 0;
      final auth = _FakeAuth((a) {
        attempt++;
        if (attempt == 1) {
          (a[#verificationFailed] as PhoneVerificationFailed)(FirebaseAuthException(code: "network-request-failed"));
        } else {
          sent(a);
        }
      });
      final service = PhoneAuthService(auth: auth);
      await expectLater(service.sendCode(number), throwsA(isA<PhoneAuthError>()));
      final v = await service.sendCode(number);
      expect(v.verificationId, "verification-id");
      expect(auth.verifyCalls, 2);
    });

    test("the same number is refused during the cooldown, other numbers are not, and it reopens afterwards", () async {
      var now = DateTime(2026, 1, 1, 12);
      final auth = _FakeAuth(sent);
      final service = PhoneAuthService(auth: auth, now: () => now);

      await service.sendCode(number);
      await expectLater(
        service.sendCode(number),
        throwsA(isA<PhoneAuthError>().having((e) => e.failure, "failure", PhoneAuthFailure.throttled)),
      );
      expect(auth.verifyCalls, 1);

      await service.sendCode("+919876543211");
      expect(auth.verifyCalls, 2);

      now = now.add(const Duration(seconds: 31));
      await service.sendCode(number);
      expect(auth.verifyCalls, 3);
    });

    test("a failed send does not start a cooldown", () async {
      var fail = true;
      final auth = _FakeAuth((a) {
        if (fail) {
          (a[#verificationFailed] as PhoneVerificationFailed)(FirebaseAuthException(code: "operation-not-allowed", message: "region"));
        } else {
          sent(a);
        }
      });
      final service = PhoneAuthService(auth: auth);
      await expectLater(service.sendCode(number), throwsA(isA<PhoneAuthError>()));
      fail = false;
      expect((await service.sendCode(number)).verificationId, "verification-id");
    });

    test("when Firebase never calls back the future ends with an error instead of hanging", () async {
      final auth = _FakeAuth((a) => (a[#codeAutoRetrievalTimeout] as PhoneCodeAutoRetrievalTimeout)("id"));
      await expectLater(PhoneAuthService(auth: auth).sendCode(number), throwsA(isA<PhoneAuthError>()));
    });
  });
}
