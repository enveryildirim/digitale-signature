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
   - **Parola:** `ADMIN_PASSWORD` ortam değişkeni (geliştirmede tanımlı değilse `admin123`)
   - **Rol:** `ADMIN`
4. **Canlı Yayın (VDS + Dokploy):** Sunucu Datacasa İstanbul VDS üzerinde (Ubuntu, 4 GB RAM, 40 GB NVMe) Dokploy ile `Dockerfile` kullanılarak çalışır; HTTPS'i Traefik + Let's Encrypt sağlar. Bu sürümde TV'ler sunucuya internet üzerinden bağlanır, kesintide Service Worker önbelleği yayını sürdürür.
   - **Zorunlu ortam değişkenleri (`NODE_ENV=production`):** `JWT_SECRET`, `ADMIN_PASSWORD`. Biri eksikse sunucu açılmaz. `ADMIN_PASSWORD` tek doğruluk kaynağıdır: değiştirip yeniden deploy etmek admin parolasını sıfırlar.
   - **Kalıcı volume'lar:** `/app/data` (SQLite) ve `/app/uploads` (medya). Container açılırken `prisma db push --skip-generate` şemayı oluşturur; veri kaybettirecek şema değişikliğinde açılış durur.
   - **Saat dilimi:** İmajda `TZ=Europe/Istanbul`; zamanlama motoru sunucu saatini kullanır.
   - Firebase (sunucusuz) sürümü `firebase` dalında saklanıyor, `main`'de geri alındı.

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
├── todo_ux.md                # UX yasaları, erişilebilirlik ve mikro-kopya kontrol listesi & yol haritası
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
│   │   ├── App.tsx           # Ana state yönetimi, URL hash tabanlı sekmeler (#screens, #media, #playlists, #schedules) ve modallar
│   │   ├── api.ts            # Tip güvenli backend API istemcisi
│   │   ├── types.ts          # TypeScript veri modelleri
│   │   ├── utils/format.ts   # formatLastSeen, formatDuration ortak biçimlendiricileri
│   │   ├── components/
│   │   │   ├── ui/                  # Ortak UI katmanı: Modal (+ModalIcon), EmptyState, SearchInput ('/' kısayollu), FilterChips
│   │   │   ├── Navbar.tsx           # 4 sekme (Ekranlar/Medya/Playlistler/Zamanlama), çevrimiçi rozeti, acil durum
│   │   │   ├── ScreenDetailModal.tsx # Tek TV detayı: canlı önizleme, ad/kat, kalıcı link, cihaz bilgisi, yenile/sıfırla/sil
│   │   │   ├── ConfirmModal.tsx     # Yıkıcı işlem onayı (ortak Modal üzerinde)
│   │   │   ├── PairScreenModal.tsx  # 6 haneli kod ile TV eşleştirme modalı
│   │   │   ├── MediaUploadModal.tsx # Dosya yükleme & Web URL ekleme modalı
│   │   │   ├── MediaEditModal.tsx   # Medya başlık, süre, URL ve dosya güncelleme modalı
│   │   │   ├── MediaThumbnail.tsx   # Görsel, video (ilk kare) ve web sayfası thumbnail bileşeni
│   │   │   ├── PlaylistModal.tsx    # Sıralı playlist düzenleme modalı
│   │   │   └── ScheduleModal.tsx    # Kat/ekran zamanlama ve gün/saat kural modalı
│   │   └── pages/
│   │       ├── Login.tsx            # Giriş ekranı (admin / admin123)
│   │       ├── Screens.tsx          # Ana sayfa: uyarı bantları, kat bölümleri (kat CRUD + kat yayını), TV satırları
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

### 4.4 Canlı TV Önizleme ve Gerçek Zamanlı Eşzamanlama (SCR-6)
- **Sorun:** Önizleme ekranı açıldığında yayın sıfırdan (0. öğeden) başlarsa yönetici TV'nin o anki gerçek durumunu göremezdi.
- **Çözüm (Çift Katmanlı Senkronizasyon):**
  1. **WebSocket Durum Akışı:** Fiziksel TV her slayta geçtiğinde sunucuya `{ action: 'PLAYBACK_STATUS', currentIndex, mediaId, startedAt, duration }` bildirir.
  2. **Canlı Durum Sorgulama:** Panelde "Önizle" butonuna tıklandığında önizleme player'ı `GET /api/player/live-status` uç noktası üzerinden TV'nin oynattığı öğeyi ve geçen saniyeyi (`elapsedSeconds`) çeker.
  3. **Anlık Atlama ve Video Seek:** Önizleme doğrudan TV'nin oynattığı öğeye geçer; video ise `video.currentTime = seekSeconds` ile TV'nin o anki saniyesine sarar.
  4. **Deterministik Zaman Çizgisi (Wall-Clock Fallback):** TV o an WebSocket'e bağlı olmasa dahi döngü toplam süresi üzerinden `Date.now() % totalDuration` matematiği ile o saniyede hangi slaytın gösterilmesi gerektiği hesaplanarak açılır. Yayın asla baştan başlamaz.

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

