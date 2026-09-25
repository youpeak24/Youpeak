class CustomFormatTime {
  static String convert(int milliseconds) {
    int seconds = (milliseconds / 1000).floor();
    int hours = (seconds / 3600).floor();
    int minutes = ((seconds % 3600) / 60).floor();
    int remainingSeconds = (seconds % 60);

    if (hours > 0) {
      // Show hours if not zero
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    } else {
      // Skip hours if zero
      return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    }
  }

  static String convertSecond(num seconds) {
    num hours = (seconds / 3600).floor();
    num minutes = ((seconds % 3600) / 60).floor();
    num remainingSeconds = (seconds % 60);

    if (hours > 0) {
      // Show hours if not zero
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    } else {
      // Skip hours if zero
      return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    }
  }
}
