#!/usr/bin/env bash
# Kurum İçi Dijital Bilgi Ekranı - TV Kiosk Başlatma Scripti
# Kullanım: ./setup-chromium.sh [FIREBASE_ADRESI]
# Örnek:    ./setup-chromium.sh https://proje-id.web.app

SERVER_URL=${1:-"https://my-first-firebase-projec-35cfc.web.app"}
PLAYER_URL="${SERVER_URL%/}/player/"

echo "=================================================="
echo " TV Kiosk Oynatıcı Başlatılıyor..."
echo " Hedef URL: ${PLAYER_URL}"
echo "=================================================="

# 1. Ekran koruyucuyu ve güç yönetimi uyku modunu kapat
xset s off 2>/dev/null
xset -dpms 2>/dev/null
xset s noblank 2>/dev/null

# 2. Fare imlecini gizlemek için unclutter başlat (varsa)
if command -v unclutter >/dev/null 2>&1; then
  unclutter -idle 0.1 -root &
fi

# 3. Beklenmedik kapanmalarda Chromium'un 'Geri yükle' uyarısı vermesini engelle
CHROMIUM_PREFS="$HOME/.config/chromium/Default/Preferences"
if [ -f "$CHROMIUM_PREFS" ]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_PREFS" 2>/dev/null
  sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_PREFS" 2>/dev/null
fi

# 4. Chromium'u Tam Kiosk Modunda Başlat
exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --disk-cache-dir=/tmp/chromium-cache \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  "${PLAYER_URL}"

