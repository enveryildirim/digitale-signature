# PRD: Kurum İçi Dijital Bilgi Ekranı (Digital Signage)

| | |
|---|---|
| **Doküman sürümü** | 1.0 (Taslak) |
| **Tarih** | 21 Ekim 2026 |
| **Kapsam** | Kurum içi kullanım, ürün/SaaS değil |
| **Yaklaşım** | Pareto (80/20): Etkinin %80'ini sağlayan %20'lik özellikler |

---

## 1. Özet

Kurumda farklı katlara yerleştirilmiş **10 adet büyük TV** üzerinde, **her kata (veya her TV'ye) farklı içerik** yayınlayabilmek için web tabanlı, merkezden yönetilen bir uygulama geliştirilecektir. TV'lerde özel bir yazılım kurulmayacak; **tarayıcı (kiosk modunda) üzerinden bir URL açılacak** ve yayın o sayfada oynayacaktır.

### 1.1 Problem
- TV'ler şu anda tek tek, manuel (USB, HDMI, kumanda) yönetiliyor veya aktif kullanılmıyor.
- Katlara özel duyuru/içerik yayınlamak zaman alıyor ve tutarsız.

### 1.2 Hedef
Bir yönetici, tek bir panelden içerik yükleyip bunu istediği TV'lere/katlara atayabilsin; TV'ler kendi kendine açılıp yayını kesintisiz oynatsın.

### 1.3 Başarı Kriterleri
| Kriter | Hedef |
|---|---|
| Yeni içeriğin TV'de görünme süresi | ≤ 60 saniye (yayınla → ekranda) |
| Yeni TV ekleme süresi | ≤ 5 dakika (kod ile eşleştirme) |
| Player kesintisiz çalışma | Ağ kesilse bile son yayın oynamaya devam eder |
| Yönetici öğrenme eğrisi | Eğitimsiz, ilk içeriği 10 dakika içinde yayınlayabilir |
| TV başına müdahale | Kurulumdan sonra manuel müdahale gerekmez |

---

## 2. Pareto Analizi: Neyi Yapıyoruz, Neyi Yapmıyoruz?

Digital signage ürünlerinin yüzlerce özelliği var. Hedefimiz **"TV'leri kullanabilmek ve yayın yapabilmek"** olduğuna göre:

### 2.1 Yapıyoruz (Çekirdek %20, değerin %80'i)
1. TV (ekran) kaydı ve **kod ile eşleştirme**
2. Ekranları **kat/grup** bazında organize etme
3. **Medya yükleme:** görsel, video, web sayfası/URL
4. **Playlist (oynatma listesi):** sıra + her öğe için süre
5. Playlist'i ekrana/gruba **atama**
6. **Basit zamanlama:** gün/saat aralığı (ör. mesai saatleri, öğle menüsü)
7. **Player:** tam ekran, döngüde oynatma, **offline cache**, otomatik yeniden bağlanma
8. **Ekran durumu:** çevrimiçi/çevrimdışı (heartbeat), son görülme
9. Basit **kullanıcı girişi** (admin/editör)

### 2.2 Şimdilik Yapmıyoruz (Kalan %80 efor, değerin %20'si)
Çoklu kiracı (multi-tenant), faturalama, sürükle-bırak şablon/layout tasarımcısı, çok bölgeli (zone) ekran, analitik/raporlama (proof-of-play), uzaktan TV kumanda (güç aç/kapat), onay/iş akışı, mobil uygulama, interaktif/dokunmatik içerik, SSO entegrasyonları, çoklu dil panel, cihaz donanım yönetimi.

> **Not:** Bunlar "asla" değil, "ihtiyaç doğarsa Faz 2+" demektir (Bkz. Bölüm 9).

---

## 3. Kullanıcılar ve Roller

| Rol | Açıklama | Yetkiler |
|---|---|---|
| **Admin** | BT / proje sahibi | Her şey: kullanıcı, ekran, grup, içerik, ayarlar |
| **Editör** | İçerik sorumlusu (İK, İletişim vb.) | Medya yükleme, playlist oluşturma, atama |
| **Player (cihaz)** | TV'deki tarayıcı | Sadece kendi yayınını okuma, durum bildirme |

Başlangıçta 1–3 kişilik bir yönetici ekibi varsayılır. İzleyiciler (çalışanlar/ziyaretçiler) sistemle etkileşime girmez.

---

## 4. Kullanıcı Hikâyeleri (MVP)

**Ekran yönetimi**
- Admin olarak yeni bir TV ekleyebilmeliyim; TV'de ekranda çıkan 6 haneli kodu panele girerek eşleştirebilmeliyim.
- Admin olarak ekranlara isim (ör. "3. Kat Asansör Holü") ve kat/grup atayabilmeliyim.
- Admin olarak hangi TV'nin çevrimiçi olduğunu tek bakışta görebilmeliyim.

**İçerik**
- Editör olarak görsel ve video yükleyebilmeliyim.
- Editör olarak bir web sayfası/URL'yi (ör. kurum panosu, yemek menüsü) içerik olarak ekleyebilmeliyim.
- Editör olarak içerikleri sıralayıp her biri için gösterim süresi belirleyerek playlist oluşturabilmeliyim.

**Yayın**
- Editör olarak bir playlist'i bir TV'ye veya bir kattaki tüm TV'lere atayabilmeliyim.
- Editör olarak bir playlist'in hangi gün ve saatlerde yayınlanacağını belirleyebilmeliyim.
- Editör olarak "yayınla" dediğimde değişikliğin TV'ye 1 dakika içinde yansımasını istiyorum.

**Player**
- TV olarak açıldığımda tam ekran, imleçsiz, kullanıcı müdahalesi olmadan yayına başlamalıyım.
- İnternet/ağ koptuğunda son yayını oynatmaya devam etmeliyim.
- Atanmış yayın yoksa kurum logosu/varsayılan ekran göstermeliyim.

---

## 5. Fonksiyonel Gereksinimler

Öncelik: **P0** = MVP'de zorunlu, **P1** = MVP sonrası ilk iterasyon, **P2** = ihtiyaç olursa.

### 5.1 Kimlik Doğrulama ve Yetki
| ID | Gereksinim | Öncelik |
|---|---|---|
| AUTH-1 | E-posta + parola ile giriş, oturum yönetimi | P0 |
| AUTH-2 | Admin / Editör rolleri | P0 |
| AUTH-3 | Kurumsal dizin (AD/LDAP/SSO) entegrasyonu | P2 |

### 5.2 Ekran (TV) Yönetimi
| ID | Gereksinim | Öncelik |
|---|---|---|
| SCR-1 | Player ilk açılışta benzersiz cihaz kimliği üretir ve 6 haneli eşleştirme kodu gösterir | P0 |
| SCR-2 | Admin kodu girerek ekranı onaylar, ekrana ad ve grup verir | P0 |
| SCR-3 | Ekran listesi: ad, grup, durum (online/offline), son görülme, atanmış playlist | P0 |
| SCR-4 | Ekran grupları (kat) oluşturma/düzenleme | P0 |
| SCR-5 | Ekranı silme / eşleştirmeyi sıfırlama | P0 |
| SCR-6 | Ekran önizleme (canlı görüntü/ekran görüntüsü) | P1 |
| SCR-7 | Ekran çözünürlüğü/yönü (yatay/dikey) ayarı | P1 |

### 5.3 Medya Kütüphanesi
| ID | Gereksinim | Öncelik |
|---|---|---|
| MED-1 | Görsel yükleme (JPG, PNG, WebP) | P0 |
| MED-2 | Video yükleme (MP4/H.264) | P0 |
| MED-3 | Web sayfası/URL içeriği ekleme (iframe ile) | P0 |
| MED-4 | Medya listesi, silme, yeniden adlandırma, önizleme | P0 |
| MED-5 | Dosya boyutu ve tür doğrulama (ör. maks. 200 MB) | P0 |
| MED-6 | Basit metin duyurusu (başlık + metin + arka plan rengi) | P1 |
| MED-7 | PDF / PowerPoint içe aktarma (görsele dönüştürme) | P2 |

### 5.4 Playlist
| ID | Gereksinim | Öncelik |
|---|---|---|
| PLY-1 | Playlist oluştur/düzenle/sil | P0 |
| PLY-2 | Medya ekleme, sürükle-bırak sıralama | P0 |
| PLY-3 | Görsel/URL için gösterim süresi (sn); video için otomatik süre | P0 |
| PLY-4 | Playlist döngüde oynar | P0 |
| PLY-5 | Geçiş efekti (fade) | P1 |
| PLY-6 | Öğe bazında geçerlilik tarihi (başlangıç/bitiş) | P1 |

### 5.5 Atama ve Zamanlama
| ID | Gereksinim | Öncelik |
|---|---|---|
| SCH-1 | Playlist'i tek ekrana veya gruba (kata) ata | P0 |
| SCH-2 | Her ekran için varsayılan playlist | P0 |
| SCH-3 | Zamanlanmış atama: gün(ler) + saat aralığı + (opsiyonel) tarih aralığı | P0 |
| SCH-4 | Çakışma kuralı: ekran özel > grup; zamanlanmış > varsayılan; hâlâ çakışırsa en son oluşturulan | P0 |
| SCH-5 | Acil duyuru (emergency override): tüm ekranları tek tuşla geçersiz kılma | P1 |

### 5.6 Player (TV Tarafı)
| ID | Gereksinim | Öncelik |
|---|---|---|
| PLR-1 | Tam ekran, imleç gizli, kaydırma çubuğu yok, hiçbir UI öğesi yok | P0 |
| PLR-2 | Sunucudan yayın bildirimini alır (WebSocket/SSE; yedek olarak 30 sn polling) | P0 |
| PLR-3 | Medyayı **önceden indirip önbelleğe alır** (Service Worker / Cache API); ağ kopsa da oynatmaya devam eder | P0 |
| PLR-4 | Heartbeat: her 30–60 sn'de durum bildirir (online, oynayan içerik, player sürümü) | P0 |
| PLR-5 | Hata toleransı: bozuk medya atlanır, döngü durmaz; sunucu bağlantısı kopunca otomatik yeniden bağlanır | P0 |
| PLR-6 | Atama yoksa varsayılan ekran (logo + "Yayın bekleniyor") | P0 |
| PLR-7 | Yeni player sürümü geldiğinde kendini güvenli şekilde yeniler (gece saatlerinde) | P1 |
| PLR-8 | Ekran uyumasını engelleme (Wake Lock) | P0 |
| PLR-9 | Gün içinde belirli saatlerde "boş ekran" (TV'yi karartma) | P2 |

### 5.7 İzleme
| ID | Gereksinim | Öncelik |
|---|---|---|
| MON-1 | Ekran offline kaldığında panelde uyarı göstergesi | P0 |
| MON-2 | E-posta/Teams bildirimi (ekran X dakikadır offline) | P1 |
| MON-3 | Oynatma raporu (hangi içerik, ne zaman, kaç kez) | P2 |

---

## 6. Fonksiyonel Olmayan Gereksinimler

| Alan | Gereksinim |
|---|---|
| **Güvenilirlik** | Player, sunucu veya ağ kesintisinde son geçerli yayını oynatmaya devam eder. Hedef: panel erişilemese bile TV'ler kesintisiz yayında. |
| **Performans** | Yayın değişikliği ≤ 60 sn içinde TV'de; 10 ekran için panel/API gecikmesi gözle görülür olmamalı. |
| **Ölçek** | MVP hedefi 10 ekran, ~3 kullanıcı. Mimari 50 ekrana kadar değişiklik gerektirmeden büyür. |
| **Güvenlik** | HTTPS (kurum içi sertifika dahil), parola hash'leme, rol bazlı yetki. Player'lar yalnızca kendi cihaz token'ı ile kendi yayınını okur. Panel yalnızca kurum ağından erişilebilir. |
| **Uyumluluk** | Player, Chromium tabanlı güncel tarayıcılarda (Chrome/Edge) çalışır. Panel masaüstü tarayıcılarda çalışır; mobil uyum zorunlu değil. |
| **Kullanılabilirlik** | Türkçe arayüz. Panelde en fazla 3 tıkla "yükle → playlist → ata" akışı. |
| **Bakım** | Tek komutla kurulum (Docker Compose), günlük yedek (DB + medya), basit log. |
| **Depolama** | Medya sunucu diskinde saklanır; kullanılmayan medya için silme/temizleme. |

---

## 7. Mimari Öneri (Hafif ve Pragmatik)

```
┌────────────────┐        ┌─────────────────────────────┐
│  Admin Paneli  │◄──────►│  Backend API + WebSocket    │
│  (Web, SPA)    │  HTTPS │  (Auth, Ekran, Medya,       │
└────────────────┘        │   Playlist, Zamanlama)      │
                          └──────┬─────────────┬────────┘
                                 │             │
                          ┌──────▼─────┐ ┌─────▼───────┐
                          │ PostgreSQL │ │ Medya Disk  │
                          │ (veya      │ │ (yerel / S3 │
                          │  SQLite)   │ │  uyumlu)    │
                          └────────────┘ └─────────────┘
                                 ▲
                   Yayın + Heartbeat (HTTPS/WebSocket)
        ┌─────────┬─────────┬────┴────┬─────────┐
     [TV 1]    [TV 2]    [TV 3]  ...      [TV 10]
   (Tarayıcı, kiosk modunda, /player URL'i)
```

### 7.1 Bileşenler
1. **Admin Paneli:** SPA (React/Vue vb.)
2. **Backend:** REST API + gerçek zamanlı kanal (WebSocket veya SSE). Ekibin bildiği stack tercih edilmeli (Node.js, .NET, Python vb.). Karar kriteri: bakımı kolay olması.
3. **Player:** Ayrı, hafif bir statik web uygulaması (`/player`). Framework'süz veya çok hafif tutulması önerilir (TV tarayıcılarının kaynakları sınırlı).
4. **Veritabanı:** 10 ekran için SQLite bile yeterli; ileri büyüme düşünülüyorsa PostgreSQL.
5. **Dağıtım:** Kurum içi tek sunucu/VM, Docker Compose.

### 7.2 Temel Veri Modeli
| Varlık | Önemli alanlar |
|---|---|
| **User** | id, email, parola_hash, rol |
| **ScreenGroup** | id, ad (ör. "3. Kat") |
| **Screen** | id, ad, group_id, device_token, durum, last_seen, eşleştirme_kodu |
| **Media** | id, ad, tür (image/video/url), dosya_yolu/url, boyut, süre |
| **Playlist** | id, ad |
| **PlaylistItem** | playlist_id, media_id, sıra, süre_sn |
| **Assignment** | id, playlist_id, hedef (screen_id veya group_id), gün_maskesi, başlangıç_saati, bitiş_saati, başlangıç_tarihi, bitiş_tarihi, öncelik |

### 7.3 Player Akışı
1. Açılış → `device_token` yoksa kayıt isteği, ekranda eşleştirme kodu.
2. Admin onaylar → player token alır (localStorage'a yazılır).
3. Player, geçerli yayın manifestini (aktif playlist + medya URL'leri + sürüm) alır.
4. Medyayı önbelleğe alır, sonra oynatmaya başlar.
5. WebSocket üzerinden "manifest değişti" olayı gelince 3. adıma döner.
6. Düzenli heartbeat gönderir.
7. Hangi playlist'in aktif olduğunu **sunucu hesaplar**, ancak son manifest cihazda saklanır (offline durumda zamanlamayı cihaz kendi saatiyle uygulayabilir).

---

## 8. TV Donanım ve Tarayıcı Notları (Kritik Riskler)

Bu proje için en büyük teknik risk, uygulamanın kendisi değil **TV'de tarayıcıyı güvenilir çalıştırmaktır**:

| Konu | Öneri |
|---|---|
| **Akıllı TV'nin yerleşik tarayıcısı** | Genellikle yavaş, eski ve kararsız. Üretim için **önerilmez**. |
| **Önerilen cihaz** | Her TV'ye HDMI ile bağlı küçük bir oynatıcı: mini PC (ör. Intel NUC), Raspberry Pi 4/5 veya Android TV/Google TV box. Chrome/Chromium **kiosk modunda** açılır. |
| **Kiosk başlatma** | Açılışta otomatik başlama, çökerse yeniden başlatma (systemd/Task Scheduler). Örn: `chromium --kiosk --autoplay-policy=no-user-gesture-required https://sunucu/player` |
| **Video autoplay** | Tarayıcılar sesli otomatik oynatmayı engeller. Videolar varsayılan **sessiz** oynatılır veya kiosk bayrağıyla izin verilir. |
| **Güç/uyku** | OS ekran koruyucu ve uyku modu kapatılmalı; TV'nin otomatik kapanma (auto power off) ayarı kapatılmalı. |
| **Hafıza sızıntısı** | Günlerce açık kalan tarayıcı şişebilir. Player günde bir kez (gece) kendini yeniler. |
| **Codec uyumu** | Video için MP4/H.264 standardı; yükleme sırasında uyarı ver. |
| **Kurumsal ağ** | TV cihazları için sabit IP/DHCP rezervasyonu, sunucuya erişim izni (HTTPS/WebSocket portu) kontrol edilmeli. |

> **Karar gerekli:** Hangi cihaz bu 10 TV'ye bağlanacak? Bu, test ve maliyet planını etkiler (Bkz. Bölüm 12).

---

## 9. Yol Haritası

### Faz 0: Hazırlık (≈ 1 hafta)
- Donanım kararı ve **1 TV ile PoC:** tarayıcı kiosk + basit sayfa + uzun süre çalışma testi
- Sunucu/VM ve ağ erişimi hazırlığı
- Bu PRD'nin onayı

### Faz 1: MVP (≈ 4–6 hafta)
| Hafta | Çıktı |
|---|---|
| 1 | Backend iskeleti, auth, veri modeli, ekran kaydı + eşleştirme |
| 2 | Medya yükleme (görsel/video/URL), kütüphane ekranı |
| 3 | Playlist oluşturma ve düzenleme |
| 4 | Player: döngü, manifest, WebSocket, heartbeat |
| 5 | Atama, zamanlama, çakışma kuralları, offline cache |
| 6 | Pilot (2–3 TV), hata düzeltme, kurulum dokümanı, 10 TV'ye yayılım |

### Faz 2: İyileştirmeler (ihtiyaca göre)
- Metin duyurusu, geçiş efektleri, acil duyuru, offline uyarı bildirimi
- Ekran önizleme, player otomatik güncelleme

### Faz 3: Opsiyonel
- Widget'lar (saat, hava durumu, RSS), çok bölgeli layout, oynatma raporları, AD/SSO, PDF/PowerPoint içe aktarma

---

## 10. Kapsam Dışı (MVP)

Çoklu kiracı/müşteri yönetimi, faturalama, şablon tasarım editörü, çok bölgeli ekran, analitik/proof-of-play, TV güç/ses uzaktan kontrolü, mobil uygulama, onay iş akışı, interaktif/dokunmatik içerik, canlı yayın (RTSP/HLS) akışı, çoklu dil.

---

## 11. Kabul Kriterleri (MVP Çıkış Şartları)

- [ ] 10 TV'nin tamamı eşleştirilmiş ve panelde görünür.
- [ ] Her kata farklı playlist atanabiliyor ve doğru TV'de oynuyor.
- [ ] Görsel, video ve URL içeriği aynı playlist'te sorunsuz dönüyor.
- [ ] Yayınla → TV'de görünme süresi ≤ 60 sn.
- [ ] Zamanlanmış atama doğru saatte devreye girip çıkıyor.
- [ ] Sunucu/ağ 30 dk kapatıldığında TV'ler yayına devam ediyor; bağlantı gelince otomatik toparlanıyor.
- [ ] TV'ler bir hafta boyunca müdahalesiz çalıştı (çökme/donma yok).
- [ ] Offline ekran panelde işaretleniyor.
- [ ] Kurulum ve olağan işlemler için kısa kullanım kılavuzu hazır.

---

## 12. Riskler ve Açık Sorular

### 12.1 Riskler
| Risk | Etki | Azaltma |
|---|---|---|
| Akıllı TV tarayıcısı yetersiz | Yüksek | Harici oynatıcı cihaz (mini PC/RPi/Android box), Faz 0'da PoC |
| Tarayıcıda uzun süreli çalışmada donma/bellek şişmesi | Orta | Günlük otomatik yenileme, watchdog |
| Video codec/boyut sorunları | Orta | Yüklemede doğrulama, önerilen format rehberi |
| Kurumsal ağ/güvenlik duvarı kısıtları | Orta | Faz 0'da BT ile doğrulama |
| Harici URL'lerin iframe'e izin vermemesi (X-Frame-Options) | Orta | URL eklerken uyarı; gerekirse alternatif (görsel/ekran görüntüsü) |
| İçerik sorumlusunun belirsizliği | Düşük/Orta | Rol ataması ve basit içerik kuralları |

### 12.2 Açık Sorular
1. TV'lerin marka/model ve girişleri nedir? Tarayıcıyı hangi cihazla çalıştıracağız?
2. Sunucu nerede barınacak (kurum içi VM mi, bulut mu)? TV'ler internete çıkabiliyor mu?
3. İçeriği kimler yönetecek? Kaç editör?
4. TV'ler yatay mı dikey mi kullanılacak?
5. Hangi içerik türleri en sık kullanılacak (duyuru görseli, video, yemek menüsü, kurum panosu)?
6. Ses gerekli mi? (Aksi hâlde tüm içerik sessiz.)
7. Mevcut kimlik altyapısı (AD/Azure AD) ile giriş şimdi mi, sonra mı gerekli?
8. Hedef canlıya alma tarihi var mı?

---

## 13. Sözlük

| Terim | Açıklama |
|---|---|
| **Player** | TV'de tarayıcıda açılan, yayını oynatan web sayfası |
| **Playlist** | Sıralı içerik listesi |
| **Manifest** | Player'ın oynatması gereken içerik ve ayarları tarif eden JSON |
| **Heartbeat** | Cihazın düzenli olarak "ben hayattayım" bildirimi |
| **Kiosk modu** | Tarayıcının tam ekran, adres çubuksuz, tek sayfaya kilitli çalışması |
| **Eşleştirme kodu** | TV'yi panelle ilişkilendirmek için ekranda gösterilen kısa kod |
