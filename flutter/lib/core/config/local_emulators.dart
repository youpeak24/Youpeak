// Development-only switches for running the app against the local Firebase
// emulators (tools/local-dev/start.js):
//
//   --dart-define=AUTH_EMULATOR=127.0.0.1:9095
//   --dart-define=FIRESTORE_EMULATOR=127.0.0.1:8095
//
// Production builds never set these. As a second safeguard a switch is only
// honoured when it names a loopback host AND the build's API is local too,
// so a build that talks to the real API can never be pointed at an emulator
// (or anything else) by a stray define.

class EmulatorAddress {
  const EmulatorAddress(this.host, this.port);

  final String host;
  final int port;
}

const _loopbackHosts = {"localhost", "127.0.0.1", "::1", "[::1]", "10.0.2.2"};

bool isLoopbackHost(String host) => _loopbackHosts.contains(host.toLowerCase());

// The emulator address in [define] ("host:port"), or null when the switch is
// unset, malformed, not loopback, or [apiBaseUrl] is not a local API.
EmulatorAddress? localEmulator(String define, {required String apiBaseUrl}) {
  if (define.isEmpty) return null;
  final api = Uri.tryParse(apiBaseUrl);
  if (api == null || !isLoopbackHost(api.host)) return null;
  final split = define.lastIndexOf(":");
  if (split <= 0) return null;
  final host = define.substring(0, split);
  final port = int.tryParse(define.substring(split + 1));
  if (port == null || port <= 0 || port > 65535 || !isLoopbackHost(host)) return null;
  return EmulatorAddress(host, port);
}