- **[2026-10-21] - [Antigravity Agent]:**
  - **Yapılan İş:** `todo_ux.md` içerisindeki tüm UX iyileştirmeleri başarıyla hayata geçirildi:
    1. **Sistem Geri Bildirimi & Güvenlik:** Native `window.confirm()` kaldırıldı; Tailwind tabanlı, odak korumalı ve tehlike uyarılı `ConfirmModal` entegre edildi. 4 seviyeli (`success`, `error`, `warning`, `info`) zaman sayaçlı ve "Geri Al" (Undo) aksiyonlu zengin `Toast` sistemi geliştirildi.
    2. **Algılanan Hız & İskelet Ekranlar:** Sayfa yüklemelerindeki tekli çark (spinner) kaldırılarak yerine sayfa bazlı (Dashboard, Screens, Media, Playlists, Schedules) `PageSkeleton` bileşeni eklendi.
    3. **Navigasyon & Arama:** Sayfa başlıklarına dinamik `Breadcrumbs` navigasyonu entegre edildi. Medya ve Playlist sayfalarına hızlı arama kutusu (`/` kısayollu, temizleme butonlu, tip-toleranslı) ve dinamik filtre sayaçları eklendi.
    4. **Form Standartları & Hata Önleme:** Eşleştirme kodunda otomatik büyük harf, 6 karakter maskeleme ve anlık inline doğrulama; medya yüklemesinde 200MB istemci tarafı ön kontrolü ve insan dilinde Türkçe hata çevirileri uygulandı.
    5. **Erişilebilirlik (WCAG 2.1 AA) & Fitts Yasası:** Global `focus-visible` çerçeveleri, 4.5:1 kontrast standardı (`text-slate-400`), durum rozetlerinde rengin yanında net ikon (`Wifi`/`WifiOff`) + metin ve dokunmatik ekranlar için minimum 40-48px tıklama alanları sağlandı.
    6. **TV Player Kiosk Deneyimi:** 4-5 metreden rahat okunan aralıklı 6 haneli kod kutusu, 3 adımlı infografik yönerge kartları ve bekleme ekranına Türkçe tarih/saat gösterimi eklendi.
  - **Değiştirilen Dosyalar:** `client/src/index.css`, `client/src/App.tsx`, `client/src/components/ConfirmModal.tsx`, `client/src/components/Toast.tsx`, `client/src/components/Breadcrumbs.tsx`, `client/src/components/skeletons/PageSkeleton.tsx`, `client/src/pages/Media.tsx`, `client/src/pages/Playlists.tsx`, `client/src/pages/Groups.tsx`, `client/src/pages/Schedules.tsx`, `client/src/pages/Dashboard.tsx`, `client/src/pages/Screens.tsx`, `client/src/pages/Login.tsx`, `client/src/components/PairScreenModal.tsx`, `client/src/components/MediaUploadModal.tsx`, `client/src/components/PlaylistModal.tsx`, `client/src/components/ScheduleModal.tsx`, `client/src/components/EmergencyModal.tsx`, `client/src/components/ScreenPreviewModal.tsx`, `client/src/components/Navbar.tsx`, `player/index.html`, `player/style.css`, `player/player.js`, `todo_ux.md`, `PROJECT_MEMORY.md`
  - **Doğrulama:** `npm run test:scheduler` (5/5 Başarılı), `npm run build` (0 hata, Server + Client tam derleme).

- **[2026-10-21] - [Antigravity Agent]:**
  - **Yapılan İş:** Kullanılabilirlik (Hick, Fitts, Jakob yasaları), WCAG 2.1 AA erişilebilirlik standartları, modern UI/UX prensipleri ve mikro-kopya (UX Writing) kuralları doğrultusunda kurum içi Dijital Bilgi Ekranı projesi için kapsamlı, aksiyon odaklı `todo_ux.md` yol haritası ve görev takip listesi oluşturuldu. 7 ana kategori, 5 adımlı tasarım doğrulama matrisi ve aşamalı fazlandırma planı sisteme işlendi.
  - **Değiştirilen Dosyalar:** `todo_ux.md`, `PROJECT_MEMORY.md`
  - **Doğrulama:** `npm run test:scheduler` (5/5 Başarılı), `npm run build` (0 hata, Server + Client tam derleme).

