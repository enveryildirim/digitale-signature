# 📋 Dijital Bilgi Ekranı (Digital Signage) - Kapsamlı UX Yol Haritası ve Görev Listesi (todo_ux.md)

Bu belge, **UX Yasaları (Hick, Fitts, Jakob)**, **Modern Arayüz Standartları**, **WCAG 2.1 AA Erişilebilirlik** ve **Mikro-Kopya (UX Writing)** kuralları çerçevesinde kurum içi Dijital Bilgi Ekranı sistemi (Yönetici Paneli ve TV Kiosk Player) için hazırlanmış uçtan uca aksiyon odaklı görev listesidir.

> **Pareto İlkesi (80/20):** Kurum içinde çalışan 10 TV'nin yönetimini en az tıklamayla, sıfır kafa karışıklığıyla, hatasız ve pürüzsüz hale getiren en etkili UX iyileştirmelerine öncelik verilmiştir.

---

## 🧭 UX Faz ve Öncelik Dağılımı

| Öncelik | Kapsam | Odak Alanları | Tahmini Efor |
|---|---|---|---|
| **[P0] Kritik MVP** | Geri Bildirim, Hata Önleme & Yükleme | Toast/Undo sistemi, native `confirm()` kaldırılması, Skeleton loader'lar, buton yükleme halleri | Faz 1 |
| **[P1] Yüksek Değer** | Navigasyon, Arama, Filtreleme & Formlar | Breadcrumb navigasyonu, tüm listelerde akıllı arama/filtreleme, inline form doğrulaması, boş durumlar (empty states) | Faz 2 |
| **[P2] Mükemmellik** | Erişilebilirlik, Fitts Yasası & Mikro Kopya | WCAG AA kontrast, 48px dokunma alanları, klavye/focus yönetimi, TV Player durum göstergeleri | Faz 3 |

---

## 🧩 1. Kullanılabilirlik ve Sistem Kontrolü (Usability)

