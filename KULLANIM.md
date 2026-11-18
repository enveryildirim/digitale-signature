# Kullanım Kılavuzu (Kısa)

Bu sistemle kurumdaki TV ekranlarına görsel, video, web sayfası ve duyuru yayınlarsınız. Bütün işler tarayıcıdan açılan **yönetim panelinden** yapılır.

> Kurulum için: sunucu → [DEPLOYMENT.md](DEPLOYMENT.md), TV / oynatıcı cihaz → [kiosk-setup/README.md](kiosk-setup/README.md), Android TV → [kiosk-setup/android-tv/README.md](kiosk-setup/android-tv/README.md).

---

## 1. Panele Giriş

- Adres: `http://<sunucu>:3001` (canlı ortamda alan adınız)
- Kullanıcı: `admin`
- Parola: `ADMIN_PASSWORD` ortam değişkeninde tanımlı parola. Geliştirme ortamında tanımlı değilse parola `admin123` olur.

Panelde dört sekme var: **Ekranlar**, **Medya**, **Playlistler**, **Zamanlama**.

---

## 2. Hızlı Başlangıç: İlk Yayın 4 Adımda

1. **TV'yi eşleştirin:** TV'de `/player` adresi açılınca ekranda 6 haneli bir kod görünür. Panelde **Ekranlar → Yeni TV eşleştir** ile bu kodu girin, TV'ye bir ad verin ve katını seçin.
2. **Medya yükleyin:** **Medya** sekmesinden görsel, video, web adresi (URL) ya da metin duyurusu ekleyin. Görsellerin ekranda kalma süresini (saniye) buradan ayarlayın.
3. **Playlist oluşturun:** **Playlistler** sekmesinde yeni bir liste açın, medyaları ekleyin ve oklarla sıralayın.
4. **Yayına alın:** **Ekranlar** sekmesinde playlist'i ya kat başlığındaki **Kat yayını** alanından o kattaki tüm TV'lere ya da TV satırından tek bir TV'ye seçin.

Değişiklikler TV'lere birkaç saniye içinde ulaşır, TV'ye dokunmanız gerekmez.

---

## 3. Sekmeler

### Ekranlar
- TV'ler katlara göre gruplanır. Kat eklemek, adını değiştirmek ve silmek kat başlığından yapılır.
- Her satırda TV'nin durumu (çevrimiçi/çevrimdışı), şu an oynattığı içerik ve atanmış playlist görünür.
- Bir TV'ye tıklayınca **detay penceresi** açılır. Burada canlı önizlemeyi görebilir, ad ve kat değiştirebilir, TV'yi yenileyebilir, eşleşmesini sıfırlayabilir veya silebilirsiniz.
- **Kalıcı TV bağlantısı:** Her TV'nin 8 haneli bir kodu vardır. TV'de `/tv/<kod>` adresi açılırsa TV eşleştirme yapmadan doğrudan kendi yayınını başlatır. Bu kod kumandayla kolayca yazılır.
- Üstteki bantlar eşleşme bekleyen ve çevrimdışı TV'leri gösterir.

### Medya
- **Görsel / Video:** Dosya yükleyin (en fazla 200 MB).
- **Web sayfası:** Kurum içi bir sayfanın adresini girin.
- **Metin duyurusu:** Yazdığınız metinden TV'ye uygun bir duyuru kartı oluşturulur.
- **Video sesi:** Videolar varsayılan olarak sessiz oynar. Sesi açmak için **Düzenle → Sesli oynat** anahtarını kullanın.

### Playlistler
TV'de döngü halinde oynatılacak sıralı içerik listeleridir. Bir medyayı birden çok playlist'te kullanabilirsiniz.

### Zamanlama
Belirli gün ve saatlerde farklı bir playlist oynatmak için kullanılır. Örnek: hafta içi 11:30–13:30 arası yemekhane TV'sinde menüyü göstermek.
- **Hedef:** bir kat ya da tek bir TV
- **Kural:** günler, başlangıç saati ve bitiş saati

**Hangi yayın kazanır?** Aynı anda birden fazla kural geçerliyse öncelik sırası şöyledir:
1. TV'ye özel zamanlanmış yayın
2. Kata özel zamanlanmış yayın
3. TV'ye atanmış varsayılan playlist
4. Kata atanmış varsayılan playlist

Hiçbir yayın tanımlı değilse TV'de "Yayın Bekleniyor" ekranı görünür.

---

## 4. Acil Durum Duyurusu

Üst menüdeki **Acil durum** düğmesi bütün TV'lerdeki yayını keser ve kırmızı bir acil durum ekranı gösterir. Duyuruyu kaldırmak için aynı düğmeyi kullanın. Duyuru kalkınca TV'ler normal yayına döner.

---

## 5. Bilmekte Fayda Var

- **İnternet/ağ kesilirse** TV'ler önbelleğe aldıkları içeriği oynatmaya devam eder. Bağlantı geri gelince güncellemeleri kendiliğinden alır.
- **Bozuk ya da açılamayan bir medya** varsa TV onu atlayıp sıradaki içeriğe geçer.
- TV'ler her gece 03:30'da kendini yeniler. Bu normaldir.
- Ekranlar sekmesindeki **Tümünü yenile** düğmesi bütün TV'lere yayını yeniden çekmeleri için sinyal gönderir.

## 6. Sık Karşılaşılan Sorunlar

| Sorun | Ne yapmalı? |
|---|---|
| TV çevrimdışı görünüyor | TV'nin ağ bağlantısını ve açık olup olmadığını kontrol edin. TV, önbellekteki son yayını oynatmaya devam eder. |
| TV'de eşleştirme kodu çıktı | TV'nin eşleşmesi silinmiş olabilir. Kodu panelden yeniden eşleştirin ya da TV'de `/tv/<8 haneli kod>` adresini açın. |
| Video sesi gelmiyor | Medyada **Sesli oynat** açık mı, TV'nin sesi açık mı kontrol edin. |
| Yaptığım değişiklik TV'de görünmüyor | Daha öncelikli bir zamanlama kuralı olabilir (bkz. Zamanlama). Gerekirse TV detayından **TV'de yayını yenile**'ye basın. |
| Admin parolasını unuttum | Sunucudaki `ADMIN_PASSWORD` değerini değiştirip uygulamayı yeniden başlatın ([DEPLOYMENT.md](DEPLOYMENT.md)). |
