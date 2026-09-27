# Güvenlik Denetim Raporu — Ferhat Academy

**Tarih:** 2026-09-27  
**Kapsam:** `src/app/api/`, `src/features/`, `src/server/`, `src/lib/`  
**Araçlar:** Semgrep (auto ruleset), manuel kod incelemesi  
**Bulunan toplam sorun:** 6 (1 kritik yanlış pozitif, 2 orta, 3 düşük/bilgi)

---

## Özet Tablosu

| # | Dosya | Sorun | Ciddiyet | Durum |
|---|-------|-------|----------|-------|
| 1 | `upload/route.ts` | Path traversal — Semgrep uyarısı (false positive) | ⚠️ Orta | Açıklama ekle |
| 2 | `applications/templates/actions.ts` | IDOR — reorder fonksiyonları sahiplik kontrolü yapmıyor | ⚠️ Orta | Düzelt |
| 3 | `appointments/actions.ts` + `applications/actions.ts` | Rate limiting yok (public endpoint) | ℹ️ Düşük | Dışarıda çöz |
| 4 | `website/navigation/actions.ts` | NavItem `href` alanı URL doğrulaması yok | ℹ️ Düşük | Düzelt |
| 5 | `about/actions.ts` | `heroImageUrl` / gallery URL doğrulaması yok | ℹ️ Düşük | Düzelt |
| 6 | `products/[productId]/actions.ts` | TOCTOU — silme öncesi bağımlı kayıt sayımı | ℹ️ Bilgi | Kabul edilebilir |

---

## 1. Path Traversal — Upload Route (Semgrep Uyarısı)

**Dosya:** `src/app/api/upload/route.ts:108`  
**Ciddiyet:** ⚠️ Orta (Semgrep uyarısı — pratikte false positive)  
**CWE:** CWE-22 — Path Traversal  
**OWASP:** A01:2021 Broken Access Control

### Ne Tespit Edildi
Semgrep, kullanıcı girdisinin `path.join()` içine geçtiğini saptadı:
```typescript
const filename = `${randomUUID()}.${ext}`;  // ext = SAFE_MIME_EXT[declaredMime]
await writeFile(join(uploadsDir, filename), optimized);
```

### Neden False Positive
`ext` değeri kullanıcıdan doğrudan gelmez. Akış şöyle:
1. `declaredMime = file.type.toLowerCase()` → kullanıcıdan gelir
2. `SAFE_MIME_EXT[declaredMime]` → **hardcoded lookup** — sadece `"jpg"`, `"png"`, `"webp"`, `"gif"`, `"avif"` döner
3. Eğer `declaredMime` whitelist'te değilse fonksiyon 400 döner, hiç `ext` hesaplanmaz

`SAFE_MIME_EXT` içinde path separator (`/`, `\`, `..`) içeren değer yok. `randomUUID()` de sistem üretimi, kullanıcı kontrolünde değil. **Gerçek path traversal riski yok.**

### Neden Yine de İşaretlendi
Semgrep taint analysis yapıyor: `file.type` → `declaredMime` → `safeExt` → `filename` → `join()`. `SAFE_MIME_EXT` lookup'unun tüm olası çıktılarının güvenli olduğunu kanıtlamak statik analiz için zor.

### Önerilen Düzeltme
Kodu false positive için daha savunmacı hale getir — ext'i explicit whitelist'e pin'le:

```typescript
const SAFE_EXTENSIONS = new Set(["jpg", "png", "webp", "gif", "avif"]);

// upload öncesi:
const ext = SAFE_MIME_EXT[declaredMime];
if (!ext || !SAFE_EXTENSIONS.has(ext)) {
  return NextResponse.json({ error: "Geçersiz dosya uzantısı." }, { status: 400 });
}
```

### Değişiklik Etkileri
- Sadece `upload/route.ts` — başka hiçbir dosya etkilenmez
- Yükleme davranışı aynı kalır
- Semgrep uyarısı ortadan kalkar

---

## 2. IDOR — Reorder Fonksiyonlarında Sahiplik Kontrolü Yok

**Dosya:** `src/app/[locale]/admin/applications/templates/actions.ts`  
**Ciddiyet:** ⚠️ Orta  
**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key  
**OWASP:** A01:2021 Broken Access Control

### Ne Tespit Edildi
`reorderQuestions`, `reorderOptions`, `reorderSteps` fonksiyonları yalnızca admin kontrolü yapıyor, ancak gelen ID'lerin ilgili template/question'a ait olduğunu doğrulamıyor:

```typescript
// Sorunlu kod:
export async function reorderQuestions(locale: string, templateId: string, orderedIds: string[]) {
  await requireAdmin(locale);
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.applicationQuestion.update({ where: { id }, data: { position: idx } })
    )
  );
  // templateId hiç kullanılmıyor!
