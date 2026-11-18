# Android TV Kiosk Uygulaması (TV Yayın)

Android TV'lerde tarayıcının yerine kurulan küçük bir uygulama. Oynatıcıyı (`/player`) tam ekran açar ve TV'yi bu ekrana kilitler:

- TV açılınca doğrudan yayın gelir (uygulama TV'nin ana ekranı olur).
- Home tuşu yayına döner. Geri tuşu yayından çıkarmaz. Oynat/duraklat tuşları yayını durdurmaz.
- Kumandadaki YouTube/Netflix gibi tuşlarla başka uygulamaya geçilirse 3 dakika sonra yayına geri döner.
- Ekran kararmaz. Videolar otomatik oynar; ses, medya ayarındaki "Sesli oynat"a göre açılır.
- Sunucuya ulaşılamazsa ekrana nedenini yazar ve 15 saniyede bir yeniden dener. Oynatıcı bir kez açıldıktan sonra internet kesilse de Service Worker önbelleğinden yayına devam eder (HTTPS gerekir).
- Sayfa motoru çökerse ekranı kendiliğinden yeniden kurar.

## 1. APK'yı derleyin (bilgisayarda, bir kez)

Yalnızca Docker gerekir; Android Studio gerekmez.

```bash
cd kiosk-setup/android-tv
./build-apk.sh https://tv.sizindomain.com
```

- Çıktı `dist/tv-yayin.apk` dosyasıdır. Verdiğiniz adres TV'de ilk açılışta hazır gelir.
- İlk derleme `keystore/release.jks` imza anahtarını üretir. **Bu dosyayı yedekleyin.** TV'deki uygulama yalnızca aynı anahtarla imzalanmış bir APK ile güncellenebilir. Anahtar repoya eklenmez.
- İsterseniz klasörü Android Studio'da proje olarak da açabilirsiniz.

## 2. TV'yi hazırlayın (her TV'de bir kez, kumandayla)

1. **Ayarlar → Cihaz Tercihleri → Hakkında → Yapı** satırına 7 kez basın. Google TV'de yol: **Ayarlar → Sistem → Hakkında → Android TV OS yapısı**.
2. **Geliştirici seçenekleri → USB hata ayıklama** seçeneğini açın. Menüde "Ağ üzerinden hata ayıklama" varsa onu da açın.
3. TV'nin IP adresini not edin (**Ayarlar → Ağ ve İnternet →** bağlı olan ağ).
4. TV'nin kendi menüsünden otomatik kapanmayı ve enerji tasarrufunu kapatın ([kiosk kılavuzu §3](../README.md#3-ekran-ve-güç-ayarları-kritik)).

## 3. Kurun (bilgisayardan, TV ile aynı ağda)

```bash
./install-tv.sh 192.168.1.61            # TV'de eşleştirme kodu çıkar, yönetim panelinden eşleştirin
./install-tv.sh 192.168.1.61 48213907   # ya da ekran detayındaki 8 haneli TV koduyla doğrudan bağlayın
```

İlk bağlantıda TV ekranında hata ayıklama izni sorulur. **Her zaman izin ver** kutusunu işaretleyip onaylayın.

Script şunları yapar:

- APK'yı kurar.
- Uygulamayı ana ekran yapar ve fabrika ana ekranını (Android TV / Google TV launcher) devre dışı bırakır.
- Ekran kapanma zaman aşımlarını kapatır.
- Açılışta başlama iznini verir ve yayını açar.

Bilgisayarda `adb` yoksa derleme imajındaki `adb` kullanılır.

**Güncelleme:** Yeni APK'yı derleyip aynı komutu çalıştırın. Ayarlar ve eşleşme korunur.

## 4. Kullanım

- **Ayarlar ekranı:** Yayın sırasında **Geri tuşuna art arda 5 kez** basın. Bu ekranda sunucu adresi ve TV kodu değiştirilir, **Android Ayarları** (Wi-Fi vb.) açılır ve cihazın IP adresi görülür.
- **TV kodu** alanı boş bırakılırsa mevcut eşleşme korunur. Yeni bir kod girilirse TV o ekrana bağlanır.
- Ayarlar ekranı açık unutulursa 3 dakika sonra yayına dönülür. Android Ayarları açıldıysa 15 dakika beklenir.

## 5. ADB olmadan kurulum (kısıtlı)

APK'yı USB belleğe kopyalayıp TV'de bir dosya yöneticisiyle açarak da kurabilirsiniz. Bunun için bilinmeyen kaynaklardan kurulum izni gerekir.

Bu yolla uygulama yine tam ekran çalışır ve Geri tuşunu kilitler. Ancak fabrika ana ekranı kapatılamadığı için Home tuşu yayından çıkar; yayına dönüş 3 dakika sonra olur.

TV açılışında başlaması için, menüde varsa **Ayarlar → Uygulamalar → Özel uygulama erişimi → Diğer uygulamaların üzerinde göster** iznini TV Yayın'a verin.

## 6. Geri alma ve sorun giderme

- **Fabrika ana ekranına dönmek** için önce launcher'ı açın, sonra uygulamayı kaldırın:
  ```bash
  adb connect <TV_IP>:5555
  adb shell pm enable com.google.android.tvlauncher         # Android TV
  adb shell pm enable com.google.android.apps.tv.launcherx  # Google TV
  adb shell pm enable com.google.android.tungsten.setupwraith  # Google TV
  adb uninstall com.tvbroadcast.kiosk
  ```
- **Home tuşu hâlâ fabrika ana ekranını açıyorsa**, TV farklı bir launcher kullanıyordur. Paketini bulup devre dışı bırakın:
  ```bash
  adb shell cmd package query-activities -a android.intent.action.MAIN -c android.intent.category.HOME
  adb shell pm disable-user --user 0 <paket.adi>
  ```
- **"Yayın sunucusuna ulaşılamıyor" yazıyorsa**, ekrandaki adresi ve hata nedenini kontrol edin. Ağ geri gelince yayın kendiliğinden başlar.
- **"Sertifika hatası" çıkıyorsa**, TV'nin tarih ve saatini kontrol edin. Android 7.0 ve daha eski TV'ler Let's Encrypt sertifikalarını tanımayabilir.
- **Sayfayı uzaktan incelemek için** bilgisayarda `adb` kurulu olmalıdır (`brew install android-platform-tools`). `adb connect <TV_IP>:5555` ile bağlandıktan sonra Chrome'da `chrome://inspect` açın; TV Yayın sayfası listelenir.
- **TV birkaç saat sonra kendiliğinden kapanıyorsa**, sebep TV menüsündeki "Otomatik kapanma / Eco" ayarıdır. Bu ayar uygulamadan bağımsızdır ve menüden kapatılmalıdır.
