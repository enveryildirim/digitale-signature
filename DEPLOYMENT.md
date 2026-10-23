# Canlı Yayın Rehberi (VDS + Dokploy)

Bu belge, dijital bilgi ekranı sisteminin (Express + SQLite, `main` dalı) bir VDS üzerinde **Dokploy** ile nasıl yayınlandığını ve bakımının nasıl yapıldığını anlatır.

- **Sunucu:** Datacasa İstanbul VDS · 4 GB RAM · 40 GB NVMe · Ubuntu 24.04 LTS
- **Yayın:** Dokploy (Docker Swarm + Traefik), repodaki `Dockerfile` ile
- **HTTPS:** Traefik + Let's Encrypt. TV oynatıcısının Service Worker'ı yalnızca HTTPS'te çalışır, bu yüzden HTTPS zorunludur.

Aşağıdaki komutlarda `<SUNUCU_IP>` yerine VDS'in IP adresini, `sizindomain.com` yerine kendi domain'inizi yazın.

---

## 1. Sunucu hazırlığı (tek seferlik)

### 1.1 Bağlanma ve güncelleme

```bash
ssh root@<SUNUCU_IP>

apt update && apt upgrade -y
apt install -y curl git ufw fail2ban

# Zamanlama motoru sunucu saatini kullanır
timedatectl set-timezone Europe/Istanbul
```

### 1.2 Swap (4 GB RAM'de build sırasında bellek yetmezliğini önler)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 1.3 Dokploy kurulumu

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Kurulum 2–5 dakika sürer; 80, 443 ve 3000 portlarının boş olması gerekir.

> ⚠️ Kurulum biter bitmez `http://<SUNUCU_IP>:3000` adresini açıp **admin hesabını oluşturun**. Bu sayfayı ilk açan kişi admin olur. Ardından profil ayarlarından **2FA**'yı açın.

### 1.4 Panel domain'i

1. DNS'te iki **A kaydı** ekleyin:
   - `panel.sizindomain.com` → `<SUNUCU_IP>`
   - `tv.sizindomain.com` → `<SUNUCU_IP>`
2. Dokploy → **Settings → Web Server → Server Domain**: `panel.sizindomain.com`, sertifika **Let's Encrypt**.

### 1.5 SSH ve firewall güvenliği

**Mac'te** anahtar oluşturup sunucuya kopyalayın:

```bash
ssh-keygen -t ed25519            # anahtarınız varsa atlayın
ssh-copy-id root@<SUNUCU_IP>
```

**Yeni bir terminalde** şifresiz girişin çalıştığını doğruladıktan sonra **sunucuda**:

```bash
echo "PasswordAuthentication no" > /etc/ssh/sshd_config.d/00-hardening.conf
systemctl restart ssh

ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

passwd    # sağlayıcı panelinde görünen root şifresini değiştirin
```

> **Not:** Docker, UFW kurallarını atlar; 3000 portu UFW'ye rağmen açık kalır. Kapatmak için sağlayıcı panelindeki firewall'u kullanın. Yoksa güçlü parola + 2FA ile koruyun.

### 1.6 Disk temizliği

40 GB disk, eski Docker imajlarıyla dolabilir. Dokploy → **Settings → Server → Daily Docker Cleanup** seçeneğini açın.

---

## 2. Uygulamanın Dokploy'a eklenmesi (tek seferlik)

1. **GitHub bağlantısı:** Settings → Git → GitHub → uygulamayı kurun, `digitale-signature` reposuna izin verin.
2. **Proje:** Projects → **Create Project** (`signage`) → **Create Service → Application**.
3. **General sekmesi:**
   - Provider: **GitHub** · Repository: `digitale-signature` · Branch: **`main`** · Build Path: `/`
   - Build Type: **Dockerfile** · Docker File: `Dockerfile`
4. **Environment sekmesi:**
   ```
   JWT_SECRET=<sunucuda `openssl rand -hex 32` çıktısı>
   ADMIN_PASSWORD=<güçlü bir parola>
   ```
   İkisi de zorunludur; biri eksikse sunucu açılmaz. `NODE_ENV`, `PORT`, `TZ`, `DATABASE_URL` ve `UPLOAD_DIR` imajda tanımlıdır.
5. **Advanced → Volumes / Mounts:** İki **Volume Mount** ekleyin.

   | Volume adı | Mount Path | İçerik |
   |---|---|---|
   | `signage-data` | `/app/data` | SQLite veritabanı |
   | `signage-uploads` | `/app/uploads` | Yüklenen görsel ve videolar |

   > ⚠️ Volume tanımlanmazsa her deploy'da tüm veriler silinir.
6. **Domains sekmesi:** Host `tv.sizindomain.com` · Container Port **3001** · HTTPS açık · Certificate **Let's Encrypt**.
7. **Deploy**'a basın. Logs sekmesinde `Sunucusu Başlatıldı` satırı görününce sistem hazırdır.

### Adresler

| | Adres |
|---|---|
| Admin paneli | `https://tv.sizindomain.com` (kullanıcı `admin`, parola `ADMIN_PASSWORD`) |
| TV oynatıcısı | `https://tv.sizindomain.com/player` |
| Sağlık kontrolü | `https://tv.sizindomain.com/api/health` |

