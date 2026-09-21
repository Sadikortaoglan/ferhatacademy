# Hostinger Deployment Checklist — Ferhat Academy

Adım adım Hostinger'a ilk kurulum.

---

## Ön Hazırlık

- [ ] Hostinger Node.js hosting planı aktif (Cloud Startup veya üzeri önerilir)
- [ ] GitHub reposu: `https://github.com/Sadikortaoglan/ferhatacademy.git`
- [ ] Deploy branch: `main`
- [ ] PostgreSQL sağlayıcısı hazır (Supabase önerilir — ücretsiz)
- [ ] Resend.com hesabı açıldı, API key alındı
- [ ] Domain: `ferhatacademy.com` DNS erişimi mevcut

---

## 1. Veritabanı Kurulumu (Supabase)

- [ ] supabase.com → New Project oluştur
- [ ] Settings → Database → Connection String → **URI** kopyala (bu `DATABASE_URL`)
- [ ] Settings → Database → Connection String → **Direct connection** kopyala (bu `DIRECT_URL`)
- [ ] İki URL'yi bir yere not al (bir sonraki adımda gireceksin)

---

## 2. Hostinger — GitHub Bağlantısı

- [ ] Hostinger Panel → Hosting → Node.js → Create Application
- [ ] GitHub reposu: `Sadikortaoglan/ferhatacademy`
- [ ] Branch: `main`
- [ ] Node.js version: **22.x**
- [ ] Package manager: **pnpm**

---

## 3. Hostinger — Build Ayarları

| Alan | Değer |
|---|---|
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Root directory | `/` |
| Output directory | `.next` |

---

## 4. Environment Variables

Hostinger → Environment Variables bölümüne şunları ekle:

```
DATABASE_URL=postgresql://...    (Supabase pooled URL)
DIRECT_URL=postgresql://...      (Supabase direct URL)
BETTER_AUTH_SECRET=              (openssl rand -base64 48 ile üret)
BETTER_AUTH_URL=https://ferhatacademy.com
NEXT_PUBLIC_APP_URL=https://ferhatacademy.com
NODE_ENV=production
RESEND_API_KEY=re_xxxx
EMAIL_FROM=Ferhat Academy <noreply@ferhatacademy.com>
ADMIN_NOTIFY_EMAIL=info@ferhatacademy.com
```

> ⚠️ `SEED_*` değişkenlerini production'a EKLEME.

---

## 5. İlk Deploy

- [ ] Hostinger → Deploy butonuna bas
- [ ] Build logunu izle — hata yoksa devam et
- [ ] Temporary URL ile uygulamayı aç (örn: `https://ferhatacademy.hostingerapp.com`)

---

## 6. Veritabanı Migration

Build başarılıysa terminal/SSH üzerinden:

```bash
pnpm prisma migrate deploy
```

Hostinger SSH erişimi varsa doğrudan çalıştır.  
Yoksa Hostinger → Node.js → Run Command alanına yaz.

- [ ] Migration çalıştı, hata yok
- [ ] `/api/health` → `{"status":"ok","db":"connected"}` döndü

---

## 7. İlk Admin Hesabı

- [ ] Uygulamayı aç → `/tr/register` ile hesap oluştur
- [ ] Supabase Studio → `User` tablosu → `role` kolonunu `SUPER_ADMIN` yap
- [ ] `/tr/admin` sayfasına gir — admin paneli görünüyor olmalı

> ⚠️ `pnpm db:seed` çalıştırma — bu dev verisi oluşturur.

---

## 8. Domain Bağlama

- [ ] Temporary URL'de smoke test geçti (login, admin panel, ödeme akışı)
- [ ] Hostinger → Domains → `ferhatacademy.com` ekle
- [ ] DNS: A kaydını Hostinger IP'sine yönlendir (veya Hostinger nameserver kullan)
- [ ] SSL sertifikası otomatik aktif oldu (Let's Encrypt)

---

## 9. Production Smoke Test

Şunları elle test et:

- [ ] `https://ferhatacademy.com` açılıyor
- [ ] `https://ferhatacademy.com/api/health` → `{"status":"ok"}`
- [ ] Login / Register çalışıyor
- [ ] Admin paneli açılıyor
- [ ] Kurs sayfası açılıyor
- [ ] Test ödeme bildirimi gönder → mail geliyor (Resend dashboard'dan kontrol et)

---

## 10. Rollback Prosedürü

Sorun olursa:

1. Hostinger → Deployments → Önceki başarılı deploy'u seç → Redeploy
2. Veritabanı için: Supabase → Database Backups → Restore (otomatik günlük yedek)

---

## Önemli Notlar

- `pnpm db:seed` **production'da çalıştırılmaz**
- `.env` dosyası commit'e dahil değil — Hostinger env variables kullan
- Upload'lar `public/uploads/` klasörüne kaydediliyor — Hostinger persistent disk olduğu sürece güvenli
- Birden fazla instance açarsan upload'lar kaybolabilir (şu an tek instance yeterli)