### 📌 UX-1.1: Native Tarayıcı `confirm()` Pencerelerinin Kaldırılması & Custom Onay Modalı
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/App.tsx` (satır 120, 128, 179, 220, 240, 255)
  - `client/src/components/ConfirmModal.tsx` *(yeni bileşen)*
- **Mevcut Durum:**
  - Ekran silme, medya silme, grup silme, playlist silme ve eşleştirme sıfırlamada tarayıcının çirkin, engellenemeyen ve mobil uyumsuz `window.confirm('...')` fonksiyonu kullanılıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Ortak `ConfirmModal` bileşeni oluşturulması (Tailwind modal, backdrop blur, Escape tuşu ile kapanma).
  - [x] Silinecek öğenin adı ve tipi modal metninde açıkça belirtilmeli (`"Zemin Kat Tanıtım" playlist'ini silmek istediğinize emin misiniz?`).
  - [x] Kritik ve geri dönüşü zor işlemler için buton rengi kırmızı (`bg-rose-600 hover:bg-rose-500`), ikincil buton "Vazgeç" (`bg-slate-800 text-slate-300`) olmalı.
  - [x] Odak (focus) varsayılan olarak "Vazgeç" butonunda başlamalı (yanlışlıkla Enter'a basılmasını önleme).
- **Mikro-Kopya (UX Writing):**
  - Başlık: `Medya Silme Onayı` / `TV Eşleştirmesini Sıfırla`
  - Açıklama: `Bu işlem sonucunda "X" medyası kütüphaneden kalıcı olarak silinecek ve kullanıldığı playlistlerden kaldırılacaktır. Bu işlem geri alınamaz.`
  - CTA Butonları: `Vazgeç` / `Evet, Kalıcı Olarak Sil`

---

### 📌 UX-1.2: Geri Alma (Undo) Özellikli Genişletilmiş Toast & Bildirim Sistemi
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/App.tsx` (satır 48-54)
  - `client/src/components/Toast.tsx` *(yeni veya geliştirilmiş bileşen)*
- **Mevcut Durum:**
  - `App.tsx` içinde sadece 4 saniyelik basit yeşil/kırmızı mesaj kutusu var. Geri alma seçeneği yok, işlem detayı verilmiyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Toast yapısına 4 tip desteği eklenmesi: `success` (yeşil), `error` (kırmızı), `warning` (sarı), `info` (mavi).
  - [x] Ekran/medya/playlist silme veya pasife alma işlemlerinde Toast içinde **"Geri Al" (Undo)** aksiyon butonunun yer alması (5-8 saniye süreyle).
  - [x] Kalan süreyi gösteren ince bir alt ilerleme çubuğu (progress bar) eklenmesi.
  - [x] Ekran okuyucular için `role="status"` ve `aria-live="polite"` etiketlerinin eklenmesi.
- **Mikro-Kopya (UX Writing):**
  - Başarı: `✓ "Lobi TV 1" başarıyla güncellendi.`
  - Hata: `✕ Sunucuya ulaşılamadı. Lütfen ağ bağlantınızı kontrol edin.`
  - Silme + Undo: `🗑️ "Haftalık Menü" playlisti silindi.` `[Geri Al]`

---

### 📌 UX-1.3: Anlık Sistem Geri Bildirimi (0.1s Tepki) & Buton Yükleme (Loading) Durumları
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx`
  - `client/src/pages/Dashboard.tsx`
  - `client/src/pages/Groups.tsx`
  - `client/src/pages/Playlists.tsx`
  - `client/src/components/PairScreenModal.tsx`
  - `client/src/components/MediaUploadModal.tsx`
- **Mevcut Durum:**
  - "Tüm TV'leri Yenile (Sync All)", "TV Yenile", "Hızlı Playlist Ata" ve "Grup Güncelle" butonlarına tıklandığında anlık görsel basılma efekti ve net bir yüklenme durumu (spinner/disabled) olmayan durumlar mevcut.
- **Hedef UX & Yapılacaklar:**
  - [x] Tüm interaktif butonlara basılma efekti için `active:scale-[0.98] transition-transform` sınıflarının eklenmesi.
  - [x] `onSyncScreen` ve `onSyncAll` işlemlerinde buton içine dönen ikon (`animate-spin`) ve `Senkronize ediliyor...` metni getirilmesi.
  - [x] İşlem sürerken butonun `disabled` yapılarak çift tıklama (double submit) ve gereksiz ağ yükünün önlenmesi.
- **Mikro-Kopya (UX Writing):**
  - Boşta: `Tüm TV'leri Yenile` → Tıklandığında: `Yenileniyor...`
  - Boşta: `Eşleştir` → Tıklandığında: `Bağlantı Kuruluyor...`
  - Boşta: `Kaydet` → Tıklandığında: `Kaydediliyor...`

---

### 📌 UX-1.4: Tasarım Dili ve Buton Hiyerarşisi Tutarlılığı
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/index.css`
  - Tüm sayfa ve modal dosyaları
- **Mevcut Durum:**
  - Bazı yerlerde `rounded-lg`, bazı yerlerde `rounded-xl`, bazı yerlerde `rounded-2xl` butonlar; kırmızı butonlarda ise kimi yerde `bg-red-950/40 text-red-400`, kimi yerde `text-slate-400 hover:text-red-400` gibi farklı renk ve dolgu stilleri kullanılıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] CSS bileşen sınıfları (`@layer components`) tanımlanarak standartlaştırılması:
    - **Primary CTA:** `btn-primary` (Örn: `bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold shadow-md shadow-sky-600/25 active:scale-95`)
    - **Secondary:** `btn-secondary` (Örn: `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium active:scale-95`)
    - **Destructive:** `btn-destructive` (Örn: `bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/60 rounded-xl active:scale-95`)
    - **Ghost / Icon:** `btn-ghost` (Örn: `p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg active:scale-90`)
  - [x] Tüm butonların font boyutu, padding oranı ve radius değerlerinin bu 4 sınıfa çekilmesi.

---

### 📌 UX-1.5: Bilişsel Yük Sınırı (Hick Yasası) & Kademeli Açılım (Progressive Disclosure)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx`
  - `client/src/components/ScheduleModal.tsx`
- **Mevcut Durum:**
  - `Screens.tsx` içinde her kart üzerinde çok sayıda buton (İzle, Düzenle, Eşleştir, Yayını Değiştir, Yenile, Eşleştirmeyi Kaldır, Sil) tek bakışta görünüyor.
  - `ScheduleModal.tsx` varsayılan yayın ile zamanlanmış yayın seçeneklerini aynı anda açık tutarak görsel kalabalık yaratıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] TV kartlarında en sık kullanılan 2 aksiyon ("Önizle", "Yenile") doğrudan görünür kalmalı; "Eşleştirmeyi Sıfırla", "Sil", "Ekran Adını Değiştir" gibi nadir kullanılan tehlikeli aksiyonlar "Daha Fazla İşlem" (`...` dropdown menüsü) altına toplanmalı.
  - [x] `ScheduleModal.tsx` içinde "Varsayılan (7/24 Sürekli) Yayın" seçildiğinde gün/saat maskesi gizlenmeli; "Zamanlanmış Yayın Kuralı Ekle" aktif edildiğinde gün ve saat seçicileri animasyonla açılmalı (Kademeli Açılım).

---

## 🧠 2. Navigasyon ve Bilgi Mimarisi (Findability)