- **[2026-10-22] - [Antigravity Agent]:**
  - **Yapılan İş:**
    - Kurumsal kimliğe uygun, yüksek çözünürlüklü ve vektörel SVG Favicon tasarımı (`favicon.svg`) oluşturuldu. Sky-600 degrade arka plan, TV ekranı çerçevesi, yayın anteni, oynatma üçgeni ve canlı durum bildirim noktası içeren simge hazırlandı.
    - **Yönetici Paneli Entegrasyonu:** `client/public/favicon.svg` eklendi, `client/index.html` içindeki varsayılan Vite logosu yerine `/favicon.svg` bağlandı.
    - **TV Player Entegrasyonu:** `player/favicon.svg` eklendi, `player/index.html` içerisine `<link rel="icon" type="image/svg+xml" href="favicon.svg">` eklendi, `player/sw.js` Service Worker önbellekleme listesine (`STATIC_ASSETS`) eklenerek çevrimdışı çalışması güvenceye alındı.
    - **Sunucu Kök Yönlendirmesi:** `server/src/index.ts` dosyasına doğrudan `/favicon.ico` veya `/favicon.svg` isteklerini karşılayan ve `image/svg+xml` MIME tipiyle servis eden Express rotası eklendi.
  - **Değiştirilen/Eklenen Dosyalar:**
    - `client/public/favicon.svg`
    - `player/favicon.svg`
    - `client/index.html`
    - `player/index.html`
    - `player/sw.js`
    - `server/src/index.ts`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run test:api`: 6/6 Başarılı
    - `npm run test:load`: 10/10 Başarılı
    - `npm run build`: 0 hata (Vite public dosyasını `client/dist/favicon.svg` olarak başarıyla paketledi).

- **2026-10-22 - Antigravity Agent:**
  - **Yapılan İş:**
    - **Anında Çevrimdışı (Instant OFFLINE) Tespiti:**
      - TV sekmesi kapatıldığında 90 saniyelik zaman aşımını beklemeksizin `ws.on('close')` anında ekranın veritabanı durumu `status = 'OFFLINE'` olarak güncellendi (`wsServer.ts`).
      - TV Player istemcisine `beforeunload` ve `pagehide` olaylarında `navigator.sendBeacon('/api/player/offline')` sinyali eklendi (`player.js`, `playerRoutes.ts`).
      - Eşleşmemiş boş ekran sekmeleri kapatıldığında otomatik silinerek veritabanında çöp TV bırakılması engellendi.
    - **Kalıcı TV Oynatıcı Kimliği (Persistent TV Identity):**
      - TV Player'a kalıcı URL parametresi (`/player?token=...`) önceliği getirildi; sekme kapansa veya çerezler silinse dahi sabit cihaz olarak yayına devam etmesi sağlandı.
      - Admin paneli ekran kartlarına ve ayarlar modalına **"TV Bağlantısını Kopyala"** (`Copy`) ve **"Bu TV'yi Yeni Sekmede Aç"** (`ExternalLink`) butonları eklendi (`Screens.tsx`).
  - **Değiştirilen Dosyalar:**
    - `server/src/ws/wsServer.ts`
    - `server/src/routes/playerRoutes.ts`
    - `player/player.js`
    - `client/src/pages/Screens.tsx`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run test:api`: 6/6 Başarılı
    - `npm run test:load`: 10/10 Başarılı
    - `npm run build`: 0 hata (Server TypeScript + Client Vite tam derleme)

- **2026-10-22 - Antigravity Agent:**
  - **Yapılan İş:**
    - Sistemin ilk başlangıçta tertemiz (fresh start / sıfırdan) başlaması için `server/src/seed.ts` güncellendi; sahte medya ve örnek oynatma listesi ekleme adımları kaldırıldı.
    - `resetAllData()` fonksiyonu ve `npm run reset` komutu tanımlandı. Tüm ekranlar, medyalar, oynatma listeleri, zamanlama kuralları ve `uploads/` dizinindeki eski dosyalar temizlenerek sistem sıfırlandı.
    - Canlı veritabanı 0 ekran, 0 medya, 0 oynatma listesi, 5 temel kurumsal kat grubu ve `admin` hesabı ile temiz başlangıç durumuna getirildi.
  - **Değiştirilen Dosyalar:**
    - `server/src/seed.ts`
    - `server/package.json`
    - `package.json`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run reset`: Başarılı (0 ekran, 0 medya, 0 playlist)
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run build`: 0 hata

