# Yapay Zeka Ajanları ve Geliştiriciler İçin Çalışma Yönergesi (AGENTS.md)

Bu dosya, bu repoda çalışan tüm yapay zeka ajanlarının (AI agents, LLM assistants) ve yazılımcıların uymakla yükümlü olduğu temel kuralları, hafıza yönetimini ve geliştirme standartlarını tanımlar.

---

## 🚨 1. KURAL: PROJECT_MEMORY.md Güncelleme Zorunluluğu

Her ajan, bu depoda herhangi bir geliştirme, refactoring, hata düzeltmesi veya mimari değişiklik yaptığında **MUTLAKA** `PROJECT_MEMORY.md` dosyasını güncellemelidir:

1. **Yeni Bir Özellik Eklendiğinde:**
   - İlgili bileşenin mimarisini ve eklenen uç noktaları/modelleri `PROJECT_MEMORY.md` içindeki ilgili bölüme ekleyin.
   - `Geliştirici & Ajan Notları (Changelog)` bölümüne tarih, yapılan işlem ve etkilenen dosyaları listeleyin.
2. **Bir Hata Düzeltildiğinde veya Değişiklik Yapıldığında:**
   - Sorunun ne olduğunu ve nasıl çözüldüğünü `PROJECT_MEMORY.md` changelog'una kaydedin.
3. **Testler Koşturulduğunda:**
   - Test sonuçlarını ve varsa performans metriklerini güncelleyin.

> **Önemli:** `PROJECT_MEMORY.md` dosyasını güncellemeden hiçbir görevi tamamlandı (`DONE`) olarak işaretlemeyin.

---

## 🎯 2. Temel İlkeler ve Kod Standartları

### 2.1 Pareto Prensibi (80/20)
- Bu sistem kurum içi bir üründür (SaaS veya çok kiracılı ticari bir platform değildir).
- Aşırı karmaşık tasarım kalıplarından (over-engineering) kaçının.
- Odak noktamız: **10 TV'nin kurum içinde kesintisiz, sıfır bakımla ve sorunsuz yayın yapmasıdır**.

### 2.2 TV Player İstemcisi Kutsaldır (`player/`)
- TV Player (`player/index.html`, `player.js`, `style.css`, `sw.js`), TV'lerde aylarca kapatılmadan çalışacaktır.
- **Kesinlikle ağır harici kütüphaneler (React, Vue, lodash vb.) eklemeyin.** Player saf ES6 JavaScript olarak kalmalıdır (<20 KB).
- **Service Worker / Cache Storage API** yapısını asla bozmayın; internet/ağ kesildiğinde yayının durmaması en kritik başarı kriteridir.
- Çift tamponlu (Slot A & Slot B) pürüzsüz geçişi ve `wakeLock` desteğini koruyun.

### 2.3 Yerel Ağ (LAN) ve Sıfır Dış Bağımlılık
- Sistem kapalı bir kurumsal ağda çalışacak şekilde tasarlanmıştır.
- CDN'lerden harici font, script veya stil çekmeyin; tüm kaynaklar yerel sunucu üzerinden paketlenmeli ve sunulmalıdır.
- Veritabanı SQLite WAL modundadır ve tek dosyadır (`data/signage.db`).

---

## 🧪 3. Doğrulama ve Test Komutları

Bir görevi bitirmeden önce aşağıdaki komutların tamamının hatasız çalıştığını teyit edin:

```bash
# 1. Zamanlama ve Çakışma Motoru Birim Testi
npm run test:scheduler

# 2. REST API ve Eşleştirme Entegrasyon Testi
npm run test:api

# 3. 10 TV Eşzamanlı Yük ve Anlık Sync Simülasyonu
npm run test:load

# 4. Tam Proje Derleme (Server TypeScript + Client Vite)
npm run build
```

---

## 📝 4. Changelog Giriş Formatı (PROJECT_MEMORY.md için)

Yeni bir kayıt eklerken aşağıdaki formatı kullanın:

```markdown
- **[YYYY-AA-GG] - [Ajan / Geliştirici]:**
  - **Yapılan İş:** [Özet açıklama]
  - **Değiştirilen Dosyalar:** `path/to/file1.ts`, `path/to/file2.tsx`
  - **Doğrulama:** [Koşturulan testler ve sonuçları]
```