### 📌 UX-2.1: Net Bilgi Kokusu ve Açıklayıcı CTA Metinleri
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/components/MediaUploadModal.tsx`
  - `client/src/components/PairScreenModal.tsx`
  - `client/src/components/PlaylistModal.tsx`
  - `client/src/components/ScheduleModal.tsx`
- **Mevcut Durum:**
  - Modal ve sayfalarda `"Kaydet"`, `"Ekle"`, `"Gönder"`, `"Tamam"` gibi bağlamsız genel eylem kelimeleri kullanılıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Genel fiiller yerine tıklandığında ne olacağını kesin olarak söyleyen net CTA metinlerine geçilmesi.
- **Dönüşüm Tablosu:**
  | Eski Buton Metni | Yeni Açıklayıcı CTA Metni | Bulunduğu Yer |
  |---|---|---|
  | `Kütüphaneye Ekle` | `Medyayı Kütüphaneye Yükle` | `MediaUploadModal.tsx` |
  | `Eşleştir` | `TV Ekranını Sisteme Bağla` | `PairScreenModal.tsx` |
  | `Playlisti Kaydet` | `Oynatma Listesini Güncelle / Oluştur` | `PlaylistModal.tsx` |
  | `Yayını Zamanla` | `Yayın Planını Ekrana Ata` | `ScheduleModal.tsx` |
  | `Yenile` | `Yayın Akışını Şimdi Ekrana Bas` | `Screens.tsx` |
  | `Sil` | `Ekranı Sistemden Kaldır` | `Screens.tsx` |

---

### 📌 UX-2.2: Konum Göstergesi (Breadcrumbs) ve Aktif Durum Vurgusu
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/components/Navbar.tsx`
  - `client/src/App.tsx`
  - Sayfa başlık üstleri
- **Mevcut Durum:**
  - Navbar üzerinde sekme vurgusu mevcut fakat alt sayfalar veya filtreler arası geçişte breadcrumb (ekmek kırıntısı) navigasyonu yok. Kullanıcı örneğin Screens tablosunda bir katı filtrelediğinde nerede olduğunu takip edemiyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Sayfaların üst kısmına dinamik Breadcrumb bileşeni eklenmesi:
    - Örn: `Yönetim Paneli > TV Ekranları > Zemin Kat (3 Ekran)`
    - Örn: `Yönetim Paneli > Medya Kütüphanesi > Yeni Görsel Yükle`
  - [x] Navbar menü öğelerinde aktif sekme için alt çizgi + yüksek kontrastlı metin + yumuşak arka plan kapsayıcısı (`bg-sky-500/10 text-sky-400 border-b-2 border-sky-500`).
  - [x] Klavye ile gezinirken aktif sekmenin `aria-current="page"` özniteliğini alması.

---

### 📌 UX-2.3: Akıllı Arama Çubuğu (Tüm Sayfalarda Tip-Toleranslı ve Kısayollu)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx` (mevcut basit arama)
  - `client/src/pages/Media.tsx` (şu an hiç arama yok!)
  - `client/src/pages/Playlists.tsx` (şu an hiç arama yok!)
  - `client/src/components/PlaylistModal.tsx` (medya seçicide arama yok!)
- **Mevcut Durum:**
  - `Media.tsx` ve `Playlists.tsx` sayfalarında arama kutusu hiç bulunmuyor. Medya sayısı arttığında aranan videoyu veya görseli bulmak zorlaşıyor.
  - `Screens.tsx` aramasında temizleme (clear X) butonu, kısayol tuşu ve sonuç sayısı göstergesi yok.
- **Hedef UX & Yapılacaklar:**
  - [x] `Media.tsx` sayfasına dosya adına, medya tipine ve etiketine göre filtreleyen arama çubuğu eklenmesi.
  - [x] `Playlists.tsx` sayfasına playlist adına göre filtreleyen arama çubuğu eklenmesi.
  - [x] `PlaylistModal.tsx` medya seçici sütununa hızlı medya arama kutusu eklenmesi.
  - [x] Tüm arama kutularına:
    - Yazı girildiğinde sağ tarafta tek tıkla temizleme `(X)` butonu,
    - Arama kutusuna hızlı odaklanma için `/` veya `Ctrl+K` kısayol ipucu (`kbd` rozeti),
    - Türkçe karakter tolere eden arama (`İ/i`, `I/ı`, `Ş/s` uyumlu).

---

### 📌 UX-2.4: Dinamik Filtreleme & Önceden Sonuç Sayısı Rozetleri
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx`
  - `client/src/pages/Media.tsx`
- **Mevcut Durum:**
  - `Screens.tsx` filtre butonları sadece metin yazıyor (`Tümü`, `Çevrimiçi`, `Çevrimdışı`, `Eşleşmemiş`). Kullanıcı o filtrede kaç ekran olduğunu tıklamadan göremiyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Filtre sekmelerinde parantez/rozet içinde dinamik sayı gösterilmesi:
    - `Tüm Ekranlar (10)`
    - `Çevrimiçi (8)` - Yeşil sayaç rozeti
    - `Çevrimdışı (2)` - Kırmızı sayaç rozeti
    - `Eşleşmemiş (1)` - Sarı sayaç rozeti
  - [x] `Media.tsx` sayfasına filtre sekmeleri eklenmesi:
    - `Tümü (24)`, `Görseller (14)`, `Videolar (6)`, `Web Sayfaları (4)`

---

### 📌 UX-2.5: Yönlendirici Aksiyon İçeren Boş Durumlar (Empty States)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx` (arama boş durumu)
  - `client/src/pages/Media.tsx`
  - `client/src/pages/Playlists.tsx`
  - `client/src/pages/Schedules.tsx`
