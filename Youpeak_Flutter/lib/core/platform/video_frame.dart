// Grabs a still frame from a picked video to use as its thumbnail.
// Android/iOS keep using the video_thumbnail plugin, which has no browser
// implementation; the web build draws the frame through an HTML <video>
// element and a canvas instead.
export 'video_frame_stub.dart' if (dart.library.js_interop) 'video_frame_web.dart';