TV'lerdeki kiosk ayarlarında (`kiosk-setup/`) açılan adres, yukarıdaki HTTPS oynatıcı adresi olmalıdır.

---

## 3. Container açılışında ne olur?

1. `prisma db push --skip-generate` veritabanı şemasını oluşturur veya günceller. Veri kaybettirecek bir şema değişikliğinde açılış durur. Bu durumda değişikliği elle ele alın.
2. Seed çalışır: `admin` hesabı yoksa `ADMIN_PASSWORD` ile oluşturulur, hiç grup yoksa 5 varsayılan kat grubu eklenir.
3. Sunucu 3001 portunda açılır.

---

## 4. Günlük işletim

### Güncelleme

`main` dalına push edilen her commit Dokploy tarafından otomatik olarak build edilip yayınlanır. Elle yayınlamak için uygulama sayfasındaki **Deploy** butonunu kullanın.

Push öncesi yerelde şu komutları çalıştırın:

```bash
npm run test:scheduler && npm run test:api && npm run test:load && npm run build
```

### Admin parolasını değiştirme / sıfırlama

Arayüzde parola değiştirme ekranı yoktur. Parolanın tek kaynağı `ADMIN_PASSWORD` değişkenidir:

1. Dokploy → uygulama → **Environment** → `ADMIN_PASSWORD` değerini değiştirin.
2. **Deploy**'a basın. Açılışta parola yeni değerle güncellenir (logda `Yönetici parolası ADMIN_PASSWORD ile güncellendi`).

`JWT_SECRET` değiştirilirse tüm açık oturumlar sonlanır ve yeniden giriş gerekir.

### Dokploy panel parolasını sıfırlama

```bash
ssh root@<SUNUCU_IP>
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Names}}"
# IMAGE sütunu dokploy/dokploy olan satırın ID'si (postgres/redis/traefik değil)
docker exec -it <container-id> bash -c "pnpm run reset-password"
# 2FA'yı kapatmak için:
docker exec -it <container-id> bash -c "pnpm run reset-2fa"
```

Komut rastgele bir parola yazar; girişten sonra profil ayarlarından değiştirin.

### Loglar

Dokploy → uygulama → **Logs** (çalışma logları) ve **Deployments** (build logları).

### Yedekleme

Veriler iki Docker volume'unda tutulur. Volume adlarını doğrulayın:

```bash
docker volume ls | grep signage
```

Günlük yedek için sunucuda:

```bash
mkdir -p /root/backups
crontab -e
```

ve şu satırı ekleyin (her gece 03:00, son 7 gün saklanır):

```
0 3 * * * docker run --rm -v signage-data:/data:ro -v signage-uploads:/uploads:ro -v /root/backups:/backup alpine tar czf /backup/signage-$(date +\%F).tar.gz /data /uploads && find /root/backups -name 'signage-*.tar.gz' -mtime +7 -delete
```

Yedekleri sunucu dışına da kopyalayın (ör. Mac'ten `scp root@<SUNUCU_IP>:/root/backups/*.tar.gz .`). Sağlayıcı panelinde snapshot özelliği varsa onu da açın.

**Geri yükleme:** Dokploy'da uygulamayı durdurun (**Stop**), ardından:

```bash
docker run --rm -v signage-data:/data -v signage-uploads:/uploads -v /root/backups:/backup alpine \
  sh -c "rm -rf /data/* /uploads/* && tar xzf /backup/signage-YYYY-AA-GG.tar.gz -C /"
```

Sonra uygulamayı yeniden başlatın (**Deploy**).

---

## 5. Sorun giderme

| Belirti | Olası neden / çözüm |
|---|---|
| Container hemen kapanıyor, logda `Eksik ortam degiskeni` | `JWT_SECRET` veya `ADMIN_PASSWORD` tanımlı değil (Environment sekmesi). |
| Her deploy sonrası ekranlar/medya kayboluyor | Volume mount'lar eksik veya yolları yanlış (`/app/data`, `/app/uploads`). |
| Build sırasında `Killed` / bellek hatası | Swap tanımlı değil (Bölüm 1.2). |
| Sertifika alınamıyor | DNS A kaydı henüz yayılmadı veya yanlış IP'yi gösteriyor; `dig tv.sizindomain.com` ile kontrol edin. |
| TV offline çalışmıyor | Oynatıcı HTTP üzerinden açılmış; Service Worker için HTTPS adresi kullanılmalı. |
| Yayınlar yanlış saatte başlıyor | Container saatini kontrol edin: `docker exec <container> date` (GMT+0300 olmalı). |
| Disk doluyor | Daily Docker Cleanup açık mı? `docker system df` ile kontrol edin; eski yedekleri temizleyin. |

---

## Notlar

- Firebase (sunucusuz) sürümü `firebase` dalında saklanmaktadır; bu rehber yalnızca `main` dalı içindir.
- Yereldeki `docker-compose.yml` dosyası Dokploy dışında (ör. yerel test) kullanım içindir ve aynı ortam değişkenlerini ister:
  ```bash
  JWT_SECRET=dev-secret ADMIN_PASSWORD=dev-parola docker compose up --build
  ```