- **2026-10-22 - Antigravity Agent:**
  - **Yapılan İş:**
    - "TV-101 Koridor" ve "Test 1. Kat" verilerinin kaynağı tespit edildi: `server/src/tests/scheduler.test.ts` zamanlama birim testi her çalıştığında canlı veritabanındaki katları silip yerine bu test verilerini yazıyor ve test sonunda temizlemiyordu.
    - `scheduler.test.ts` güncellendi; test başlangıcında ve `finally` bloğunda yalnızca kendi test verilerini temizlemesi ve ardından `runSeed()` çalıştırarak kurumun gerçek katlarını (Zemin Kat, 1. Kat, vb.) otomatik geri yüklemesi sağlandı.
    - Canlı veritabanından tüm "Test 1. Kat" ve "TV-101 Koridor" test kalıntıları temizlendi, 5 kurumsal kat grubu geri yüklendi.
  - **Değiştirilen Dosyalar:**
    - `server/src/tests/scheduler.test.ts`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı (Sonrasında test verileri sıfırlandı, kurumsal seed korundu)
    - `npm run test:api`: 6/6 Başarılı
    - `npm run test:load`: 10/10 Başarılı
    - `npm run build`: 0 hata

- **2026-10-22 - Antigravity Agent:**
  - **Yapılan İş:**
    - Yerel ağdaki (LAN) diğer cihazların ve TV'lerin IP adresiyle bağlanabilmesi için ağ yapılandırması tamamlandı.
    - `client/vite.config.ts` sunucu ayarlarına `host: '0.0.0.0'` eklendi (Vite dev sunucusunun sadece localhost değil LAN üzerindeki tüm cihazlardan gelen istekleri kabul etmesi sağlandı).
    - `server/src/index.ts` sunucu başlangıç loglarına `os.networkInterfaces()` üzerinden dinamik yerel IPv4 tespiti eklendi; terminalde doğrudan bağlanılabilecek LAN ve TV Player adresleri (`http://<LAN_IP>:3001` ve `/player`) listelendi.
  - **Değiştirilen Dosyalar:**
    - `client/vite.config.ts`
    - `server/src/index.ts`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run build`: Server TypeScript + Client Vite bundle 0 hata ile derlendi.

- **2026-10-21 - Antigravity Agent:**
  - **Yapılan İş:**
    - Test simülasyonlarının (`loadSimulation.ts` ve `api.test.ts`) canlı veritabanında sahte TV ekranları (`TV #1 ... #10`, `Giriş Danışma TV`) bırakması engellendi; her iki teste de `finally` bloğunda test ekranlarını ve ilişkili atamalarını veritabanından kalıcı olarak temizleyen cleanup adımları eklendi. Canlı veritabanındaki tüm artık test TV'leri temizlendi.
    - **"Çevrimdışı Diyor Ortasında Canlı Yayında Yazıyor" Mantıksal ve Görsel Hatanın Düzeltilmesi:**
      - `Screens.tsx` içindeki 16:9 mini TV kartı önizleme çerçevesinde durum kontrolü `screen.status === 'ONLINE'` şartına bağlandı.
      - TV çevrimdışı iken asla yeşil "● Canlı Yayında" yazmaması sağlandı; yerine `WifiOff` ikonu, soluk gri renkte "Son: [İçerik Başlığı]" ve kırmızı "Sinyal Yok (Çevrimdışı)" rozeti getirildi.
      - Tablo görünümünde de çevrimdışı ekranların önceki içerikleri soluk ve bilgilendirici olarak düzeltildi.
  - **Değiştirilen Dosyalar:**
    - `server/src/tests/loadSimulation.ts`
    - `server/src/tests/api.test.ts`
    - `client/src/pages/Screens.tsx`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run test:api`: 6/6 Başarılı (Otomatik cleanup devrede)
    - `npm run test:load`: 10/10 Başarılı (Otomatik cleanup devrede)
    - `npm run build`: Server TypeScript + Client Vite bundle 0 hata ile derlendi.
    - Veritabanı sorgusu ile sahte TV'lerin kalmadığı (yalnızca gerçek ekranların kaldığı) teyit edildi.

- **2026-10-21 - Antigravity Agent:**
  - **Yapılan İş:**
    - Medya kütüphanesindeki görsel ve videolar için otomatik Thumbnail (küçük önizleme resmi) sistemi geliştirildi (`MediaThumbnail.tsx`).
    - **Video Thumbnail Desteği:** HTML5 yerel `#t=0.5` video meta verisiyle videonun gerçek ilk karesi otomatik yakalanarak kapağa basıldı. Üzerine şık yarı saydam Play rozeti ve video süresi rozeti eklendi.
    - **Görsel Thumbnail & Hata Koruması:** Resim yüklenirken arka planda skeleton pulse animasyonu, yükleme gecikmelerine karşı otomatik 2 aşamalı yeniden deneme (retry) ve hata durumunda kapkara ekran yerine zarif fallback ikonu sağlandı.
    - **URL Web Mockup:** Web sayfası medyaları için mini tarayıcı pencereli alan adı ve bağlantı kartı oluşturuldu.
    - `Media.tsx`, `MediaEditModal.tsx` ve `PlaylistModal.tsx` bileşenleri `MediaThumbnail` ile donatılarak hem medya kütüphanesinde hem oynatma listesi oluşturma ekranında görsel zenginlik sağlandı.
  - **Değiştirilen/Eklenen Dosyalar:**
    - `client/src/components/MediaThumbnail.tsx`
    - `client/src/pages/Media.tsx`
    - `client/src/components/MediaEditModal.tsx`
    - `client/src/components/PlaylistModal.tsx`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run test:api`: 6/6 Başarılı
    - `npm run test:load`: 10/10 Başarılı (501ms)
    - `npm run build`: Server TypeScript + Client Vite bundle 0 hata ile derlendi.

- **2026-10-21 - Antigravity Agent:**
  - **Yapılan İş:**
    - Medya kütüphanesindeki medyaların güncellenebilmesi (düzenlenebilmesi) özelliği eklendi.
    - Sunucuda `PUT /api/media/:id` rotası `upload.single('file')` desteğiyle genişletildi; başlık (`title`), varsayılan süre (`duration`), web sayfası URL'si (`url`) ve isteğe bağlı olarak dosya değişimi (`file` - eski dosyanın diskten güvenli silinmesi ve yeni dosyanın kaydedilmesi) yetenekleri kazandırıldı. Güncelleme ve silme sonrasında bağlı TV'lere anlık manifest sync sinyali (`WsServer.notifyAllScreensSync()`) gönderilmesi sağlandı.
    - Frontend'de `client/src/components/MediaEditModal.tsx` bileşeni geliştirildi. Medya türüne (IMAGE, VIDEO, URL) duyarlı düzenleme ve dosya değiştirme arayüzü sunuldu.
    - `client/src/pages/Media.tsx` medya kartlarına "Düzenle" butonu eklendi, ayrıca önizleme penceresinden de tek tıkla düzenleme modalına geçiş imkanı sağlandı.
    - `server/src/tests/api.test.ts` entegrasyon testine Test 6 (Medya oluşturma, PUT ile güncelleme ve doğrulama) adımı eklendi.
  - **Değiştirilen/Eklenen Dosyalar:**
    - `server/src/routes/mediaRoutes.ts`
    - `server/src/tests/api.test.ts`
    - `client/src/api.ts`
    - `client/src/App.tsx`
    - `client/src/pages/Media.tsx`
    - `client/src/components/MediaEditModal.tsx`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run test:api`: 6/6 Başarılı (Yeni medya güncelleme testi dahil)
    - `npm run test:load`: 10 TV Eşzamanlı Yük ve Anlık Sync (502ms) Başarılı
    - `npm run build`: Server TypeScript + Client Vite bundle 0 hata ile derlendi.

