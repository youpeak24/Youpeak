import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';

class PreviewProfileImage extends StatelessWidget {
  const PreviewProfileImage({
    super.key,
    required this.id,
    required this.image,
    required this.size,
    required this.fit,
  });

  final String id;
  final String image;
  final double size;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      height: size,
      width: size,
      decoration: const BoxDecoration(shape: BoxShape.circle),
      child: CachedNetworkImage(
        imageUrl: image,
        fit: fit,
        // imageBuilder: (context, imageProvider) => Image(
        //   image: ResizeImage(imageProvider, width: 600, height: 500),
        //   fit: fit,
        // ),
        placeholder: (context, url) => Image.asset(AppIcons.profileImage, fit: fit),
        errorWidget: (context, url, error) => Image.asset(AppIcons.profileImage, fit: fit),
      ),
    );
  }
}

class PreviewVideoImage extends StatelessWidget {
  const PreviewVideoImage({super.key, required this.videoId, required this.videoImage, this.fit});

  final String videoId;
  final String videoImage;
  final BoxFit? fit;

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      height: Get.height,
      width: Get.width,
      fit: fit ?? BoxFit.cover,
      imageUrl: videoImage,
      useOldImageOnUrlChange: true,
      placeholder: (context, url) => const _VideoPlaceholder(),
      errorWidget: (context, string, dynamic) => const _VideoPlaceholder(),
    );
  }
}

class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder();

  @override
  Widget build(BuildContext context) => const FractionallySizedBox(
        widthFactor: 0.7,
        heightFactor: 0.7,
        child: Image(image: AssetImage(AppVisuals.videoPlaceholder), fit: BoxFit.contain),
      );
}

class PreviewNetworkImage extends StatelessWidget {
  const PreviewNetworkImage({super.key, required this.image, required this.id, required this.fit});

  final String id;
  final String image;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    return image == ""
        ? fit == BoxFit.contain
            ? Image.asset(AppIcons.profileImage, fit: BoxFit.cover)
            : const Offstage()
        : CachedNetworkImage(
            imageUrl: image,
            fit: fit,
            errorWidget: (context, url, error) => fit == BoxFit.contain ? Image.asset(AppIcons.profileImage, fit: BoxFit.cover) : const Offstage(),
          );
  }
}
