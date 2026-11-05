import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class VideoDetailsShimmerUi extends StatelessWidget {
  const VideoDetailsShimmerUi({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
      child: Padding(
        padding: const EdgeInsets.only(top: 10),
        child: SizedBox(
          width: MediaQuery.of(context).size.width,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        for (int i = 0; i < 2; i++)
                          Container(
                            height: 15,
                            margin: const EdgeInsets.only(left: 10, bottom: 5),
                            decoration: BoxDecoration(color: Colors.blueGrey, borderRadius: BorderRadius.circular(20)),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    height: 40,
                    width: 40,
                    margin: const EdgeInsets.only(left: 5, right: 10),
                    decoration: const BoxDecoration(color: Colors.blueGrey, shape: BoxShape.circle),
                  ),
                ],
              ),
              Container(
                height: 10,
                width: 130,
                margin: const EdgeInsets.only(top: 5, left: 10, bottom: 10),
                decoration: BoxDecoration(color: Colors.blueGrey, borderRadius: BorderRadius.circular(20)),
              ),
              Row(
                children: [
                  for (int i = 0; i < 6; i++)
                    Container(
                      height: 40,
                      width: 40,
                      margin: const EdgeInsets.only(left: 10),
                      decoration: const BoxDecoration(color: Colors.blueGrey, shape: BoxShape.circle),
                    ),
                ],
              ),
              const Divider(color: Colors.blueGrey),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    margin: const EdgeInsets.only(left: 10),
                    decoration: const BoxDecoration(color: Colors.blueGrey, shape: BoxShape.circle),
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        for (int i = 0; i < 2; i++)
                          Container(
                            height: 15,
                            margin: const EdgeInsets.only(top: 5, left: 10, right: 10),
                            decoration: BoxDecoration(color: Colors.blueGrey, borderRadius: BorderRadius.circular(20)),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(color: Colors.blueGrey),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  for (int i = 0; i < 2; i++)
                    Container(
                      height: 15,
                      width: 100,
                      margin: const EdgeInsets.only(left: 10),
                      decoration: BoxDecoration(color: Colors.blueGrey, borderRadius: BorderRadius.circular(20)),
                    ),
                  const Spacer(),
                  Container(
                    height: 30,
                    width: 30,
                    margin: const EdgeInsets.only(right: 20),
                    decoration: const BoxDecoration(color: Colors.blueGrey, shape: BoxShape.circle),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    margin: const EdgeInsets.only(left: 10),
                    decoration: const BoxDecoration(color: Colors.blueGrey, shape: BoxShape.circle),
                  ),
                  Expanded(
                    child: Container(
                      height: 25,
                      margin: const EdgeInsets.only(left: 10, right: 10),
                      decoration: const BoxDecoration(color: Colors.blueGrey),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
