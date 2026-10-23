# TV Donanım ve Kiosk Kurulum Kılavuzu

Bu kılavuz, kurumdaki 10 TV'ye bağlı oynatıcı cihazların (Raspberry Pi 4/5, Intel NUC / Mini PC veya Linux kurulu mini kutular) otomatik tam ekran (Kiosk) modunda başlatılması için gereken adımları içerir.

---

## 1. Donanım ve İşletim Sistemi Önerisi

- **Önerilen Cihaz:** Raspberry Pi 4 (2GB/4GB) veya Intel Celeron/N100 Mini PC
- **İşletim Sistemi:** Raspberry Pi OS Lite / Desktop veya Ubuntu Server/Desktop LTS
- **Bağlantı:** HDMI kablo ile TV'ye bağlantı, yerel ağ kablosu (Ethernet) veya güçlü kurumsal Wi-Fi

---

## 2. Kurulum Adımları (Tek Seferlik)

### Adım 1: Scripti Cihaza Kopyalayın
```bash
sudo mkdir -p /opt/kiosk
sudo cp setup-chromium.sh /opt/kiosk/
sudo chmod +x /opt/kiosk/setup-chromium.sh
```

### Adım 2: Firebase Adresini Belirleyin
`setup-chromium.sh` dosyasını çalıştırırken Firebase Hosting adresini parametre olarak verin
(`digital-signage-kiosk.service` ve `autostart.desktop` bu adrese ayarlıdır):
```bash
/opt/kiosk/setup-chromium.sh https://my-first-firebase-projec-35cfc.web.app
```

### Adım 3: Otomatik Başlatma (Systemd Servisi)
Cihaz her elektrik aldığında veya açıldığında TV Player'ın otomatik devreye girmesi için:
```bash
sudo cp digital-signage-kiosk.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable digital-signage-kiosk.service
sudo systemctl start digital-signage-kiosk.service
```

---

## 3. Ekran ve Güç Ayarları (Kritik)

TV'nin kendi kendine kapanmasını veya kararmasını engellemek için TV'nin kendi menüsünden (Kumanda ile):
1. **Auto Power Off (Otomatik Kapanma):** KAPALI
2. **Eco / Enerji Tasarrufu Modu:** KAPALI
3. **HDMI-CEC / Auto Standby:** KAPALI veya Kiosk cihazına uyumlu hale getirin.

---

## 4. Sorun Giderme
- **TV beyaz ekranda veya hata sayfasında kaldıysa:** TV'nin Ethernet kablosunu veya sunucu IP adresine erişimini kontrol edin.
- **TV eşleştirme kodunu sıfırlamak için:** Tarayıcı konsolunda veya cihazda `localStorage.clear()` çalıştırıp sayfayı yenileyin.
- **Video ses çalmıyorsa:** TV yayınları koridorlarda gürültü yapmaması için varsayılan olarak sessiz (`muted`) başlar. Kiosk komutundaki `--autoplay-policy=no-user-gesture-required` bayrağı videoların otomatik akmasını sağlar.

