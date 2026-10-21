# PROJECT MEMORY: Kurum İçi Dijital Bilgi Ekranı (Digital Signage)

Bu belge, projenin mimari kararlarını, teknik altyapısını, veri modellerini, iş akışlarını ve gelişim günlüğünü içeren **kalıcı proje hafızasıdır**. Projeye dahil olan her geliştirici veya yapay zeka ajanı bu belgeyi okumalı ve yaptığı değişiklikleri belgeye işlemelidir.

---

## 1. Proje Özeti ve Hedefler

- **Kapsam:** Kurum içinde farklı katlara yerleştirilmiş **10 adet büyük TV ekranında**, her kata veya her TV'ye özel içerik (görsel, video, kurum içi duyuru URL) yayınlayabilen merkezi dijital bilgilendirme sistemi.
- **Yaklaşım:** Pareto (80/20) - Etkinin %80'ini sağlayan %20'lik çekirdek özellikler (Ekran eşleştirme, kat gruplama, medya kütüphanesi, playlist, zamanlama motoru, offline önbellek, durum izleme).
- **Yayın Platformu:** TV'lerde özel yazılım veya OS ajanı kurulmaz; TV'ye bağlı oynatıcıda (Chromium Kiosk modu) `http://<sunucu>:3001/player` URL'i açılır.

### Kararlaştırılan Temel Parametreler
1. **Ekran Yönü:** Yatay (Landscape 16:9 - 1080p / 4K).
2. **Ağ Ortamı:** Kurum içi yerel ağ (LAN / VLAN). Dış internete bağımlılık sıfırdır; tüm medya ve kütüphaneler yerel sunucudan servis edilir.
3. **Kimlik Doğrulama:** Sade yerel oturum yönetimi. İlk kurulum varsayılan hesabı:
   - **Kullanıcı:** `admin`
   - **Parola:** `admin123`
   - **Rol:** `ADMIN`

---

## 2. Sistem Mimarisi ve Teknoloji Tercihleri

