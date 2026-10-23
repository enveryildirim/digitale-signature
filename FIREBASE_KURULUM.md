# Firebase Kurulum Rehberi (`firebase` dalı)

Proje: **`my-first-firebase-projec-35cfc`** (`.firebaserc` içinde tanımlı).

Bu dal sunucu gerektirmez: admin paneli ve TV oynatıcısı **Firebase Hosting**'den yayınlanır, veriler **Realtime Database**'te, medya dosyaları **Cloud Storage**'da tutulur. Mimari ayrıntıları `PROJECT_MEMORY.md` Bölüm 0'dadır.

## 1. Firebase konsolunda tek seferlik hazırlık

1. **Blaze planı:** Proje > ⚙️ > *Usage and billing* > *Modify plan* > **Blaze**. Cloud Storage için zorunlu; 10 TV'lik kullanım ücretsiz kotalar içinde kalır.
   - Güvence için Google Cloud Console > *Billing* > *Budgets & alerts* altında **1 USD** bütçe uyarısı oluşturun.
2. **Web uygulaması:** Proje ayarları > *Genel* > *Uygulamalarınız* > **Web (`</>`)** ile bir uygulama kaydedin. Hosting'in sunduğu `/__/firebase/init.json` bu kayda göre oluşur. "Firebase Hosting'i de ayarla" kutusunu işaretlemenize gerek yok.
3. **Realtime Database:** *Build* > *Realtime Database* > **Create database** > konum **europe-west1 (Belçika)** > **Locked mode**. Kurallar deploy sırasında yüklenir.
4. **Storage:** *Build* > *Storage* > **Get started**.
   - Ücretsiz Storage kotası yalnızca `us-central1`, `us-east1` ve `us-west1` bölgelerinde geçerli. Maliyet önceliğiniz varsa bunlardan birini seçin. TV'ler medyayı bir kez indirip önbelleğe aldığı için bölge uzaklığı yayını etkilemez.
5. **Authentication:** *Build* > *Authentication* > *Sign-in method* > **Email/Password** > Etkinleştir.
   - *Users* > **Add user** ile yönetici hesabını (e-posta + güçlü parola) oluşturun ve **User UID**'yi kopyalayın.
   - *Settings* > *User actions* > **"Enable create (sign-up)" kutusunun işaretini kaldırın.** Bu adım güvenlik açısından zorunlu (bkz. `storage.rules`).
6. **Yönetici yetkisi:** *Realtime Database* > *Data* sekmesinde kök düğüme `admins` > `<User UID>` = `true` ekleyin:
   ```json
   { "admins": { "AbC123...uid": true } }
   ```
   Her yeni yönetici için 5. ve 6. adımları tekrarlayın.

## 2. Bilgisayardan deploy

```bash
git checkout firebase
npm --prefix client install
npx firebase-tools login                 # tarayıcıda Google hesabıyla giriş
npm run test:scheduler && npm run test:api && npm run test:load
npm run deploy                           # build + hosting + database/storage kuralları
```

Deploy bitince:
- **Admin paneli:** `https://my-first-firebase-projec-35cfc.web.app` (1. bölümde oluşturduğunuz e-posta ile giriş yapın)
- **TV oynatıcısı:** `https://my-first-firebase-projec-35cfc.web.app/player/`

Yalnızca kuralları güncellemek için `npm run deploy:rules` yeterli.

## 3. TV'leri bağlama

1. TV'de (Chromium kiosk) `https://my-first-firebase-projec-35cfc.web.app/player/` adresini açın. Ekranda 6 haneli kod görünür.
2. Admin paneli > **Ekranlar** > **Yeni TV Eşleştir** ile kodu girin. TV birkaç saniye içinde yayına başlar.
3. Kiosk otomatik başlatma dosyaları (`kiosk-setup/`) bu adrese ayarlıdır (bkz. `kiosk-setup/README.md`).

TV'lerde saat otomatik (NTP) olmalı. Zamanlanmış yayınlar TV'nin kendi saatine göre devreye girer.

## 4. Yerel geliştirme

```bash
cp client/.env.example client/.env       # değerleri Proje ayarları > Web uygulaması > SDK yapılandırmasından doldurun
npm run dev                              # http://localhost:3000 (admin), http://localhost:3000/player/ (TV)
```

Yerel geliştirme de canlı Firebase projesine bağlanır. Deneme için ayrı bir Firebase projesi kullanmanız önerilir.

## 5. Mevcut LAN sürümünden geçiş

SQLite'taki (`server/data/signage.db`) ekranlar, playlist'ler ve medya **otomatik taşınmaz**. Firebase sürümüne geçerken medyayı panelden yeniden yükleyin ve TV'leri yeniden eşleştirin.