- **Mevcut Durum:**
  - Arama yapıldığında ve sonuç bulunamadığında sadece soluk bir "Sonuç bulunamadı" yazısı çıkıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Her boş durum için 3 parçalı şablon uygulanması:
    1. İlgili gri/soluk ikon (Örn: `SearchX`, `TvMinimal`, `FolderX`),
    2. Hatanın/boşluğun net nedeni (`"Aramanızla eşleşen ekran bulunamadı"` veya `"Henüz bu kata ait bir TV eşleştirilmedi"`),
    3. Kullanıcıyı bir sonraki adıma geçiren doğrudan aksiyon butonu (`Aramayı Temizle` veya `+ Yeni TV Eşleştir`).
- **Mikro-Kopya (UX Writing):**
  - Başlık: `Arama Kriterine Uygun Medya Bulunamadı`
  - Açıklama: `"[aranan kelime]" ifadesine ait görsel veya video mevcut değil. Farklı bir kelime deneyebilir veya yeni dosya yükleyebilirsiniz.`
  - CTA Butonları: `Filtreyi Temizle` / `+ Yeni Medya Yükle`

---

## 📝 3. Form Tasarımı ve Hata Yönetimi (Forms & Errors)

### 📌 UX-3.1: Baştan Hata Önleme ve Ön Bilgilendirme Kuralları
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/components/MediaUploadModal.tsx`
  - `client/src/components/PairScreenModal.tsx`
  - `client/src/components/PlaylistModal.tsx`
  - `client/src/components/ScheduleModal.tsx`
- **Mevcut Durum:**
  - Dosya boyutu sınırı (maks. 200MB) veya desteklenen dosya formatları yalnızca drop alanının altında küçük puntoyla yazıyor; kullanıcı yanlış dosya yükleyip "Gönder" dediğinde sunucudan hata dönüyor.
  - Eşleştirme kodu girerken küçük harfle yazıldığında kullanıcı tereddüt yaşıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] `PairScreenModal.tsx`: Girilen kod anında `toUpperCase()` ile büyük harfe çevrilmeli, otomatik olarak 6 karaktere maskelenmeli ve geçersiz karakterler (`0, 1, O, I`) anında engellenmeli veya düzeltilmeli.
  - [x] `MediaUploadModal.tsx`: Dosya seçildiği anda tarayıcıda boyut kontrolü (`file.size > 200 * 1024 * 1024`) yapılmalı ve henüz sunucuya göndermeden anında uyarı verilmeli.
  - [x] `PlaylistModal.tsx`: Süre kutusuna 3 saniyeden az veya 3600 saniyeden fazla değer girildiğinde sınır uyarısı gösterilmeli.

---

### 📌 UX-3.2: Satır İçi (Inline) Doğrulama & Anlık Alan Kontrolü
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/components/PairScreenModal.tsx`
  - `client/src/components/PlaylistModal.tsx`
  - `client/src/components/ScheduleModal.tsx`
  - `client/src/pages/Login.tsx`
- **Mevcut Durum:**
  - Hatalar yalnızca formun "Gönder" butonuna basıldıktan sonra en tepede topluca kırmızı kutuda gösteriliyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Form alanlarına `onBlur` ve `onChange` doğrulaması eklenmesi.
  - [x] Kullanıcı input'tan çıktığı anda alanın altında ilgili hata mesajı ve input çevresinde kırmızı çerçeve (`border-rose-500 focus:border-rose-500 ring-rose-500/20`) gösterilmesi.
  - [x] Alan başarıyla doğrulandığında yeşil tik (`CheckCircle2`) göstergesi belirmesi.

---

### 📌 UX-3.3: İnsan Dilinde Yapıcı ve Çözüm Sunan Hata Mesajları (UX Writing)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/api.ts`
  - Modal hata yakalama blokları
- **Mevcut Durum:**
  - Sunucudan dönen ham hata mesajları (`fetch failed`, `P2002 Unique constraint failed`, `500 Internal Server Error`) kullanıcıya yansıtılabiliyor.
- **Hedef UX & Yapılacaklar:**
  - [x] API istemcisinde merkezi hata çevirici (`translateErrorMessage`) fonksiyonu oluşturulması.
  - [x] Tüm hata mesajlarının kullanıcıya ne olduğunu ve ne yapması gerektiğini anlatan 2 cümlelik yapıya kavuşturulması.
- **Dönüşüm Tablosu:**
  | Teknik Hata | Yeni İnsan Dili Mesajı (UX Writing) |
  |---|---|
  | `Network request failed` | `Sunucuya bağlanılamadı. Lütfen sunucunun açık ve yerel ağa bağlı olduğunu kontrol edin.` |
  | `Invalid pairing code` | `Girdiğiniz 6 haneli eşleştirme kodu bulunamadı. Lütfen TV ekranındaki kodu yenileyip tekrar deneyin.` |
  | `File too large` | `Seçtiğiniz dosya boyutu 200 MB sınırını aşıyor. Lütfen videoyu Handbrake ile sıkıştırıp tekrar yükleyin.` |
  | `Authentication failed` | `Kullanıcı adı veya parola hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.` |

