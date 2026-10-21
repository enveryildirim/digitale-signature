# Dijital Bilgi Ekranı (Digital Signage) - Görev Takip Listesi (TODO)

Bu belge, **Kurum İçi Dijital Bilgi Ekranı PRD v1.0** gereksinimlerinin Pareto (80/20) ilkesine göre planlanan uygulama adımlarını, önceliklerini ve doğrulama kriterlerini içerir.

> **Kararlaştırılan Parametreler:**
> - **Ekran Yönü:** Yatay (Landscape 16:9).
> - **Ağ Ortamı:** Yerel ağ (LAN / Kurum içi), harici internet bağımsızlığı.
> - **Kimlik Doğrulama:** Basit yerel oturum (`admin` / `admin123`).

---

## 📌 Öncelik Tanımları
- **[P0] Zorunlu MVP:** İlk canlı yayının 10 TV'de kesintisiz çalışması için olmazsa olmaz gereksinimler.
- **[P1] İterasyon 1:** MVP sonrası kullanıcı deneyimini ve operasyonu güçlendiren özellikler.
- **[P2] Gelecek / İsteğe Bağlı:** İhtiyaç doğduğunda eklenecek kurumsal entegrasyonlar.

---

## 🏗️ Faz 0: Mimari ve Proje İskeleti (Hazırlık)

- [x] **0.1 Proje Yapısı ve Teknoloji Seçimi**
  - [x] Monorepo/modüler yapı oluşturulması (`server`, `client`, `player`, `kiosk-setup`)
  - [x] Node.js (TypeScript) backend yapılandırması
  - [x] React + Tailwind CSS admin paneli yapılandırması
  - [x] Bağımsız, ultra-hafif Kiosk Player (Vanilla TS/JS + Service Worker) yapısının kurulması
  - [x] Git reposu ilklendirmesi (`.gitignore`, README)
- [x] **0.2 Veritabanı ve ORM Altyapısı**
  - [x] SQLite (WAL modu) + Prisma ORM kurulumu (10-50 ekran için sıfır bağımlılık ve yüksek performans)
  - [x] Şema tanımları: `User`, `ScreenGroup`, `Screen`, `Media`, `Playlist`, `PlaylistItem`, `Assignment`
  - [x] İlk veritabanı migration'ının çalıştırılması ve tohum (seed) verisi (varsayılan admin: `admin` / `admin123`)

---

## 🔐 Faz 1: Kimlik Doğrulama ve Ekran Gruplama (P0)

- [x] **1.1 Kimlik Doğrulama & Yetkilendirme (AUTH-1, AUTH-2)**
  - [x] Parola hash'leme (bcrypt) ve JWT oturum yönetimi
  - [x] `POST /api/auth/login` ve oturum kontrol uç noktaları
  - [x] Rol kontrol ara katmanı (`Admin` / `Editor`)
  - [x] Seed: İlk admin kullanıcısının otomatik oluşturulması
- [x] **1.2 Ekran Grupları (Kat Yönetimi) (SCR-4)**
  - [x] Grup CRUD uç noktaları (`/api/groups`)
  - [x] Admin panelinde Grup/Kat listeleme, ekleme, düzenleme ve silme arayüzü

---

## 📺 Faz 2: Ekran (TV) Eşleştirme ve Cihaz Yönetimi (P0)

