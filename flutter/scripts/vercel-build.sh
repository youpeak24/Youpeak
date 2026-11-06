#!/usr/bin/env bash
# Vercel build for the consumer web app (Root Directory: flutter).
#
# Vercel's build image has no Flutter SDK, so this script installs the pinned
# version, compiles the release web bundle, and leaves the output in build/web.
#
# Required environment variable (set in the Vercel project):
#   YOUPEAK_API_SECRET_KEY   the backend client key (same value as the API's secretKey)
# Optional:
#   YOUPEAK_API_BASE_URL     https origin of the API, with a trailing slash
#                            (default: https://youpeak-api.vercel.app/)
set -euo pipefail
cd "$(dirname "$0")/.."

# Same SDK the app is compiled and tested with locally. Bump it deliberately,
# after checking the build locally.
FLUTTER_VERSION="3.44.4"

: "${YOUPEAK_API_SECRET_KEY:?Set YOUPEAK_API_SECRET_KEY in the Vercel project environment variables}"
API_BASE_URL="${YOUPEAK_API_BASE_URL:-https://youpeak-api.vercel.app/}"
case "$API_BASE_URL" in
  https://*/) ;;
  *) echo "YOUPEAK_API_BASE_URL must be an https origin ending with /" >&2; exit 1 ;;
esac

if [ -z "${FLUTTER_SKIP_CLONE:-}" ]; then
  if [ ! -x "$HOME/flutter/bin/flutter" ]; then
    git clone --depth 1 --branch "$FLUTTER_VERSION" https://github.com/flutter/flutter.git "$HOME/flutter"
  fi
  export PATH="$HOME/flutter/bin:$PATH"
fi

flutter --version
flutter config --enable-web
flutter pub get --enforce-lockfile

# Build defines are written to a temp file and passed by path, so the key never
# appears on the command line or in the build log.
DEFINES="$(mktemp)"
trap 'rm -f "$DEFINES"' EXIT
BUILD_ID="web-$(date -u +%Y%m%d-%H%M%S)" API_BASE_URL="$API_BASE_URL" node -e '
  const fs = require("fs");
  fs.writeFileSync(process.argv[1], JSON.stringify({
    BUILD_PROFILE: "production",
    BUILD_ID: process.env.BUILD_ID,
    API_BASE_URL: process.env.API_BASE_URL,
    APP_DOMAIN: "youpeak.app",
    API_SECRET_KEY: process.env.YOUPEAK_API_SECRET_KEY,
    USE_LOCAL_DEV: "false",
    FIRESTORE_EMULATOR: "",
    AUTH_EMULATOR: ""
  }));
' "$DEFINES"

flutter build web --release --no-wasm-dry-run "--dart-define-from-file=$DEFINES"
test -f build/web/index.html && test -f build/web/main.dart.js
echo "Consumer web build ready: build/web"