---

### 📌 UX-3.4: Girilen Form Verilerini Koruma (State Preservation)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/components/PlaylistModal.tsx`
  - `client/src/components/MediaUploadModal.tsx`
  - `client/src/components/ScheduleModal.tsx`
- **Mevcut Durum:**
  - Form gönderimi sırasında ağ hatası oluştuğunda bazı durumlarda modal state'i sıfırlanabiliyor veya kullanıcının seçtiği liste temizleniyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Hata durumunda kullanıcının yazdığı isim, açıklama, süre ve seçtiği medya listesi hiçbir şekilde sıfırlanmamalı; form içeriği korunmalı.
  - [x] Yanlışlıkla modal dışına tıklanarak kapatılmayı önlemek için, formda değişiklik varsa (`dirty state`) kapatma öncesi onay sorulmalı veya modal dışı tıklama (`backdrop click`) pasife alınmalı.

---

### 📌 UX-3.5: Sabit ve Görünür Alan Etiketleri (Floating/Static Labels)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Login.tsx`
  - Tüm modal formları
- **Mevcut Durum:**
  - Bazı alanlarda sadece placeholder metinleri rehberlik ediyor; kullanıcı yazmaya başlayınca başlık kayboluyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Tüm form alanlarında input'un üstünde her zaman görünür sabit etiket (`<label className="block text-xs font-medium text-slate-300 mb-1.5">`) standardının zorunlu kılınması.
  - [x] Zorunlu alanlarda kırmızı yıldız `*` yerine veya yanında ekran okuyucular için `(Zorunlu)` yardımcı metni eklenmesi.
  - [x] Placeholder metinlerinin sadece örnek değer formatını göstermek için kullanılması (Örn: `Ör: 1. Kat Koridor TV`).

---

### 📌 UX-3.6: Doğru Mobil Klavye ve Input Tipi Tetiklemesi
- **Öncelik:** [P2] Mükemmellik
- **Etkilenen Dosyalar:**
  - `client/src/components/PairScreenModal.tsx`
  - `client/src/components/PlaylistModal.tsx`
  - `client/src/components/MediaUploadModal.tsx`
- **Hedef UX & Yapılacaklar:**
  - [x] TV Eşleştirme Kodu input'una `autoCapitalize="characters" autoCorrect="off" spellCheck={false}` özniteliklerinin eklenmesi.
  - [x] Süre (saniye) alanlarına `type="number" inputMode="numeric" min="3" pattern="[0-9]*"` eklenerek mobilde sayısal klavyenin açılması.
  - [x] URL giriş alanına `type="url" inputMode="url"` eklenerek `@`, `.`, `/` tuşlarının mobilde doğrudan klavyede belirmesi.

---

## ♿ 4. Erişilebilirlik ve Kapsayıcılık (Accessibility - WCAG 2.1 AA)

### 📌 UX-4.1: Renk Kontrastı Optimizasyonu (En Az 4.5:1)
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/index.css`
  - `client/src/components/Navbar.tsx`
  - `client/src/pages/Screens.tsx`
- **Mevcut Durum:**
  - Koyu zemin (`#0f172a` ve `#020617`) üzerinde kullanılan bazı `text-slate-500` (#64748b) ve `text-slate-600` metinleri kontrast testinde 3.5:1 seviyesinde kalıyor; bu durum loş ortamlarda veya düşük kontrastlı monitörlerde okunabilirliği düşürüyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Yardımcı ve ikincil gövde metinlerinin `text-slate-500` yerine minimum `text-slate-400` (#94a3b8 - 5.2:1 kontrast) seviyesine çekilmesi.
  - [x] Tıklanabilir ikonların ve pasif butonların gri tonlarının kontrol edilerek WCAG AA standartlarına uyarlanması.

---

### 📌 UX-4.2: Çoklu Görsel İpucu (Sadece Renkle Durum Belirtmeme Kuralı)
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx`
  - `client/src/components/Navbar.tsx`
  - TV Kartları Durum Rozetleri
- **Mevcut Durum:**
  - Ekranların çevrimiçi/çevrimdışı durumu bazı alanlarda sadece yeşil veya kırmızı küçük bir nokta ile gösteriliyor. Renk körü kullanıcılar (Protanopia/Deuteranopia) bu iki durumu ayırt etmekte zorlanıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Tüm durum göstergelerine rengin yanında **ayırt edici ikon ve net metin** eklenmesi:
    - **Çevrimiçi:** Yeşil nokta + `Wifi` ikonu + `"Çevrimiçi"` metni.
    - **Çevrimdışı:** Kırmızı nokta + `WifiOff` ikonu + `"Çevrimdışı (X dk önce)"` metni.
    - **Eşleşmemiş:** Sarı nokta + `Radio` ikonu + `"Eşleşme Bekliyor"` metni.
    - **Acil Durum:** Kırmızı yanıp sönen arka plan + `AlertTriangle` ikonu + `"ACİL YAYIN"` metni.

---

### 📌 UX-4.3: Klavye Navigasyonu ve Belirgin Focus Çerçeveleri (`focus-visible`)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/index.css`
  - Tüm sayfa buton ve kartları
