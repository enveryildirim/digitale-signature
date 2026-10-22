# 🧹 Yönetici Paneli Sadeleştirme Planı (todo_ui.md)

`todo_ux.md` içindeki genel UX checklist'i tamamlandı. Bu belge bir sonraki adımı tanımlar: **aynı bilginin ve aynı aksiyonun birden çok yerde tekrarlanmasını** ortadan kaldırarak paneli 10 TV'lik bir kurum için sade ve hızlı hale getirmek.

> **İlke:** Her bilgi tek yerde, her aksiyon tek yerde. 10 TV'yi yöneten biri için en sık soru "Hangi TV ne gösteriyor?" — arayüz bu soruyu ilk bakışta cevaplamalı.
>
> **Kapsam dışı:** ADMIN/EDITOR rol yönetimi, kullanıcı yönetimi ekranı (şu an gereksiz karmaşıklık).

---

## 🧭 Hedef Bilgi Mimarisi

```
Önce:  [Genel Bakış] [TV Ekranları] [Katlar & Gruplar] [Medya] [Playlistler] [Zamanlama]  + breadcrumb
Sonra: [Ekranlar] [Medya] [Playlistler] [Zamanlama]                                 🚨 Acil Durum
```

- **Ekranlar** ana sayfadır; Genel Bakış (uyarılar, kat haritası) ve Katlar & Gruplar (oluştur/yeniden adlandır/sil) buraya taşınır.
- Her TV tek satır: durum · ad · şu an oynayan · yayın seçimi · detay.
- Detay penceresi (canlı önizleme + ayarlar + kalıcı link + cihaz bilgisi + tehlikeli işlemler) eski "Ayarlar" ve "Canlı Önizleme" modallarının yerini alır.

---

## Faz 1 — Temel ve Navigasyon

- [x] Ortak UI bileşenleri: `Modal`, `EmptyState`, `SearchInput`, `FilterChips` (`client/src/components/ui/`).
- [x] Ortak biçimlendirme yardımcıları: `formatLastSeen`, `formatDuration` (`client/src/utils/format.ts`).
- [x] Modal kabukları ortak `Modal` bileşenine taşındı (Esc, başlık, kapat butonu, footer tek yerde).
- [x] Sekmeler 6 → 4; aktif sekme URL hash'inde (`#media`) — yenilemede korunur, tarayıcı geri tuşu çalışır.
- [x] Breadcrumb kaldırıldı (tek seviyeli uygulamada sekmeyle aynı bilgiyi tekrarlıyordu).
- [x] Navbar'daki "Tüm TV'leri Yenile" (Ekranlar sayfasında zaten var) ve "TV Player Aç" (yöneticinin tarayıcısında sahte "Bekleyen TV" kaydı üretiyordu) kaldırıldı.
- [x] Buton tipografisi `text-xs` → `text-sm`; dropdown seçeneklerindeki emojiler kaldırıldı.

## Faz 2 — Ekranlar Sayfası

- [x] Genel Bakış ve Katlar & Gruplar sayfaları Ekranlar'a birleştirildi.
- [x] Tek görünüm (3 görünüm modu → 1): kat bölümleri + kompakt TV satırları.
- [x] Kat başlığında: çevrimiçi sayısı, kat yayını seçimi, yeniden adlandır, sil. "Kat Ekle" sayfa başlığında.
- [x] Gruba atanmamış TV'ler ayrı bölümde görünür (eski Genel Bakış'ta hiç görünmüyordu).
- [x] Çevrimdışı TV ve eşleşme bekleyen TV uyarı bantları; bekleyen kayıtlar tek tıkla eşleştirilir veya yoksayılır (silinir).
- [x] `ScreenDetailModal`: canlı önizleme + ad/kat düzenleme + kalıcı link + cihaz bilgisi + yenile/sıfırla/sil.
- [x] Önizleme iframe'inin her 10 sn'lik veri yenilemesinde baştan yüklenmesi hatası giderildi.
- [x] Grup açıklama alanı arayüzden kaldırıldı (DB kolonu korunuyor).

## Faz 3 — "Şu An Ne Oynuyor ve Neden?"

- [ ] `GET /api/screens` yanıtına manifest resolver'dan aktif playlist + kaynak (`SCREEN_DEFAULT` / `GROUP_DEFAULT` / `SCHEDULED` / `EMERGENCY`) ve bitiş saati eklenmesi.
- [ ] TV satırında `▶ Playlist · Zamanlı (18:00'e kadar)` gösterimi; istemcideki `getScreenPlaylistInfo` tahmini kaldırılmalı (bugün zamanlanmış yayını görmüyor).
- [ ] Admin paneli için WebSocket ile anlık TV durum güncellemesi; 10 sn'lik tam veri polling'inin kaldırılması.

## Faz 4 — Zamanlama

- [ ] Varsayılan yayın yalnızca Ekranlar sayfasından seçilir; Zamanlama modalından "7/24 Varsayılan" seçeneği kaldırılır.
- [ ] Zamanlama sayfası yalnızca saatli kuralları hedefe göre gruplu listeler.
- [ ] Plan düzenleme (`PUT /api/assignments/:id` zaten mevcut).
- [ ] Kampanya tarih aralığı (`startDate` / `endDate` backend'de destekli, arayüzde yok).

## Faz 5 — İçerik (Medya & Playlist)

- [x] Playlist kartında tek düzenle aksiyonu; boş açıklama yer tutucuları kaldırıldı.
- [x] Medya tip rozetleri Türkçe (Görsel / Video / Web).
- [ ] Playlist ve medya kartlarında "kullanıldığı yerler" (hangi TV / kat / playlist).
- [ ] Çoklu dosya yükleme (sürükle-bırak ile birden çok dosya).
- [ ] Playlist modalı içinden yeni medya yükleme.
- [ ] Hazır acil durum şablonları (Yangın / Tahliye / Deprem).