- **2026-10-21 - Antigravity Agent:**
  - **Yapılan İş:**
    - TV Ekranları Yönetiminin (Screens) UX/UI mimarisi 10 TV'lik kurum yapısına özel olarak sıfırdan basitleştirildi ve optimize edildi.
    - **Tek Tıkla Doğrudan Yayın (Inline Quick-Assign):** Zamanlama sekmesine gitme zorunluluğu kaldırıldı. Ekran kartından veya kat başlığından açılır kutu ile anında playlist atanabilmesi sağlandı (`POST /api/screens/:id/quick-assign` ve `POST /api/groups/:id/quick-assign`).
    - **3 Esnek Görünüm Modu:**
      1. *Kat Gruplu Görünüm (Floors View - Varsayılan):* Katlara göre gruplama ve "Tüm Katın Yayınını Değiştir" kontrolü.
      2. *Görsel TV Kartları (Cards View):* 16:9 mini TV önizleme çerçevesi ve durum göstergeleri.
      3. *Kompakt Tablo Görünümü (Table View):* 10 TV'yi kaydırma yapmadan tek ekranda izleme ve inline kontrol imkanı.
    - **Akıllı Eşleştirme Şeridi:** Eşleşmemiş bekleyen TV olduğunda sayfa üstünde tek tıkla adlandırma ve eşleme bildirimi.
    - **Sadeleştirilmiş Ayarlar:** Seyrek kullanılan kat taşıma, unpair, silme işlemleri `···` ayarlar modalına taşındı.
    - **Arama Çubuğu:** Ekran veya kat adına göre anlık filtreleme.
  - **Değiştirilen Dosyalar:**
    - `server/src/routes/screenRoutes.ts`
    - `server/src/routes/groupRoutes.ts`
    - `client/src/api.ts`
    - `client/src/App.tsx`
    - `client/src/pages/Screens.tsx`
    - `client/src/components/PairScreenModal.tsx`
    - `PROJECT_MEMORY.md`
  - **Doğrulama:** `npm run test:scheduler` (5/5 Başarılı), Quick-assign veritabanı testi (3/3 Başarılı), `npm run build` (0 hata, Server + Client tam derleme).