- **Mevcut Durum:**
  - Tailwind'in varsayılan `focus:outline-none` sınıfı birçok yerde kullanılmış, ancak yerine görünür bir `focus-visible` ring verilmemiş. Fare kullanmadan `Tab` tuşuyla gezen kullanıcılar nerede olduklarını kaybediyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Global olarak `focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none` kuralının eklenmesi.
  - [x] Modal pencereler açıldığında klavye odağının modal içine hapsedilmesi (`focus trap`) ve `Escape` tuşuna basıldığında modalın kapanması.
  - [x] Sadece ikon içeren butonlara (Düzenle, Sil, Yenile, Kapat) ekran okuyucular için `aria-label="Bu ekranı sil"` özniteliğinin zorunlu eklenmesi.

---

### 📌 UX-4.4: Minimum Dokunma Alanı (Fitts Yasası - 48x48px Kuralı)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx`
  - `client/src/components/Navbar.tsx`
  - `client/src/components/PlaylistModal.tsx` (sıralama yukarı/aşağı butonları)
- **Mevcut Durum:**
  - TV listesi ve playlist tablosundaki bazı işlem butonları (küçük çöp kutusu, yukarı/aşağı oklar) 24x24px civarında. Dokunmatik ekranlarda veya tablette parmakla basmak zorlaşıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Dokunulabilir tüm düğme ve kontrollerin tıklama alanının (padding dahil) mobilde en az **44x44px - 48x48px** seviyesine çıkarılması (`min-w-[44px] min-h-[44px] flex items-center justify-center`).
  - [x] Yan yana duran butonlar arasına en az 8px (`gap-2`) boşluk konulması (Fitts Yasası gereği hatalı tıklamaları önleme).

---

## ⚡ 5. Performans, Hız ve Mobil Uyum (Speed & Responsiveness)

### 📌 UX-5.1: İskelet Ekranlar (Skeleton Screens) ile Algılanan Hızın İyileştirilmesi
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `client/src/App.tsx` (satır 284-288)
  - `client/src/components/skeletons/DashboardSkeleton.tsx` *(yeni)*
  - `client/src/components/skeletons/ScreensSkeleton.tsx` *(yeni)*
  - `client/src/components/skeletons/MediaSkeleton.tsx` *(yeni)*
- **Mevcut Durum:**
  - `App.tsx` içinde veri yüklenirken tüm ekran ortasında dönen tek bir çark (`w-8 h-8 animate-spin`) gösteriliyor. Kullanıcı sayfa yapısını algılayamıyor ve bekleme süresi uzun hissettiriyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Tekli spinner'ın kaldırılarak sayfa bazlı İskelet Ekran (Skeleton Screen) yapısına geçilmesi.
  - [x] Dashboard için 4 adet sayaç kutusu ve alt grafik iskeleti (`animate-pulse bg-slate-800/60 rounded-2xl`).
  - [x] Screens sayfası için 10 TV kartını taklit eden gri yükleme kartları.
  - [x] Medya sayfası için 4 sütunlu grid iskelet kartları.

---

### 📌 UX-5.2: Başparmak Bölgesi (Thumb Zone) ve Mobil Eylem Çubuğu
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/App.tsx`
  - `client/src/components/MobileBottomNav.tsx` *(yeni bileşen)*
- **Mevcut Durum:**
  - Mobil cihazlarda ekranlar veya medya sayfasına girildiğinde "+ Medya Ekle" veya "+ TV Eşleştir" butonları ekranın en üstünde kalıyor; tek elle kullanımda başparmağın ulaşması zorlaşıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Küçük ekranlarda (`sm:hidden`) ekranın altına sabitlenen (sticky bottom) bir Mobil Alt Navigasyon / Hızlı Eylem Çubuğu eklenmesi.
  - [x] En sık kullanılan aksiyonların (Ekranlar, Medya, Hızlı Eşleştir, Acil Durum) bu alt bara taşınması.

---

### 📌 UX-5.3: Sıfır Yatay Kaydırma (Zero Horizontal Scroll) Güvencesi
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Screens.tsx` (tablo görünümü)
  - `client/src/components/Navbar.tsx`
  - `client/src/components/PlaylistModal.tsx`
- **Mevcut Durum:**
  - `Screens.tsx` içindeki tablo modu (`viewMode === 'table'`) 375px mobil genişlikte sağa-sola taşma riski taşıyor; bazı modal pencereler dar ekranlarda kenarlardan taşıyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Tablo bileşenine yatay scroll kapsayıcısı (`overflow-x-auto -mx-4 px-4 sm:mx-0`) verilmesi veya mobilde tablo modunun otomatik olarak kart görünümüne (`cards`) evrilmesi.
  - [x] Modal pencerelerin mobilde `w-full max-w-lg m-2` padding sınırlarına tam oturmasının garanti edilmesi.