```

### Saldırı Senaryosu
Kötü niyetli veya ele geçirilmiş bir admin hesabı, `orderedIds` içine başka bir template'in soru ID'lerini ekleyebilir. Bu, farklı template'lerin sorularının `position` değerlerini bozabilir.

```
POST /reorderQuestions
templateId: "template_A"
orderedIds: ["question_from_template_B", "question_from_template_C"]
→ Template B ve C'nin soruları position 0, 1 olarak güncellenir
```

### Çözüm
ID'lerin doğru parent'a ait olduğunu doğrula:

```typescript
export async function reorderQuestions(locale: string, templateId: string, orderedIds: string[]) {
  await requireAdmin(locale);
  // Sahiplik doğrulaması ekle
  const owned = await prisma.applicationQuestion.findMany({
    where: { id: { in: orderedIds }, templateId },
    select: { id: true },
  });
  if (owned.length !== orderedIds.length) throw new Error("Geçersiz soru ID'leri");
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.applicationQuestion.update({ where: { id }, data: { position: idx } })
    )
  );
}
```
`reorderOptions` ve `reorderSteps` için de aynı kontrol uygulanmalı.

### Değişiklik Etkileri
- Sadece `templates/actions.ts` — 3 fonksiyon düzenlenir
- Admin UI davranışı değişmez (normalde doğru ID'ler gönderilir)
- Yanlış ID gönderilirse artık hata fırlatılır
- Performans: ek DB sorgusu per reorder işlemi (düşük etki — reorder nadir yapılır)

---

## 3. Rate Limiting Yok — Public Endpoint'ler

**Dosyalar:**  
- `src/features/appointments/actions.ts` → `createAppointmentRequest`  
- `src/features/applications/actions.ts` → `submitDynamicApplication`  
**Ciddiyet:** ℹ️ Düşük  
**CWE:** CWE-770 — Allocation of Resources Without Limits

### Ne Tespit Edildi
`createAppointmentRequest` herkese açık (giriş yapmadan çağrılabilir). `submitDynamicApplication` giriş gerektiriyor ama oturum başına sınırlama yok. Her ikisi de:
- Email gönderimi tetikliyor (Resend API maliyeti)
- DB'ye kayıt yazıyor
- Admin bildirimi oluşturuyor

### Saldırı Senaryosu
```
for i in 1..1000:
  POST /api/server-action createAppointmentRequest({name: "spam", email: "test@...})
→ 1000 bildirim e-postası, 1000 admin notification, Resend kota aşımı
```

### Çözüm
Next.js middleware katmanında veya endpoint başında IP bazlı rate limiting ekle. Önerilen: `@upstash/ratelimit` (Redis gereksiz, Vercel KV veya Upstash):

```typescript
// middleware.ts veya action başında
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 randevu/dk per IP
});
```

Alternatif olarak Cloudflare/Nginx seviyesinde `/api/` endpoint'leri için rate limiting uygulanabilir — bu daha basit ve kod değişikliği gerektirmez.

### Değişiklik Etkileri
- `appointments/actions.ts` ve `applications/actions.ts` etkilenir
- Redis/Upstash bağımlılığı gerekir (veya infra seviyesinde çözülürse kod değişmez)
- Meşru kullanıcılar limit dahilinde etkilenmez

---

## 4. NavItem `href` Alanı URL Doğrulaması Yok

**Dosya:** `src/app/[locale]/admin/website/navigation/actions.ts`  
**Ciddiyet:** ℹ️ Düşük  
**CWE:** CWE-79 — XSS / CWE-601 — URL Redirect

### Ne Tespit Edildi
`navItemSchema`'da `href` alanı sadece `z.string().min(1)` — herhangi bir URL kabul ediyor:

```typescript
const navItemSchema = z.object({
  href: z.string().min(1),   // "javascript:alert(1)" geçiyor
  ...
});
```

Eğer navigasyon linkleri `<a href={item.href}>` şeklinde render ediliyorsa ve XSS filtresi yoksa, `javascript:` protokolü çalışabilir. Next.js `<Link>` bileşeni `javascript:` URL'leri bloklar ancak ham `<a>` tag'ı kullanılıyorsa risk var.

### Çözüm
```typescript
const navItemSchema = z.object({
  href: z.string().min(1).refine(
    (v) => v.startsWith("/") || v.startsWith("https://") || v.startsWith("http://"),
    "Geçersiz URL. / veya https:// ile başlamalı."
  ),
  ...
});
```

### Değişiklik Etkileri
- `navigation/actions.ts` — sadece `navItemSchema`
- Admin UI'da hata mesajı gösterilir (zod validation)
- Mevcut kayıtlar etkilenmez — sadece yeni/güncelleme işlemleri kontrol eder

---

## 5. About Sayfası URL Alanları Doğrulaması Yok

**Dosya:** `src/app/[locale]/admin/about/actions.ts`  
**Ciddiyet:** ℹ️ Düşük  
**CWE:** CWE-79 — XSS

### Ne Tespit Edildi
`saveAboutHero`, `saveAboutGallery` fonksiyonları `heroImageUrl` ve gallery URL'lerini doğrulamadan DB'ye yazıyor. Değerler `SiteSetting` tablosunda `value` sütununda text olarak saklanıyor ve frontend'de muhtemelen `<img src={...}>` veya `style="background-image: url(...)"` olarak kullanılıyor.

```typescript
// heroImageUrl: string — format kontrolü yok
await upsert("about.heroImageUrl", data.heroImageUrl);
```

### Risk Değerlendirmesi
- `<img src="javascript:...">` → modern tarayıcılar bu vektörü çalıştırmaz ✓
- CSS `background-image: url("javascript:...")` → modern tarayıcılar çalıştırmaz ✓
- `data:text/html,...` → `<img>` içinde çalışmaz ✓
- **Gerçek risk:** Dış domain'den görsel çekilmesi (privacy leakage, hotlinking). Eğer URL admin dışından değiştirilebilseydi daha kritik olurdu.

### Çözüm
```typescript
function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true; // local upload
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function saveAboutHero(data: { heroImageUrl: string; ... }) {
  await requireAdmin("tr");
  if (!isAllowedImageUrl(data.heroImageUrl)) throw new Error("Geçersiz görsel URL");
  ...
}
```

### Değişiklik Etkileri
- `about/actions.ts` — yardımcı fonksiyon + kontrol eklenir
- `appearance/actions.ts` içindeki benzer alanlar da incelenmeli
- Admin UI davranışı aynı kalır

---

## 6. TOCTOU — deleteProductById Silme Yarış Koşulu

**Dosya:** `src/app/[locale]/admin/products/[productId]/actions.ts`  
**Ciddiyet:** ℹ️ Bilgi (teorik)  
**CWE:** CWE-367 — TOCTOU Race Condition

### Ne Tespit Edildi
```typescript
// Kontrol:
const [orderCount, applicationCount] = await Promise.all([...]);
if (orderCount > 0 || applicationCount > 0) return { ok: false, reason: "..." };

