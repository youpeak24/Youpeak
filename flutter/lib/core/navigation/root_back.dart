import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/shared/dialogs/app_exit_dialog.dart';

/// Decides what the system/browser Back action does on a page that can be the
/// root of the app (sign-in, sign-up, the main tabs). Use it as the
/// `onWillPop` of a [WillPopScope]; the return value says whether the route
/// itself may be popped.
///
/// * Not the root route (e.g. Sign up opened from Sign in): a normal pop, so
///   Back returns to the page the user came from.
/// * Main tabs showing a tab other than Home: Back returns to Home first.
/// * Browser: there is nothing to "exit" and a page cannot close its own tab,
///   so Back is handed to the browser. The framework then asks the browser to
///   step back in its history, which returns to the page before the app when
///   there is one (and does nothing when there is not). The old exit dialog
///   had no effect in a browser and trapped the user on this page.
/// * Android/iOS: the existing "exit the app?" confirmation.
Future<bool> handleRootBack(BuildContext context) async {
  if (Navigator.of(context).canPop()) return true;
  if (AppSettings.navigationIndex.value != 0) {
    AppSettings.navigationIndex.value = 0;
    return false;
  }
  if (PlatformInfo.isWeb) return true;
  final shouldExit = await Get.dialog<bool>(const AppExitDialog());
  if (shouldExit == true) {
    if (PlatformInfo.isAndroid) {
      SystemNavigator.pop();
    } else if (PlatformInfo.isIOS) {
      exit(0);
    }
  }
  return false;
}

/// Moves between the Sign in and Sign up pages. When one of them sits on top
/// of the other pages (opened from "Let's you in") it replaces itself, so the
/// stack never grows into a Sign in ⇄ Sign up loop and Back always returns to
/// the page before them. When the current page is the root (e.g. Sign in after
/// a password reset) the other page is pushed on top, so Back returns to it.
void switchAuthPage(Widget Function() page) {
  if (Get.key.currentState?.canPop() ?? false) {
    Get.off(page);
  } else {
    Get.to(page);
  }
}