```
┌─────────────────────────────────────────────────────────────┐
│                       MERKEZİ SUNUCU                        │
│                                                             │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │   Yönetici Paneli    │        │      Backend API      │  │
│  │ (React + Vite + TW)  │◄──────►│ (Express + TS + WS)   │  │
│  └──────────────────────┘        └───────────┬───────────┘  │
│                                              │              │
│                           ┌──────────────────┴───────────┐  │
│                           │ SQLite DB (Prisma WAL Mode)  │  │
│                           │ Medya Deposu (/uploads)      │  │
│                           │ Kiosk TV Player (/player)    │  │
│                           └──────────────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                        WebSocket Sinyali + HTTP Manifest & Medya
                                               │
            ┌──────────────────┬───────────────┴──┬──────────────────┐
            ▼                  ▼                  ▼                  ▼
     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
     │ TV 1 (Zemin)│    │ TV 2 (1.Kat)│    │ TV 3 (2.Kat)│    │ TV 10(Yemek)│
     │ Kiosk Player│    │ Kiosk Player│    │ Kiosk Player│    │ Kiosk Player│
     │ ServiceWrk. │    │ ServiceWrk. │    │ ServiceWrk. │    │ ServiceWrk. │
     └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

| Katman | Teknoloji | Neden Seçildi? |
|---|---|---|
| **Backend** | Node.js + TypeScript + Express + `ws` | Hızlı I/O, hafif kaynak tüketimi, gerçek zamanlı WebSocket desteği |
| **Veritabanı** | SQLite (WAL Modu) + Prisma ORM | 10-50 ekran için sıfır harici servis, tek dosyada tam yedek, yüksek okuma hızı |
| **Admin Paneli** | React 18 + Vite + Tailwind CSS + Lucide Icons | 3-tıkla hızlı yayın akışı, modern, kurumsal, duyarlı ve Türkçe arayüz |
| **TV Player** | Vanilla ES6 JavaScript + Service Worker + Cache API | Framework overhead'i yok (<20KB), bellek sızıntısız, kesintisiz offline yayın |
| **Dağıtım** | Docker Compose / Yerel Node.js Process | Tek komutla ayağa kalkma, kalıcı volume desteği |

---

## 3. Dizin Yapısı ve Temel Dosyalar

```
tv-brodcast/
├── package.json              # Kök scripts (build, dev, test)
├── digital-signage-prd.md    # Kurumsal PRD v1.0
├── todo.md                   # Görev ve faz takip listesi
├── PROJECT_MEMORY.md         # Kalıcı proje hafızası (bu dosya)
├── AGENTS.md                 # Yapay zeka ajanları çalışma yönergesi
├── Dockerfile                # Üretim konteyner tanımı
├── docker-compose.yml        # Tek komutla dağıtım
│
├── server/                   # Backend & WebSocket Sunucusu
│   ├── prisma/schema.prisma  # SQLite veri şeması
│   ├── src/
│   │   ├── index.ts          # Sunucu başlangıcı, static routing, websocket init
│   │   ├── config.ts         # Ortam değişkenleri
│   │   ├── db.ts             # Prisma Client singleton
│   │   ├── seed.ts           # Varsayılan admin ve kat grupları tohumlama
│   │   ├── services/
│   │   │   ├── pairingService.ts    # 6 haneli kod üretimi ve eşleştirme
│   │   │   ├── manifestResolver.ts  # Öncelik ve çakışma çözümleme motoru
│   │   │   └── heartbeatService.ts  # 30sn ping, 90sn offline tespit tarayıcısı
│   │   ├── ws/
│   │   │   └── wsServer.ts          # Canlı WebSocket yayın ve sync hub'ı
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT ve rol doğrulama (Admin/Editor)
│   │   │   └── upload.ts            # Multer 200MB medya yükleme desteği
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        # Giriş, profil, şifre değiştirme
│   │   │   ├── screenRoutes.ts      # Ekran listesi, eşleştirme, unpair, sync
│   │   │   ├── groupRoutes.ts       # Kat/grup CRUD
│   │   │   ├── mediaRoutes.ts       # Medya yükleme (resim/video/URL)
│   │   │   ├── playlistRoutes.ts    # Playlist oluşturma ve sıralama
│   │   │   ├── assignmentRoutes.ts  # Ekran/kat atamaları ve zamanlama
│   │   │   └── playerRoutes.ts      # TV Player public uç noktaları (register, manifest, heartbeat)
│   │   └── tests/
│   │       ├── scheduler.test.ts    # Zamanlama ve çakışma kural testleri (5/5)
│   │       ├── api.test.ts          # REST API entegrasyon testleri (5/5)
│   │       └── loadSimulation.ts    # 10 TV eşzamanlı yük ve senkronizasyon simülasyonu
│
├── client/                   # Admin Yönetim Paneli (SPA)
│   ├── src/
│   │   ├── App.tsx           # Ana state yönetimi, sekmeler ve modallar
│   │   ├── api.ts            # Tip güvenli backend API istemcisi
│   │   ├── types.ts          # TypeScript veri modelleri
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Üst menü, canlı TV sayaçları, hızlı yenile
│   │   │   ├── PairScreenModal.tsx  # 6 haneli kod ile TV eşleştirme modalı
│   │   │   ├── MediaUploadModal.tsx # Dosya yükleme & Web URL ekleme modalı
│   │   │   ├── PlaylistModal.tsx    # Sürükle-bırak/sıralı playlist modalı
│   │   │   └── ScheduleModal.tsx    # Kat/ekran zamanlama ve gün/saat kural modalı
│   │   └── pages/
│   │       ├── Login.tsx            # Giriş ekranı (admin / admin123)
│   │       ├── Dashboard.tsx        # 3-tık hızlı işlem çubuğu, sayaçlar, kat haritası
│   │       ├── Screens.tsx          # TV listesi, durum hapları, eşleştirme, unpair
│   │       ├── Groups.tsx           # Kat grupları yönetimi
│   │       ├── Media.tsx            # Medya galerisi, video/resim/URL kartları
│   │       ├── Playlists.tsx        # Oynatma listesi kartları ve içerik önizleme
│   │       └── Schedules.tsx        # Aktif yayın plan matrisi
│
├── player/                   # TV Kiosk Oynatıcı Web Uygulaması
│   ├── index.html            # Çift tamponlu (Slot A & Slot B) tam ekran oynatıcı
│   ├── style.css             # Kiosk stili (cursor: none, no scrollbar, crossfade)
│   ├── player.js             # Oynatıcı durum makinesi, WebSocket, wakeLock, gece 03:30 reload
│   └── sw.js                 # Service Worker (Cache Storage API ile offline medya saklama)
│
└── kiosk-setup/              # TV Donanımı Kiosk Kurulum Dosyaları
    ├── setup-chromium.sh             # Linux/RPi otomatik Chromium kiosk scripti
    ├── digital-signage-kiosk.service # Systemd servis dosyası
    └── README.md                     # Kurulum ve bakım kılavuzu
