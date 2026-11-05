class CustomFormatNumber {
  static String convert(num number) {
    if (number >= 1000000) {
      double value = number / 1000000;
      return _formatValue(value, 'm');
    } else if (number >= 1000) {
      double value = number / 1000;
      return _formatValue(value, 'k');
    } else {
      return number.toString();
    }
  }

  static String _formatValue(double value, String suffix) {
    // Remove .00 if it's an integer
    if (value % 1 == 0) {
      return '${value.toInt()}$suffix';
    } else {
      return '${value.toStringAsFixed(2)}$suffix';
    }
  }
}
