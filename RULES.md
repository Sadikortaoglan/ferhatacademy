# Claude Code — Kalıcı Kurallar

Bu dosya production güvenliği, git disiplini ve geliştirme standartları için kalıcı kuralları içerir.
Silinmez, değiştirilmez. Her konuşmada geçerlidir.

---

## 1. GIT / DEPLOY DİSİPLİNİ

### Commit & Push
- `git commit` veya `git push` — kullanıcının açık onayı olmadan ASLA çalıştırma
- Kod değişikliği yapıldıktan sonra "commit edeyim mi?" diye sor, onaydan sonra commit yap
- Commit'ten sonra "push edeyim mi?" diye sor, onaydan sonra push yap
- Push yaparken her zaman söyle: hangi branch push edildi, hangi branch'e merge edilecek

### Main Branch
- `main` branch'e ASLA doğrudan push etme
- `git checkout main`, `git merge`, `git push origin main` — kullanıcı açıkça söylemedikçe yasak
- Kullanıcı "kodu pushla" dese bile sadece feature branch'e push yap, main'e değil

---

## 2. PRODUCTION VERİTABANI GÜVENLİĞİ

### Yasak İşlemler — Asla Yapma
- Production DB'ye karşı `prisma db push` çalıştırma
- `prisma migrate reset` çalıştırma
- Ham destructive SQL çalıştırma (DROP TABLE, DELETE FROM, TRUNCATE)
- Production veriyi silme: users, orders, applications, content
- Asenovo veya QR Menu veritabanlarına bağlanma
- `docker compose down`, volume silme, global prune çalıştırma
- Asenovo veya QR Menu container'larını durdurma/yeniden başlatma/değiştirme

### Production'da İşlem Yapmadan Önce
1. Backup al
2. `--dry-run` ile test et
3. Sonucu kullanıcıya göster
4. Kullanıcı onayı al
5. Ancak ondan sonra gerçek çalıştırma yap

### Sahte/Test Veri Yasağı
- Fake testimonial, fake satış rakamı, fake instructor oluşturma
- Fake IBAN veya banka hesap bilgisi ekleme
- Fiyat uydurma
- E2E test fixture'larını production'a kopyalama

---

## 3. TEST ZORUNLULUĞU

Her anlamlı feature, fix, refactor veya business-rule değişikliği için test yaz.

- unit test → pure functions
- integration test → real DB (Testcontainers)
- component test → RTL
- E2E → Playwright (kritik akışlar)
- Prisma, entitlement resolution, grant materialization mock'lama
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — commit/merge öncesi geçmeli

---

## 4. KOD STİLİ

- Yorum satırı yazma (neden değil ne açıklayan yorumlar kesinlikle yasak)
- Scope'u gereksiz büyütme — istenen iş ne ise o kadar yap
- Error handling sadece gerçek boundary'lerde (user input, external API)
- Mevcut pattern'lere uy, gereksiz abstraction kurma
- UI değişikliklerini browser'da test et

---

## 5. GÜVENLIK

- XSS, SQL injection, command injection oluşturma
- Kullanıcı inputunu server'da validate et
- Credentials ve secret'ları commit'leme
- `--no-verify` ile hook'ları atlama

---

## 6. NEXT.JS / MİMARİ

- Next.js 16 App Router — API, convention ve file structure training data'dan farklı olabilir
- Kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili dökümantasyonu oku
- `revalidateTag(tag, profile)` — 2 argüman zorunlu (Next.js 16)
- `unstable_cache` — cross-request cache; `React.cache()` sadece single-request dedupe
- `"use cache"` directive — `cacheComponents: true` gerektirir (bu projede kapalı)
