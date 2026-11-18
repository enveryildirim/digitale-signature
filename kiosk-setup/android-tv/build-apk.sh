#!/usr/bin/env bash
# TV Yayın (Android TV kiosk) uygulamasını Docker içinde derler.
# Kullanım: ./build-apk.sh [SUNUCU_ADRESI]
#   ./build-apk.sh https://tv.sizindomain.com
# Sunucu adresi verilirse TV'de ilk açılışta hazır gelir. Çıktı: dist/tv-yayin.apk
set -euo pipefail
cd "$(dirname "$0")"

SERVER_URL=${1:-""}
IMAGE=tv-yayin-builder

# Android derleme araçları yalnızca x86_64 olduğundan Apple Silicon'da da amd64 imaj kullanılır
docker build --platform linux/amd64 -t "$IMAGE" - < builder.Dockerfile

docker run --rm --platform linux/amd64 \
  -v "$PWD":/project -v tv-yayin-gradle:/root/.gradle -w /project \
  -e SERVER_URL="$SERVER_URL" "$IMAGE" sh -c '
    set -e
    if [ ! -f keystore/release.jks ]; then
      mkdir -p keystore
      keytool -genkeypair -keystore keystore/release.jks -alias tvyayin -keyalg RSA -keysize 2048 \
        -validity 36500 -storepass tvyayin -keypass tvyayin -dname "CN=TV Yayin" 2> /dev/null
      echo ">> Yeni imza anahtari olusturuldu: keystore/release.jks (YEDEKLEYIN)"
    fi
    gradle --no-daemon --quiet assembleRelease -PserverUrl="$SERVER_URL"
    mkdir -p dist
    cp build/outputs/apk/release/tv-yayin-release.apk dist/tv-yayin.apk'

echo "APK hazır: $(pwd)/dist/tv-yayin.apk"
