#!/usr/bin/env bash
# TV Yayın uygulamasını bir Android TV'ye ağ üzerinden (ADB) kurar ve TV'yi yayına kilitler.
# Kullanım: ./install-tv.sh <TV_IP> [8_HANELI_TV_KODU]
#   ./install-tv.sh 192.168.1.61 48213907
# Önce TV'de Geliştirici seçenekleri → USB hata ayıklama açılmalıdır (README.md).
# Aynı komut güncelleme için de kullanılır; ayarlar ve eşleşme korunur.
set -euo pipefail
cd "$(dirname "$0")"

TV_IP=${1:?"Kullanım: ./install-tv.sh <TV_IP> [8 haneli TV kodu]"}
CODE=${2:-""}
[ -f dist/tv-yayin.apk ] || { echo "Önce ./build-apk.sh ile APK derleyin."; exit 1; }

STEPS='
set -e
T="$TV_IP:5555"
P=com.tvbroadcast.kiosk
adb connect "$T" | tee /dev/stderr | grep -q -E "connected to|authenticate" \
  || { echo ">> TV ile baglanti kurulamadi: IP adresini ve USB hata ayiklamanin acik oldugunu kontrol edin."; exit 1; }
echo ">> TV ekraninda hata ayiklama izni sorulursa \"Her zaman izin ver\" secip onaylayin..."
adb -s "$T" wait-for-device
adb -s "$T" install -r "$APK"
# Asagidaki adimlari desteklemeyen TV kurulumu yarida kesmesin (|| true)
# Acilista ve baska uygulamadan yayina donerken arka plandan baslatma izni
adb -s "$T" shell appops set $P SYSTEM_ALERT_WINDOW allow || true
# Ekran kapanma ve enerji tasarrufu zaman asimlarini kapat
adb -s "$T" shell settings put system screen_off_timeout 2147483647 || true
adb -s "$T" shell settings put secure sleep_timeout -1 || true
adb -s "$T" shell settings put secure attentive_timeout -1 || true
# Yayini ana ekran yap: TV acilisi ve Home tusu yayina gelsin
adb -s "$T" shell cmd package set-home-activity $P/.MainActivity || true
# Google TV kurulum sihirbazi (setupwraith) launcher kapaninca ana ekrani devralmasin diye o da kapatilir
for L in com.google.android.tvlauncher com.google.android.apps.tv.launcherx com.google.android.tungsten.setupwraith com.google.android.leanbacklauncher; do
  if adb -s "$T" shell pm path $L > /dev/null 2>&1; then
    adb -s "$T" shell pm disable-user --user 0 $L > /dev/null && echo ">> Fabrika ana ekrani kapatildi: $L"
  fi
done
adb -s "$T" shell am start -n $P/.MainActivity ${CODE:+--es code $CODE} > /dev/null
echo ">> Kurulum tamam: $T"
'

if command -v adb > /dev/null 2>&1; then
  TV_IP="$TV_IP" CODE="$CODE" APK=dist/tv-yayin.apk sh -c "$STEPS"
else
  # Bilgisayarda adb yoksa derleme imajındaki adb kullanılır; TV'nin verdiği izin volume'da saklanır
  docker run --rm --platform linux/amd64 -v "$PWD/dist":/dist:ro -v tv-yayin-adb:/root/.android \
    -e TV_IP="$TV_IP" -e CODE="$CODE" -e APK=/dist/tv-yayin.apk tv-yayin-builder sh -c "$STEPS"
fi
