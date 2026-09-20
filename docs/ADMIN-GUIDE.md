# Ferhat Academy — Admin Kullanım Kılavuzu

## 1. Yeni Eğitim (Kurs) Ekleme

### Adım 1 — Kursu Oluştur
1. Admin paneline gir → **Kurslar** → **"Kurs Oluştur"** butonuna tıkla
2. Doldurulacak alanlar:
   - **Slug (URL):** kurs linki — sadece küçük harf, tire kullan → `meta-ads-2025`
   - **Başlık (TR):** Türkçe başlık
   - **Başlık (EN):** İngilizce başlık (opsiyonel)
   - **Kısa Açıklama:** kart üzerinde görünen özet
   - **Uzun Açıklama:** detay sayfasında görünen açıklama
   - **Kapak Görseli URL:** bir görsel URL'si yapıştır (Unsplash, CDN, vb.)
3. **"Oluştur"** → kurs TASLAK olarak kaydedilir, henüz yayınlanmaz

### Adım 2 — Modül Ekle
Kurs oluşturulduktan sonra → **Modüller** sekmesi → **"Modül Ekle"**
- Modüller konulara göre bölümleri temsil eder
- Örnek: "Bölüm 1: Temel Kavramlar", "Bölüm 2: Kampanya Yapısı"
- Pozisyon (sıra) sürükle-bırak veya sayı ile ayarlanır

### Adım 3 — Ders Ekle
Her modülün altına → **"Ders Ekle"**

Ders türleri:
- **VIDEO** → YouTube, Vimeo veya Bunny.net
- **TEXT** → Metin tabanlı içerik (makale formatı)

**Video dersi için:**
- **Video Sağlayıcı:** `YOUTUBE` seç
- **Video ID:** YouTube linkindeki `v=` sonrasını yapıştır
  - `https://youtube.com/watch?v=dQw4w9WgXcQ` → ID: `dQw4w9WgXcQ`
  - `https://youtu.be/dQw4w9WgXcQ` → ID: `dQw4w9WgXcQ`
- **Görünürlük:**
  - `PUBLIC` → Herkese açık (ücretsiz önizleme)
  - `REGISTERED` → Kayıtlı kullanıcılar görebilir
  - `ENTITLED` → Sadece satın almış / erişim verilmiş kişiler
  - `PRIVATE` → Sadece admin görebilir
- **Ücretsiz Önizleme:** işaretlenirse kilit olmadan gösterilir

### Adım 4 — Yayınla
Kurs düzenleme sayfası → sağ üstte → **"Yayınla"** butonuna tıkla
- Yayınlanmadan önce en az 1 modül ve 1 ders olması önerilir
- Yayınlandıktan sonra `/tr/courses` sayfasında görünür

---

## 2. Eğitim Silme / Düzenleme

### Ders Silme
Admin → Kurslar → İlgili kurs → Modül → Dersin yanındaki **çöp kutusu** ikonu

### Modül Silme
Admin → Kurslar → İlgili kurs → Modülün yanındaki **çöp kutusu** ikonu
> ⚠️ Modülü silince içindeki tüm dersler de silinir

### Kursu Arşivle (Soft delete)
Kurs düzenleme → **"Arşivle"** → kurs gizlenir, silinmez, veriler korunur

---

## 3. Video Yükleme Seçenekleri

### YouTube (Önerilen — Ücretsiz)
- Videoyu **private** ya da **unlisted** olarak YouTube'a yükle
- Video ID'sini kopyala, derse yapıştır
- **Avantaj:** Sınırsız depolama, sıfır maliyet
- **Dikkat:** Unlisted videoları link bilen herkes açabilir (ama embed ile saklanabilir)

### Vimeo (Pro — Aylık ~$20)
- Vimeo Pro'da video gizleyebilir, sadece belirli domainlerde oynatabilirsin
- En iyi içerik koruma seçeneği
- Video ID'sini derse yapıştır

### Bunny.net (Ucuz CDN — Önerilen Pro seçenek)
- Video stream + CDN hizmeti, kullanım başına ücret (~$1/100GB)
- Ülkeye göre kısıtlama, watermark eklenebilir
- Video ID'sini derse yapıştır

---

## 4. Kullanıcıya Erişim Verme (Manuel)

1. Admin → **Kullanıcılar** → kullanıcıyı bul → **Detay**
2. **Erişim** sekmesi → **"Erişim Ver"**
3. Kaynak türü: `COURSE` veya `LESSON`
4. Kaynak: ilgili kursu seç
5. Süre: boş bırakırsan süresiz
6. **Kaydet** → kullanıcı o kursa anında erişebilir

---

## 5. Ürün ve Ödeme Akışı

```
Kullanıcı ürün sayfasını görür
  → "Satın Al" tıklar
  → Sipariş oluşur (FA-2025-XXXXXX)
  → Banka bilgileri gösterilir
  → Kullanıcı havalesi yapar
  → "Ödemeyi Yaptım" tıklar
  → Admin → Ödemeler → "Onayla" tıklar
  → Kullanıcı otomatik kursa erişim kazanır
```

Admin onaylama: **Admin → Ödemeler → REPORTED durumundaki ödeme → "Onayla"**

---

## 6. Başvuru Akışı (Mentörlük vb.)

```
Kullanıcı → "Başvur" → formu doldurur
  → Admin → Başvurular → formu inceler
  → "Onayla" → kullanıcı satın alma ekranına geçebilir
  → "Reddet" → kullanıcıya bildirilir
```

---

## 7. Sosyal Medya Linklerini Güncelleme

Admin → **Site Ayarları** → **Sosyal Medya Linkleri** bölümü
- Instagram, YouTube, LinkedIn, Twitter/X URL'lerini gir → Kaydet
- Hakkımda sayfası ve footer otomatik güncellenir

---

## 8. Canlı Görüşmeler (Şu An)

Şu an Zoom/Meet entegrasyonu yok. Süreç:
- Görüşme bağlantısını Zoom veya Google Meet'te oluştur
- Dashboard → Canlı Görüşmeler sayfasına veya e-posta ile kullanıcıya ilet
- İleride Zoom API entegrasyonu eklenebilir (Phase 04)

---

## Hızlı Referans

| İşlem | Adres |
|---|---|
| Kullanıcılar | `/tr/admin/users` |
| Kurslar | `/tr/admin/courses` |
| Ürünler | `/tr/admin/products` |
| Başvurular | `/tr/admin/applications` |
| Siparişler | `/tr/admin/orders` |
| Ödemeler | `/tr/admin/payments` |
| Site Ayarları | `/tr/admin/settings` |
| İşlem Geçmişi | `/tr/admin/audit-log` |
