// Non-web builds never call this: they save into app storage.
Future<bool> saveInBrowser(String url, String fileName) async => false;