// ← Buraya kadar başka bir istek yeni order/application oluşturabilir

// Silme:
await prisma.product.delete({ where: { id: productId } });
```

Kontrol ile silme arasında (milisaniyeler) başka bir kullanıcı sipariş veya başvuru oluşturabilir. Teorik olarak bağımlı kayıt bulunurken ürün silinebilir.

### Gerçek Risk
Prisma'nın ürettiği SQL'de `onDelete: Cascade` yok `Application.product` ve `OrderItem.product` ilişkilerinde — yani silme denemesi FK constraint hatası verir. Veritabanı seviyesinde korumalı. **Pratik risk yok.**

### Çözüm (İsteğe Bağlı)
Transaction içinde sil:

```typescript
await prisma.$transaction(async (tx) => {
  const [orderCount, appCount] = await Promise.all([
    tx.orderItem.count({ where: { productId } }),
    tx.application.count({ where: { productId } }),
  ]);
  if (orderCount > 0 || appCount > 0) throw new Error("DEPENDENCY_EXISTS");
  await tx.product.delete({ where: { id: productId } });
});
```

### Değişiklik Etkileri
- `products/[productId]/actions.ts` — `deleteProductById` fonksiyonu
- Hata mesajı `try/catch` ile yakalanmalı, `DEPENDENCY_EXISTS` error mesajı client'a iletilmeli
- Güvenlik artışı minimal, kod okunabilirliği biraz artar

---

## Genel Güçlü Yanlar

Aşağıdaki güvenlik önlemleri doğru şekilde uygulanmış:

| Alan | Uygulama |
|------|----------|
| Authentication | `requireAdmin(locale)` tüm admin action'larında var |
| SQL Injection | Prisma ORM parametrik sorgular kullanıyor — raw SQL yok |
| CSRF | Next.js Server Actions Origin header doğrulaması yapıyor |
| Upload MIME | Magic byte + whitelist çift kontrol |
| Upload dosya adı | `randomUUID()` — orijinal isim hiç kullanılmıyor |
| Rol değişikliği | Son SUPER_ADMIN koruması DB seviyesinde |
| Session invalidation | Rol değişimi ve ban işlemlerinde tüm sessionlar siliniyor |
| Input validation | Zod şemaları tüm kritik action'larda mevcut |
| Başvuru tekrarı | `userId_productId` unique constraint — çift başvuru engeli |
| Audit log | Kritik işlemlerde (rol değişimi, ürün oluşturma, ban) yazılıyor |

---

## Öncelik Sırası

1. **Hemen** → #2 IDOR reorder (5 dakika, 3 fonksiyon)
2. **Bu sprint** → #4 NavItem href validation, #5 About URL validation
3. **Sonraki sprint** → #3 Rate limiting (infra veya kod)
4. **Belgeleme** → #1 Upload path traversal (false positive açıklaması inline comment)
5. **Kabul** → #6 TOCTOU (FK constraint zaten koruyor)