- [x] **2.1 Eşleştirme Motoru (SCR-1, SCR-2, SCR-5)**
  - [x] TV ilk açılışta yerel depolamada token yoksa sunucudan 6 haneli geçici eşleştirme kodu ister (`POST /api/player/register`)
  - [x] 6 haneli kod üretimi (çakışmasız, temiz karakter seti: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`)
  - [x] TV ekranında büyük puntolarla eşleştirme kodu ve yönlendirme arayüzü
  - [x] Admin panelinde "Yeni Ekran Eşleştir" modalı: 6 haneli kod girilerek ekrana isim ve grup atanması
  - [x] Eşleştirme tamamlandığında WebSocket/Polling ile TV'ye kalıcı `deviceToken` iletilmesi ve localStorage'a kaydedilmesi
  - [x] Ekranı silme ve eşleştirmeyi sıfırlama mekanizması (`POST /api/screens/:id/unpair`, `DELETE /api/screens/:id`)
- [x] **2.2 Ekran Listesi ve Durum Takibi (SCR-3, MON-1, PLR-4)**
  - [x] Ekran listeleme sayfası: Ekran adı, katı, IP/durumu, son görülme, aktif playlist
  - [x] TV Player'dan 30 saniyede bir Heartbeat gönderimi (`POST /api/player/heartbeat` ve WebSocket)
  - [x] 90 saniye heartbeat alamayan ekranların otomatik "Offline" durumuna düşürülmesi (`HeartbeatService.startScanner`)
  - [x] Admin panelinde çevrimiçi/çevrimdışı rozetleri (yeşil/kırmızı göstergeler)

---

## 📁 Faz 3: Medya Kütüphanesi (P0)

- [x] **3.1 Dosya Yükleme ve Depolama (MED-1, MED-2, MED-5)**
  - [x] Görsel yükleme desteği: JPG, PNG, WebP (Maksimum dosya boyutu: 200 MB)
  - [x] Video yükleme desteği: MP4 (H.264 / AAC), WebM
  - [x] Sunucu tarafı dosya tipi ve boyut doğrulaması (`multer`)
  - [x] Yerel dosya sistemi üzerinde güvenli dosya saklama ve statik dosya sunumu (`/uploads`)
- [x] **3.2 Web Sayfası / Harici URL Desteği (MED-3)**
  - [x] Kurum içi panolar veya web sayfaları için URL medya türü ekleme
  - [x] URL geçerlilik kontrolü ve iframe önizleme desteği
- [x] **3.3 Medya Yönetim Arayüzü (MED-4)**
  - [x] Medya galerisi (küçük resim önizlemeleri, dosya adı, boyutu, türü)
  - [x] Medya silme, yeniden adlandırma ve detaylı tam ekran önizleme modalı

---

## 📑 Faz 4: Playlist (Oynatma Listesi) Yönetimi (P0)

- [x] **4.1 Playlist CRUD (PLY-1)**
  - [x] Yeni playlist oluşturma, düzenleme ve silme
- [x] **4.2 Öğe Sıralama ve Süre Yönetimi (PLY-2, PLY-3, PLY-4)**
  - [x] Medya kütüphanesinden playlist'e öğe ekleme
  - [x] Görsel ve URL öğeleri için gösterim süresi belirleme (sn)
  - [x] Video öğeleri için süre tespiti ve oynatma
  - [x] Playlist içi öğelerin sırasını yukarı/aşağı butonlarıyla değiştirme
  - [x] Playlist toplam döngü süresinin panelde canlı hesaplanıp gösterilmesi

---

## ⏰ Faz 5: Atama ve Zamanlama Motoru (P0)

- [x] **5.1 Hedef Atama (SCH-1, SCH-2)**
  - [x] Playlist'i doğrudan tek bir ekrana atama
  - [x] Playlist'i bir ekrana grubuna (kata) atama (gruptaki tüm TV'ler miras alır)
  - [x] Her ekran/grup için varsayılan (fallback) playlist belirleme
- [x] **5.2 Zamanlanmış Yayın Kuralları (SCH-3)**
  - [x] Gün maskesi seçimi (Pazartesi - Pazar)
  - [x] Başlangıç ve bitiş saati (ör. 08:30 - 18:00 mesai yayını; 12:00 - 13:30 yemek menüsü)
  - [x] Tarih aralığı desteği
- [x] **5.3 Çakışma ve Öncelik Algoritması (SCH-4)**
  - [x] Çözümleme kuralı: `Ekran Özel > Grup (Kat)`
  - [x] Çözümleme kuralı: `Zamanlanmış Yayın > Varsayılan Yayın`
  - [x] Eşitlik durumunda öncelik ve en son güncelleme kuralı
  - [x] Belirli bir an için ekranın aktif manifestini hesaplayan `ManifestResolver` servisi ve 5/5 birim test doğrulaması

---

## 📺 Faz 6: TV Player (Kiosk İstemcisi) & Çevrimdışı Çalışma (P0)

- [x] **6.1 Kiosk Arayüzü (PLR-1, PLR-6, PLR-8)**
  - [x] Tam ekran, imleçsiz (`cursor: none`), kaydırma çubuksuz, sıfır işletim sistemi UI'ı
  - [x] Ekran uyanık tutma (Screen Wake Lock API entegrasyonu)
  - [x] Atanmış yayın yoksa kurumsal logo + saat + "Yayın Bekleniyor" bekleme ekranı
- [x] **6.2 Döngü ve Oynatma Motoru (PLY-4, PLR-5)**
  - [x] Çift tamponlu (Slot A & Slot B) pürüzsüz cross-fade geçişleri
  - [x] Görseller için zamanlayıcı ile geçiş
  - [x] Videolar için `autoplay` ve `muted` ile otomatik oynatma ve bitişte sonrakine geçme
  - [x] Web sayfaları için güvenli iframe gösterimi
  - [x] Bozuk/yüklenemeyen medya durumunda döngünün kilitlenmemesi (2 saniyede bir sonrakine atlama)
- [x] **6.3 Anlık Güncelleme ve Senkronizasyon (PLR-2)**
  - [x] WebSocket bağlantısı ile panelden "yayınla" dendiğinde anında sinyal alma (Test edildi: 502ms)
  - [x] WebSocket koptuğunda 30 saniyelik HTTP fallback polling mekanizması
- [x] **6.4 Çevrimdışı Önbellek (Offline Cache) (PLR-3)**
  - [x] Service Worker ve Cache Storage API entegrasyonu (`sw.js`)
  - [x] Yayın manifestindeki tüm medya dosyalarını oynatmadan önce arka planda indirme (`PRECACHE_MEDIA`)
  - [x] Ağ tamamen kesildiğinde yerel önbellekteki medya ve manifest ile kesintisiz yayına devam etme
- [x] **6.5 Bellek Yönetimi ve Otomatik İyileştirme (PLR-5, PLR-7)**
  - [x] Gece saat 03:30'da player sayfasının temiz yeniden yüklenmesi (soft-reload / memory leak önleme)
  - [x] Ağ geri geldiğinde bekleyen heartbeat güncellemelerinin sunucuya iletilmesi

---

## 🖥️ Faz 7: Admin Paneli Kullanıcı Arayüzü (P0)

- [x] **7.1 Dashboard (Genel Bakış)**
  - [x] Toplam TV sayısı, aktif/çevrimdışı ekran sayaçları
  - [x] Katlara göre TV durum haritası
  - [x] Hızlı işlem butonları (1. Medya Yükle → 2. Playlist Yap → 3. Yayına Ata)
- [x] **7.2 3 Tık Akışı: "Yükle → Playlist → Ata"**
  - [x] Kullanıcı dostu, hızlı akış tasarımı
  - [x] Türkçe dil desteği, modern koyu tema ve açık hata bildirimleri

---

## 🚀 Faz 8: Dağıtım, Kiosk Kılavuzu ve Doğrulama (P0)

- [x] **8.1 Dağıtım Yapılandırması**
  - [x] `Dockerfile` (Multi-stage build: Vite Admin + Node Server + SQLite + Player)
  - [x] `docker-compose.yml` (Tek komutla ayağa kaldırma: `docker compose up -d`)
  - [x] Veri ve medya dosyaları için kalıcı volume yapılandırması (`./data` ve `./uploads`)
- [x] **8.2 TV Donanım & Kiosk Kurulum Dokümanı**
  - [x] Mini PC / Android Box / RPi için `kiosk-setup/setup-chromium.sh`
  - [x] `kiosk-setup/digital-signage-kiosk.service` systemd autostart servisi
  - [x] `kiosk-setup/README.md` donanım ve TV güç kılavuzu
- [x] **8.3 Kabul ve Dayanıklılık Testleri**
  - [x] 10 eş zamanlı player simülasyonu ile yük ve heartbeat testi (`npm run test:load` -> BAŞARILI)
  - [x] Zamanlama ve çakışma kural testi (`npm run test:scheduler` -> BAŞARILI 5/5)
  - [x] REST API ve eşleştirme entegrasyon testi (`npm run test:api` -> BAŞARILI 5/5)
  - [x] İçerik güncelleme süresi doğrulama (502ms; PRD hedefi ≤ 60 sn)

---

## 🌟 Faz 9: İterasyon 1 Geliştirmeleri (P1 - İleride)

- [ ] **9.1 Metin Duyuru Şablonu (MED-6):** Başlık + metin + arka plan rengi ile hızlı duyuru
- [ ] **9.2 Ekran Önizleme (SCR-6):** TV'de anlık ne oynatıldığının panelde canlı simülasyonu
- [ ] **9.3 Acil Durum Duyurusu (SCH-5):** Tek tuşla tüm katlardaki ekranlara acil anons basma
- [ ] **9.4 Çevrimdışı Alarm Bildirimi (MON-2):** TV 15 dakikadan uzun süre çevrimdışı kalırsa e-posta bildirimi
