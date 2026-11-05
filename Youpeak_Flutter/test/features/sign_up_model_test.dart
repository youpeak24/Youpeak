import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';

// A login response as the backend returns it for a user who never entered an
// age: buildUserData() stores `age: ""`. The VM, like the phone (AOT) builds,
// checks types at runtime, so a String in an int field threw here and every
// such sign-in failed with "Something went wrong".
const _loginResponse = '''
{"status":true,"message":"User login Successfully.","user":{"_id":"u1","id":"u1","fullName":"Test Viewer",
"nickName":"Viewer","email":"viewer@youpeak.test","loginType":4,"image":"","coin":0,"isActive":true,
"isBlock":false,"isChannel":false,"paymentStatus":true,"uniqueId":"U-1","referralCode":"REF1",
"createdAt":"2026-10-03T07:50:05.275Z","date":"2026-10-03T07:52:52.278Z","country":"","descriptionOfChannel":"",
"gender":"","loginRewardCoin":0,"mobileNumber":"","channelType":1,"isNewUser":true,
"socialMediaLinks":{"instagramLink":"","websiteLink":"","twitterLink":"","facebookLink":""},
"totalRewardCoin":0,"plan":{"premiumPlanId":null,"planStartDate":null},"age":"","identity":"t","fcmToken":"t"},
"signUp":false}
''';

void main() {
  test("a login response with age \"\" parses (age unknown)", () {
    final model = SignUpModel.fromJson(jsonDecode(_loginResponse));
    expect(model.status, isTrue);
    expect(model.user?.id, "u1");
    expect(model.user?.age, isNull);
    expect(model.user?.loginType, 4);
  });

  test("numeric and numeric-string ages are kept", () {
    final json = jsonDecode(_loginResponse) as Map<String, dynamic>;
    (json["user"] as Map<String, dynamic>)["age"] = 27;
    expect(SignUpModel.fromJson(json).user?.age, 27);
    (json["user"] as Map<String, dynamic>)["age"] = "31";
    expect(SignUpModel.fromJson(json).user?.age, 31);
  });
}