---

### 📌 UX-5.4: Medya Görselleri ve Küçük Resimlerde WebP / Tembel Yükleme (Lazy Loading)
- **Öncelik:** [P2] Mükemmellik
- **Etkilenen Dosyalar:**
  - `client/src/pages/Media.tsx`
  - `client/src/components/PlaylistModal.tsx`
- **Hedef UX & Yapılacaklar:**
  - [x] Medya kartlarındaki `<img>` etiketlerine `loading="lazy"` ve `decoding="async"` eklenmesi.
  - [x] Görsel yüklenene kadar kırık resim simgesi yerine yumuşak bir gri arka plan ve medya tipi ikonu gösterilmesi (`onError` yakalayıcı).

---

## 📖 6. Görsel Hiyerarşi ve Okunabilirlik (Typography & Layout)

### 📌 UX-6.1: Taranabilir Metin Yapısı (F-Kalıbı) & Bilgi Gruplama
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - `client/src/pages/Dashboard.tsx`
  - `client/src/pages/Screens.tsx`
- **Mevcut Durum:**
  - Dashboard'da sayaçlar ve ekran listesi eşit görsel ağırlıkta sunuluyor. Gözün ilk nereye odaklanacağı net değil.
- **Hedef UX & Yapılacaklar:**
  - [x] F-Kalıbına uygun hiyerarşik yerleşim:
    1. **Sol Üst:** Sistem Durum Özeti (Online TV sayısı / Acil Durum durumu),
    2. **Sağ Üst:** Hızlı Yayın Aksiyonları (Yükle → Playlist Yap → Ata),
    3. **Gövde:** Dikkat gerektiren çevrimdışı ekranlar ve son güncellenen içerikler.
  - [x] Metinlerde önemli durumların kalın (`font-semibold`) ve renkli rozetlerle öne çıkarılması.

---

### 📌 UX-6.2: Tek Baskın Birincil Aksiyon (Single Primary CTA per View)
- **Öncelik:** [P1] Yüksek
- **Etkilenen Dosyalar:**
  - Tüm sayfa başlıkları ve modallar
- **Hedef UX & Yapılacaklar:**
  - [x] Her ekranda yalnızca **1 adet** koyu mavi birincil buton (`bg-sky-600`) bulunmalı; diğer tüm butonlar ikincil (`bg-slate-800`) veya hayalet (`ghost`) stilde olmalıdır.
  - [x] Örnek Sayfa Eşleşmesi:
    - **Ekranlar Sayfası:** Birincil: `+ Yeni TV Eşleştir` | İkincil: `Tüm TV'leri Yenile`, `Filtreler`.
    - **Medya Sayfası:** Birincil: `+ Medya Yükle` | İkincil: `Arama`, `Filtre`.
    - **Playlist Sayfası:** Birincil: `+ Yeni Playlist Oluştur` | İkincil: `Düzenle`.
    - **Dashboard:** Birincil: `3. Yayına Ata` (Akışın son halkası).

---

### 📌 UX-6.3: İdeal Tipografi ve Satır Boyutu
- **Öncelik:** [P2] Mükemmellik
- **Etkilenen Dosyalar:**
  - `client/src/index.css`
- **Hedef UX & Yapılacaklar:**
  - [x] Gövde metinleri için minimum 14px-16px (`text-sm` / `text-base`) kuralının korunması, 10px-11px mikro metinlerin sadece teknik sayaç ve rozetlerde sınırlandırılması.
  - [x] Okuma bloklarında satır uzunluğunun 60-75 karakter arasında tutulması (`max-w-prose`).

---

## ❤️ 7. Duygusal UX, Güven ve TV Player Deneyimi

### 📌 UX-7.1: TV Kiosk Ekranında (Player) Gelişmiş Eşleştirme ve Bekleme Deneyimi
- **Öncelik:** [P0] Kritik
- **Etkilenen Dosyalar:**
  - `player/index.html`
  - `player/player.js`
  - `player/style.css`
- **Mevcut Durum:**
  - Eşleştirilmemiş TV'de 6 haneli kod gösteriliyor; ancak TV 4-5 metre mesafeden bakıldığında kodun harf aralığı ve okunabilirliği her ekranda ideal olmayabiliyor.
  - Ağ koptuğunda sol alttaki bildirim hapı küçük kalabiliyor.
- **Hedef UX & Yapılacaklar:**
  - [x] Eşleştirme kodunun yazı boyutunun büyütülmesi, harfler arasına net boşluk (`letter-spacing: 0.35em`) ve yüksek kontrastlı kutu tasarımı verilmesi.
  - [x] TV ekranında eşleştirme adımını anlatan 3 adımlı sade görsel infografik yerleştirilmesi:
    1. Bilgisayarınızdan panele girin,
    2. "Yeni TV Eşleştir" butonuna tıklayın,
    3. Ekrandaki kodu girin.
  - [x] Bekleme (idle) ekranında kurum logosu, saat ve tarih göstergesinin büyük puntolarla zarif bir şekilde konumlandırılması.

