import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

io.Socket? socket;

class SocketManagerController extends GetxController {
  io.Socket? getSocket() => socket;

  bool? isUserView;

  int userWatchCount = 0;

  List mainLiveChats = [];

  ScrollController scrollController = ScrollController();

  Future<void> socketConnect() async {
    try {
      socket = io.io(
        Constant.domain,
        io.OptionBuilder()
            .setTransports(['polling', 'websocket'])
            .disableAutoConnect()
            .setReconnectionAttempts(2)
            .setQuery({"liveRoom": "liveRoom:${Database.loginUserId}"})
            .build(),
      );

      socket!.connect();
      userWatchCount = 0;
      update();

      socket!.onConnect((data) {
        debugPrint("Socket Connected => ${socket?.id}");
      });

      socket!.once("connect", (data) {
        socket!.on("liveRoomConnect", (liveRoomConnectData) {
          AppSettings.showLog("Live1 User => $liveRoomConnectData");
        });

        socket!.on("endLiveUser", (data) {
          AppSettings.showLog("Live1 User Stop => $data");
          if (isUserView != null && (isUserView ?? false)) {
            isUserView = false;
            Get.back();
          }
        });

        socket!.on("addView", (addView) {
          debugPrint("Add View Listen => $addView");
          userWatchCount = addView;
          debugPrint("User Watch Count => $userWatchCount");

          update();
        });

        socket!.on("lessView", (lessView) {
          debugPrint("Less View Listen => $lessView");
          userWatchCount = lessView;
          debugPrint("User Watch Count => $userWatchCount");
          update();
        });

        socket!.on("liveChat", (data) async {
          debugPrint("Live1 Chat Listen => $data");

          mainLiveChats.add(jsonDecode(data));

          update(["onLiveChatListen"]);

          await 200.milliseconds.delay();

          scrollController.animateTo(
            scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );

          update(["onLiveChatListen"]);
        });
      });

      socket!.on("error", (error) {
        debugPrint("Socket Error => $error");
      });

      socket!.on("connect_error", (error) {
        debugPrint("Socket Connection Error => $error");
      });

      socket!.on("connect_timeout", (timeout) {
        debugPrint("Socket Connection Timeout => $timeout");
      });

      socket!.on("disconnect", (reason) {
        debugPrint("Socket Disconnected: $reason");
      });

      debugPrint("Socket Connected => ${socket?.connected}");
    } catch (e) {
      debugPrint("Socket Connection Error: $e");
    }
  }
}