```

---

## 4. Temel Algoritmalar ve İş Akışları

### 4.1 Ekran Eşleştirme Akışı (SCR-1, SCR-2)
1. TV'de tarayıcı açılır (`http://<sunucu>:3001/player`).
2. Player yerel depolamada (`localStorage`) `signage_device_token` arar; bulamazsa `POST /api/player/register` çağırır.
3. Sunucu 6 haneli (okunması kolay, çakışmasız: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`) kod üretir.
4. TV ekranında büyük puntolarla kod gösterilir (`ABC123`). TV eşzamanlı olarak WebSocket üzerinden dinlemeye geçer.
5. Yönetici admin panelinden kodu girip TV adını ve katını belirler.
6. Sunucu kalıcı `deviceToken` üretir ve WebSocket üzerinden TV'ye iletir.
7. TV anında aktif moda geçer, yayın manifestini çeker ve oynatmaya başlar.

### 4.2 Zamanlama ve Çakışma Öncelik Motoru (SCH-4)
`ManifestResolver.resolveForScreen(screenId, timestamp)` fonksiyonu aşağıdaki hiyerarşik kurallara göre oynatılacak yayını belirler:
- **Öncelik 1 (En Yüksek):** Ekrana doğrudan atanmış, zaman/gün filtresi eşleşen zamanlanmış kural.
- **Öncelik 2:** Ekranın ait olduğu kata (gruba) atanmış, zaman/gün filtresi eşleşen kural.
- **Öncelik 3:** Ekrana doğrudan atanmış varsayılan (`isDefault: true`) yayın.
- **Öncelik 4:** Kök kata atanmış varsayılan (`isDefault: true`) yayın.
- **Varsayılan Boş:** Hiçbir atama yoksa TV kurumsal logolu "Yayın Bekleniyor" ekranına döner.

### 4.3 TV Player Kesintisiz Çalışma & Çevrimdışı Dayanıklılık (PLR-3, PLR-5, PLR-8)
- **Service Worker Pre-caching:** Player yeni bir manifest aldığında, içindeki tüm medya URL'lerini arka planda `signage-media-v1` önbelleğine indirir.
- **Ağ Kesintisi:** Ağ veya sunucu bağlantısı kopsa dahi Service Worker yerel önbellekten medyaları sunar, TV döngüyü kesintisiz oynatmaya devam eder.
- **Hata Toleransı:** Bozuk, silinmiş veya açılamayan medya olduğunda player 2 saniye içinde bir sonraki öğeye atlar; TV asla siyah veya kilitli ekranda kalmaz.
- **Wake Lock API:** TV ekran koruyucusunun veya uyku modunun devreye girmesi tarayıcı düzeyinde engellenir.
- **Gece Yenilemesi:** Her gece saat 03:30'da tarayıcı `location.reload()` ile kendini temizleyerek uzun süreli Chromium bellek şişmesini (memory leak) önler.

---

## 5. Doğrulama ve Test Sonuçları

Sistem üzerinde 3 katmanlı otomatik doğrulama testi koşturulmuştur:

| Test Paketi | Komut | Durum | Detay |
|---|---|---|---|
| **Zamanlama & Çakışma Birim Testleri** | `npm run test:scheduler` | **GEÇTİ (5/5)** | Grup varsayılanı, ekran ezme, saat filtresi, hafta sonu filtresi doğrulandı. |
| **REST API & Auth Entegrasyon Testleri** | `npm run test:api` | **GEÇTİ (5/5)** | JWT login, TV register, 6 haneli kod onaylama, manifest, heartbeat doğrulandı. |
| **10 TV Eşzamanlı Yük Simülasyonu** | `npm run test:load` | **GEÇTİ (10/10)** | 10 TV aynı anda açıldı, eşleşti, WebSocket bağlandı, <10ms manifest çekti, 502ms içinde anlık yayın güncelleme sinyali aldı (PRD hedefi: ≤ 60 sn). |
| **Tam Proje Derlemesi** | `npm run build` | **GEÇTİ** | Hem backend TypeScript hem frontend Vite bundle hatasız derlendi. |

---

## 6. Geliştirici & Ajan Notları (Changelog)

- **2026-10-21:**
  - Proje iskeleti, monorepo ve veritabanı şeması oluşturuldu.
  - SQLite WAL modu ve Prisma ORM yapılandırıldı.
  - Kimlik doğrulama (`admin`/`admin123`), rol bazlı yetkilendirme kodlandı.
  - 6 haneli TV eşleştirme motoru ve WebSocket anlık sync kanalı yazıldı.
  - Çift tamponlu (cross-fade), Service Worker destekli TV Player geliştirildi.
  - React + Tailwind CSS Admin Paneli (Dashboard, Screens, Groups, Media, Playlists, Schedules) tamamlandı.
  - Scheduler, API ve 10-TV yük testleri başarıyla koşturuldu.
  - `PROJECT_MEMORY.md` ve `AGENTS.md` kılavuzları oluşturuldu.