---

### 📌 UX-7.2: Mikro Etkileşimler ve Başarı Tatmini
- **Öncelik:** [P2] Mükemmellik
- **Etkilenen Dosyalar:**
  - `client/src/components/PairScreenModal.tsx`
  - `client/src/components/MediaUploadModal.tsx`
- **Hedef UX & Yapılacaklar:**
  - [x] TV başarıyla eşleştirildiğinde modal içinde 1.5 saniyelik yeşil onay animasyonu ve `"TV Başarıyla Bağlandı! Yayın başlatılıyor..."` geri bildirimi gösterildikten sonra modalın kapanması.
  - [x] Medya yüklendiğinde hafif bir başarı puls efekti verilmesi.

---

### 📌 UX-7.3: Karanlık Kalıplara (Dark Patterns) Sıfır Tolerans ve Şeffaflık
- **Öncelik:** [P0] Kritik
- **Hedef UX & Yapılacaklar:**
  - [x] Sistem kurum içi bir ürün olduğundan kullanıcıyı yanıltıcı hiçbir örtük işlem yapılmayacak.
  - [x] Bir playlist silindiğinde veya bir yayının saati değiştirildiğinde, bu yayının hangi TV'leri anında etkileyeceği açıkça belirtilmeli (`"Bu playlist silindiğinde Kat 1 ve Kat 2'deki TV'ler varsayılan yayına dönecektir"` uyarısı).

---

## 💡 Tasarımı Doğrulama Matrisi (5 Kontrol Sorusu)

Her yeni ekran veya özellik yayına alınmadan önce aşağıdaki 5 sorudan geçirilmelidir:

| # | Kontrol Sorusu | Doğrulama Kriteri | Durum |
|---|---|---|---|
| **1** | **"Şu an neredeyim?"** | Sayfa başlığı, aktif sekme vurgusu ve breadcrumb nerede olunduğunu 2 saniyede söylüyor mu? | [x] Doğrulandı |
| **2** | **"Burada ne yapabilirim?"** | Sayfanın ana CTA butonu (tek primary mavi buton) hemen göze çarpıyor mu? | [x] Doğrulandı |
| **3** | **"Buna tıklarsam ne olacak?"** | Buton metni ("Kaydet" yerine "Yayını TV'ye Ata") sürprize yer bırakmayacak kadar net mi? | [x] Doğrulandı |
| **4** | **"Yanlış bir şey yaparsam geri dönebilir miyim?"** | Silme ve değiştirme adımlarında Vazgeç/İptal ve Toast içinde "Geri Al" seçeneği var mı? | [x] Doğrulandı |
| **5** | **"Bu ekrandan neyi çıkarırsam anlam bozulmaz?"** | Gereksiz olan ikincil metinler, karmaşık filtreler ve tekrar eden ikonlar temizlendi mi? | [x] Doğrulandı |

---

## 🚀 Uygulama ve İlerleme Takip Çizelgesi

- [x] **Aşama 1 (P0): Sistem Geri Bildirimi & Güvenlik**
  - [x] `UX-1.1` Custom `ConfirmModal` yapılması ve native `confirm()`'lerin temizlenmesi
  - [x] `UX-1.2` Undo özellikli genişletilmiş Toast sistemi
  - [x] `UX-1.3` Butonlara anlık basılma efekti ve loading spinner durumları
  - [x] `UX-5.1` İskelet ekranların (Skeleton Screens) spinner yerine entegre edilmesi
  - [x] `UX-7.1` TV Player eşleştirme ekranı okunabilirlik geliştirmesi

- [x] **Aşama 2 (P1): Navigasyon, Arama, Filtreleme & Formlar**
  - [x] `UX-2.1` Tüm CTA metinlerinin açıklayıcı eylem fiilleriyle güncellenmesi
  - [x] `UX-2.2` Breadcrumb ve aktif menü göstergeleri
  - [x] `UX-2.3` Medya, Playlist ve Ekranlar için akıllı arama çubukları
  - [x] `UX-2.4` Filtre butonlarına sayaç rozetlerinin eklenmesi
  - [x] `UX-2.5` Aksiyon odaklı boş durum (Empty State) tasarımları
  - [x] `UX-3.1` ve `UX-3.2` Formlarda inline doğrulama ve ön bilgilendirmeler

- [x] **Aşama 3 (P2): Erişilebilirlik, Fitts Yasası & Mikro Deneyim**
  - [x] `UX-4.1` Renk kontrastlarının (4.5:1) denetlenmesi
  - [x] `UX-4.2` Çevrimiçi/çevrimdışı göstergelerine çoklu ipucu eklenmesi (ikon + metin)
  - [x] `UX-4.3` Görünür `focus-visible` çerçeveleri ve klavye navigasyonu
  - [x] `UX-4.4` Dokunma alanlarının minimum 48x48px yapılması
  - [x] `UX-7.2` Mikro etkileşimler ve başarı animasyonları

