import 'package:camera/camera.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:permission_handler/permission_handler.dart';

class GoLiveController extends GetxController {
  RxBool isPrivateLive = false.obs;

  CameraController? cameraController;
  CameraLensDirection cameraLensDirection = CameraLensDirection.front;

  @override
  void onInit() {
    AppSettings.showLog("Go To Live1 Controller Initialized");
    onRequestPermissions();
    super.onInit();
  }

  @override
  void onClose() {
    AppSettings.showLog("Go To Live1 Dispose Initialized");
    onDisposeCamera();
    super.onClose();
  }

  // Future<void> onRequestPermissions() async {
  //   final status = await [
  //     Permission.camera,
  //     Permission.microphone,
  //     Permission.storage,
  //   ].request();
  //
  //   if (status[Permission.camera]!.isGranted || status[Permission.microphone]!.isGranted || status[Permission.storage]!.isGranted) {
  //     onInitializeCamera();
  //   } else {
  //     AppSettings.showLog("Please Granted Permission !!");
  //     Get.back();
  //   }
  // }

  Future<void> onRequestPermissions() async {
    final status = await Permission.camera.request();
    if (status.isGranted) {
      onInitializeCamera();
    } else {
      AppSettings.showLog("Please grant camera permission");
    }
  }

  Future<void> onInitializeCamera() async {
    try {
      final cameras = await availableCameras();
      final camera = cameras.firstWhere((camera) => camera.lensDirection == cameraLensDirection, orElse: () => cameras.last);
      cameraController = CameraController(camera, ResolutionPreset.medium);
      await cameraController!.initialize();
      update(["onInitializeCamera"]);
    } catch (e) {
      AppSettings.showLog("Error initializing camera: $e");
    }
  }

  // Future<void> onInitializeCamera() async {
  //   cameraController = CameraController(
  //     const CameraDescription(
  //       name: "0",
  //       sensorOrientation: 90,
  //       lensDirection: CameraLensDirection.back,
  //     ),
  //     ResolutionPreset.max,
  //   );
  //   await cameraController!.initialize();
  //   update(["onInitializeCamera"]);
  // }

  Future<void> onSwitchCamera() async {
    cameraLensDirection = cameraLensDirection == CameraLensDirection.back ? CameraLensDirection.front : CameraLensDirection.back;

    final cameras = await availableCameras();

    final camera = cameras.firstWhere((camera) => camera.lensDirection == cameraLensDirection);
    cameraController = CameraController(camera, ResolutionPreset.high);
    await cameraController!.initialize();
    update(["onInitializeCamera"]);
  }

  Future<void> onDisposeCamera() async {
    try {
      cameraController?.dispose();
    } catch (e) {
      AppSettings.showLog("Camera Dispose Failed !! => $e");
    }
  }
}