- **2026-10-21 - Antigravity Agent:**
  - **Yapılan İş:**
    - Önizleme tıklandığında yayının baştan başlaması sorunu çözüldü.
    - TV oynatıcısına anlık durum bildirme (`PLAYBACK_STATUS`), WebSocket canlı önizleme kanalı ve video `seekSeconds` desteği eklendi.
    - Sunucuya `GET /api/player/live-status` uç noktası eklendi; önizleme player'ı açıldığında doğrudan TV'nin o anki öğesine ve saniyesine sarar.
    - Deterministik Wall-Clock timeline senkronizasyon motoru entegre edildi.
  - **Değiştirilen Dosyalar:** `server/src/ws/wsServer.ts`, `server/src/routes/playerRoutes.ts`, `player/player.js`, `client/src/components/ScreenPreviewModal.tsx`, `PROJECT_MEMORY.md`
  - **Doğrulama:** `npm run test:scheduler` (5/5), `npm run test:api` (5/5), `npm run test:load` (10/10), `npm run build` (0 hata).

- **2026-10-21 - Antigravity Agent:**
  - **Yapılan İş:**
    - Faz 0 - Faz 8 arasındaki tüm P0 MVP gereksinimleri (Auth, Ekran Eşleştirme, Medya Kütüphanesi, Playlist, Zamanlama Çözümleme Motoru, Kiosk TV Player, Service Worker Offline Caching, Admin Paneli, Docker & Kiosk Scriptleri) tamamlandı.
    - Faz 9 P1 özellikleri eklendi:
      - **Acil Durum Duyurusu (SCH-5):** `EmergencyService.ts` ve tek tıkla tüm TV'lerin yayınını ezerek kırmızı acil durum ekranı açan WebSocket kanalı ve `EmergencyModal.tsx`.
      - **Metin Duyuru Şablonu (MED-6):** Çözünürlük bağımsız, 1080p/4K kristal netliğinde vektörel SVG duyuru kartı üreten `POST /api/media/text-announcement` servisi ve `MediaUploadModal.tsx` sekmesi.
      - **Canlı Ekran Önizleme (SCR-6):** Yönetim panelinde ekran kartlarından açılan 16:9 TV çerçevesinde canlı player simülasyonu (`ScreenPreviewModal.tsx`).
    - Kalıcı proje hafızası `PROJECT_MEMORY.md` ve yapay zeka ajan çalışma yönergesi `AGENTS.md` oluşturuldu.
  - **Değiştirilen/Eklenen Dosyalar:**
    - `server/src/services/emergencyService.ts`
    - `server/src/services/manifestResolver.ts`
    - `server/src/routes/screenRoutes.ts`
    - `server/src/routes/mediaRoutes.ts`
    - `player/index.html`, `player/style.css`, `player/player.js`
    - `client/src/api.ts`, `client/src/App.tsx`
    - `client/src/components/EmergencyModal.tsx`
    - `client/src/components/ScreenPreviewModal.tsx`
    - `client/src/components/MediaUploadModal.tsx`
    - `client/src/components/Navbar.tsx`, `client/src/pages/Screens.tsx`
    - `todo.md`, `PROJECT_MEMORY.md`, `AGENTS.md`
  - **Doğrulama:**
    - `npm run test:scheduler`: 5/5 Başarılı
    - `npm run test:api`: 5/5 Başarılı
    - `npm run test:load`: 10 TV Eşzamanlı Yük ve Anlık Sync (501ms) Başarılı
    - `npm run build`: Server TypeScript ve Client Vite bundle 0 hata ile derlendi.

- **[2026-10-22] - [Claude Code]:**
  - **Yapılan İş:** Yönetici paneli sadeleştirmesi, `todo_ui.md` Faz 1 + Faz 2 (+ Faz 5'in küçük maddeleri):
    1. **Navigasyon 6 → 4 sekme:** Genel Bakış ve Katlar & Gruplar sayfaları Ekranlar'a birleştirildi. Aktif sekme URL hash'inde tutuluyor; sayfa yenileme ve tarayıcı geri tuşu çalışıyor. Breadcrumb, navbar'daki tekrar eden "Tüm TV'leri Yenile" ve "TV Player Aç" (yöneticinin tarayıcısında bekleyen TV kaydı açıyordu) kaldırıldı.
    2. **Ekranlar sayfası (1130 → 554 satır):** 3 görünüm modu tek görünüme indi. Kat bölümleri (TV'si olanlar üstte, boş katlar tek satır) + kompakt TV satırı (durum · ad · şu an oynayan · playlist seçimi · detay). Kat ekleme/yeniden adlandırma/silme kat başlığında. Kat atanmamış TV'ler ayrı bölümde, en üstte. Eşleşme bekleyen kayıtlar için "Eşleştir / Yoksay" bandı, çevrimdışı TV bandı.
    3. **ScreenDetailModal:** Eski ayar modalı + `ScreenPreviewModal` birleştirildi. Önizleme iframe'inin 10 sn'lik polling'de baştan yüklenmesi hatası `useMemo` ile giderildi.
    4. **Ortak UI katmanı:** `Modal` bileşeni 8 modal kabuğundaki kopya kodun (backdrop, başlık, Esc dinleyici) yerini aldı. `EmptyState`, `SearchInput`, `FilterChips`, `utils/format.ts` eklendi. Buton tipografisi `text-sm` oldu, dropdown'lardaki emojiler kaldırıldı, medya tip rozetleri Türkçeleşti.
    5. Grup açıklama alanı arayüzden kaldırıldı (DB kolonu ve API korunuyor).
  - **Değiştirilen Dosyalar:** `client/src/App.tsx`, `client/src/index.css`, `client/src/components/Navbar.tsx`, `client/src/components/ConfirmModal.tsx`, `client/src/components/PairScreenModal.tsx`, `client/src/components/EmergencyModal.tsx`, `client/src/components/MediaUploadModal.tsx`, `client/src/components/MediaEditModal.tsx`, `client/src/components/PlaylistModal.tsx`, `client/src/components/ScheduleModal.tsx`, `client/src/components/skeletons/PageSkeleton.tsx`, `client/src/pages/Screens.tsx`, `client/src/pages/Media.tsx`, `client/src/pages/Playlists.tsx`, `client/src/pages/Schedules.tsx`. Yeni: `client/src/components/ui/*`, `client/src/components/ScreenDetailModal.tsx`, `client/src/utils/format.ts`, `todo_ui.md`. Silinen: `client/src/pages/Dashboard.tsx`, `client/src/pages/Groups.tsx`, `client/src/components/Breadcrumbs.tsx`, `client/src/components/ScreenPreviewModal.tsx`.
  - **Doğrulama:** `npm run test:scheduler` (5/5), `npm run test:api` (tümü başarılı), `npm run test:load` (10 TV sync 502ms), `npm run build` (0 hata). Headless Chromium ile giriş → Ekranlar → TV detayı → Medya → Playlistler gezildi; hash routing, geri tuşu ve yenileme doğrulandı, konsol hatası yok, 390px mobil görünüm kontrol edildi.

- **[2026-10-23] - [Claude Code]:**
  - **Yapılan İş:** VDS + Dokploy yayınına hazırlık. `main`'e gelen Firebase commit'i (`b5cd7bc`) geri alındı, Firebase çalışması `firebase` dalında saklandı. Production için: (1) `JWT_SECRET` ve `ADMIN_PASSWORD` zorunlu hale getirildi, eksikse sunucu açılmıyor; (2) admin parolası `ADMIN_PASSWORD`'den geliyor, değer değişince açılışta güncelleniyor (arayüzde parola değiştirme ekranı yok, sıfırlama yolu bu); (3) boş volume'da tablolar oluşmuyordu, container açılışına `prisma db push` eklendi (prisma CLI için runner'a builder'ın `node_modules`'u kopyalanıyor); (4) `.dockerignore` eklendi, Mac `node_modules`'unun Linux imajına kopyalanıp build'i bozması engellendi; (5) imaja `TZ=Europe/Istanbul` eklendi; (6) `docker-compose.yml`'deki sabit JWT secret kaldırıldı.
  - **Değiştirilen Dosyalar:** `server/src/config.ts`, `server/src/seed.ts`, `Dockerfile`, `docker-compose.yml`, `.dockerignore` (yeni), `PROJECT_MEMORY.md`
  - **Doğrulama:** `npm run test:scheduler` (5/5), `npm run test:api` (tümü başarılı), `npm run test:load` (10 TV sync 502ms), `npm run build` (0 hata). `docker build --platform linux/amd64` başarılı. Container testleri: env eksikken açılmıyor; boş volume'da şema + admin + gruplar oluşuyor; `admin123` reddediliyor, `ADMIN_PASSWORD` ile giriş başarılı; env değişince parola güncelleniyor; restart sonrası veri korunuyor; container saati GMT+0300; `/` ve `/player/` 200 dönüyor.

- **[2026-10-23] - [Claude Code]:**
  - **Yapılan İş:** VDS + Dokploy canlı yayın rehberi eklendi: sunucu hazırlığı, Dokploy kurulumu, uygulama ayarları (env, volume, domain), parola sıfırlama, yedekleme/geri yükleme ve sorun giderme.
  - **Değiştirilen Dosyalar:** `DEPLOYMENT.md` (yeni), `PROJECT_MEMORY.md`
  - **Doğrulama:** Yalnızca dokümantasyon değişikliği; kod değişmediği için testler yeniden koşturulmadı.

- **[2026-10-23] - [Claude Code]:**
  - **Yapılan İş:** Video sesinin medya bazında yönetilmesi. Önceden player her videoyu koddan `muted = true` ile oynatıyordu. `Media` modeline `soundEnabled` (varsayılan `false`) eklendi; yükleme ve düzenleme ekranlarında video için "Sesli oynat" anahtarı (`ui/SoundToggle`) var, medya kartında sesli videolar hoparlör ikonuyla gösteriliyor. Manifest `soundEnabled`'ı taşıyor ve alan hash'e dahil, ayar değişince TV'ler anlık sync alıyor. Player: video `isPreview || !soundEnabled` ile sessiz; admin önizlemesi her zaman sessiz; tarayıcı sesli autoplay'i reddederse sessiz olarak devam ediyor; ayar değişikliği oynayan videoya anında uygulanıyor; geçişte giden video susturuluyor. `player.js` 20.474 bayt (<20 KiB).
  - **Değiştirilen Dosyalar:** `server/prisma/schema.prisma`, `server/src/routes/mediaRoutes.ts`, `server/src/services/manifestResolver.ts`, `player/player.js`, `client/src/types.ts`, `client/src/api.ts`, `client/src/App.tsx`, `client/src/pages/Media.tsx`, `client/src/components/MediaUploadModal.tsx`, `client/src/components/MediaEditModal.tsx`, `client/src/components/ui/SoundToggle.tsx` (yeni), `kiosk-setup/README.md`
  - **Doğrulama:** `npm run test:scheduler` (5/5), `npm run test:api` (tümü başarılı), `npm run test:load` (10 TV sync 501ms), `npm run build` (0 hata). Playwright + Chromium ile uçtan uca: sesli yükleme kaydı, manifestte alan, kiosk bayrağıyla TV'de `muted=false` ve oynuyor, önizlemede `muted=true`, ayar kapatılınca oynayan video anında sessiz, sesli `play()` reddedilince sessiz devam. Medya sayfası ve düzenleme modalı ekran görüntüsüyle kontrol edildi, konsol hatası yok. Canlıda şema, container açılışındaki `prisma db push` ile veri kaybı olmadan eklenir.
