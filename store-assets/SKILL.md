---
name: store-assets
description: >-
  Author and update App Store & Google Play STORE-LISTING content and assets as
  code for an Expo/EAS app. Use when writing or editing listing text and media —
  iOS EAS Metadata `store.config.json` (per-locale title, subtitle, promo text,
  description, keywords, marketing/support/privacy URLs, categories, age-rating
  advisory flags, screenshot maps) and Android Fastlane `supply` metadata
  (`fastlane/metadata/android/<locale>/title.txt`, `short_description.txt`,
  `full_description.txt` + `images/` icon, feature graphic, phone/tablet
  screenshots). Covers character limits, valid App Store locale codes, screenshot
  and feature-graphic sizes, app icon rules, ASO screenshot order and captions,
  and how store/ assets are excluded from the app bundle via `.easignore`. This
  is the CONTENT-authoring side; the CI/CD pipeline that PUSHES this content to
  the stores lives in the `store-deploy` skill (jobs `metadata_ios` /
  `metadata_android`, its "Mod D"). Triggers: store listing, app store metadata,
  store.config.json, EAS metadata, fastlane supply, feature graphic, screenshots,
  app icon size, keywords, ASO, promo text.
---

# store-assets — Mağaza listeleme içeriğini KOD olarak yazma

Expo/EAS bir uygulamanın App Store ve Google Play **listeleme metni + görsellerini**
sürüm kontrollü dosyalar olarak yazmak/güncellemek için rehber ve şablonlar.

## 1) Amaç ve sınır

- Bu skill **içeriği ÜRETİR**: başlık, açıklama, anahtar kelime, kategori, yaş
  değerlendirmesi, ekran görüntüsü/görsel boyutları. Metni ve görselleri repo içinde
  dosya olarak hazırlarsın.
- **İçeriği mağazaya PUSH etmek bu skill'in işi değildir.** Push işini `store-deploy`
  skill'i yapar — CI job'ları `metadata_ios` (EAS `eas metadata:push`) ve
  `metadata_android` (`fastlane supply`), o skill'de "Mod D" olarak geçer.
- **Platform ayrımı:** EAS Metadata (`store.config.json`) **yalnızca Apple/App Store
  Connect** içindir. Google Play'in EAS Metadata karşılığı yoktur → Play listelemesi
  **Fastlane `supply`** ile `fastlane/metadata/android/` ağacından yönetilir. İki
  platform iki ayrı kaynak: metni değiştirdiğinde İKİSİNİ de güncelle.

Şablonlar: `templates/store.config.json`, `templates/fastlane/metadata/android/...`.
Yeni projeye kurarken bunları kopyala, `{{...}}` yer tutucularını doldur.
Doldurulacak placeholder'lar: `{{APP_STORE_TITLE}}`, `{{APP_STORE_SUBTITLE}}`,
`{{APP_STORE_DESCRIPTION}}`, `{{APP_STORE_KEYWORDS}}`, `{{APP_STORE_PROMO}}`,
`{{MARKETING_URL}}`, `{{SUPPORT_URL}}`, `{{PRIVACY_URL}}`, `{{COPYRIGHT}}`.
Şablondaki `tr` / `tr-TR` blokları kaynak projeden alınmış **gerçek doldurulmuş
örnektir** (2048 Efsane Yolu) — yapıyı göster diye bırakıldı; kendi metninle değiştir
ya da tek dil kullanıyorsan sil.

## 2) iOS — `store.config.json` (EAS Metadata)

Kök projede `store.config.json` (veya `eas.json` → `submit`/`metadata` yolu). Alanlar:

**`apple.info.<locale>` (dil başına):**

| Alan | Açıklama | Limit |
|---|---|---|
| `title` | Uygulama adı | **30 karakter** |
| `subtitle` | Alt başlık | **30 karakter** |
| `promoText` | Tanıtım metni (sürümsüz güncellenebilir) | **170 karakter** |
| `description` | Tam açıklama | **4000 karakter** |
| `keywords` | Dizi; ASC'ye **virgülle birleşik** gider | Birleşik toplam **100 karakter** (virgüller dahil) |
| `marketingUrl` / `supportUrl` / `privacyPolicyUrl` | URL'ler | geçerli http(s) |

**Locale kodları:** İngilizce için geçerli olanlar `en-US`, `en-GB`, `en-AU`,
`en-CA`. **`en-UK` GEÇERSİZDİR** (yaygın hata → lint/push patlar; İngiltere = `en-GB`).
Türkçe kodu iOS'ta `tr` (bölgesiz). `info` altındaki her anahtar geçerli bir ASC
locale kodu olmalı — açıklama amaçlı sahte anahtar (`_comment` vb.) koyma, lint reddeder.

**`apple.copyright`** → `{{COPYRIGHT}}` (ör. "Appa Fly Tech").
**`apple.version`** → mağaza sürüm etiketi. **`apple.release.automaticRelease`** →
onaydan sonra otomatik yayın.

**`categories`:** `[[ birincil, altkat1, altkat2 ], ikincil]` yapısı. Örnek oyun:
`[["GAMES","GAMES_PUZZLE","GAMES_STRATEGY"], "ENTERTAINMENT"]`.

**`advisory`:** yaş değerlendirmesi bayrakları. Çoğu alan `"NONE"`, bazıları boolean
(`gambling`, `lootBox`, `unrestrictedWebAccess`, `advertising`, `userGeneratedContent`
...). Reklam gösteriyorsan `advertising: true`. Tüm alan adlarını şablondaki gibi
koru (Apple şeması bekliyor); yanlış/eksik alan push'ta hata verir.

**`screenshots` haritası:** locale altında cihaz anahtarı → dosya yolu dizisi.
Kullanılan anahtarlar: `APP_IPHONE_67` (6.9" iPhone) ve `APP_IPAD_PRO_3GEN_129`
(13" iPad). Yollar repo içindeki `store/apple/screenshot/<locale>/<KEY>/...png`
dosyalarını gösterir.

> **Önemli uyarı — ekran görüntüsü push'u:** EAS Metadata'nın ekran görüntüsü yükleme
> desteği kırılgandır; birçok kurulumda `store.config.json`'daki `screenshots`
> haritası yalnızca metinle push edilmez, görseller **App Store Connect'e ayrıca**
> yüklenir (elle sürükle-bırak ya da `fastlane deliver`). Yani bu harita bir kayıt/
> referанс görevi görür; gerçek yükleme için `docs/store-assets.md` → "Yükleme"
> bölümüne ve `store-deploy` Mod D'ye bak.

## 3) Android — Fastlane `supply` metadata düzeni

```
fastlane/metadata/android/<locale>/
  title.txt               # max 30
  short_description.txt    # max 80
  full_description.txt     # max 4000
  images/
    icon.png              # 512×512
    featureGraphic.png    # 1024×500  (ZORUNLU)
    phoneScreenshots/     # 1080×1920, min 2 max 8
    sevenInchScreenshots/ # 7" tablet (opsiyonel)
    tenInchScreenshots/   # 10" tablet (opsiyonel)
```

- **Locale dizin adı** Play kodu ile birebir: `en-US`, `tr-TR` (Android her zaman
  bölge ekli tam kod ister — iOS'un `tr`'sinden farklı).
- Ayrıntılı kurallar: `templates/fastlane/metadata/android/README.md`.

## 4) Görseller (kaynak: `docs/store-assets.md`)

**App Store (iOS) zorunlu boyutlar**

| Varlık | Boyut | Zorunlu? |
|---|---|---|
| App ikonu | 1024×1024 (köşesiz, alpha yok) | Evet (ASC'de) |
| iPhone 6.9" | **1290×2796** dikey | **Evet** — en az 1, en fazla 10 |
| iPad 13" | 2064×2752 | Yalnızca `ios.supportsTablet: true` ise **zorunlu** |

> Apple 2024+ tek zorunlu set = **6.9" iPhone**. `app.json`'da `supportsTablet: true`
> ise iPad 13" seti de zorunlu → ya iPad görsellerini ekle ya tablet desteğini kapat.

**Play Store (Android) zorunlu boyutlar**

| Varlık | Boyut | Zorunlu? |
|---|---|---|
| App ikonu | 512×512 (32-bit PNG) | Evet |
| Feature graphic | **1024×500** | Evet |
| Telefon ekran görüntüsü | 1080×1920, min 2 max 8 | Evet |
| 7"/10" tablet | — | Tablet hedefliyorsan |

**Ham kare yakalama**

```bash
# iOS Simulator (6.9" için iPhone 16 Pro Max)
npx expo run:ios --device "iPhone 16 Pro Max"
xcrun simctl io booted screenshot ~/Desktop/shot-01.png   # 1290×2796 verir

# Android emülatör
adb exec-out screencap -p > shot-01.png
```

Ham kareyi cihaz çerçevesi + üst başlık ile pazarlanabilir hale getir (Figma /
AppMockup / Previewed, ya da otomasyon için `fastlane frameit` + `deliver`).

> **Görselleri otomatik üretmek → `store-screenshots` skill'i.** Projenin ekranlarını
> (`src/*Screen.js`) inceleyip hangi ekranların çekileceğini + üstündeki başlığı
> `screenshots.config.js`'e yazar, ham kareyi cihaz çerçevesi + başlıkla mağaza
> boyutunda görsele dönüştürür ve buradaki `store/` + `fastlane/images/` ağacına
> boyuta göre yerleştirir (store.config.json screenshots haritasını da yamalar).

**ASO — ekran görüntüsü sırası & başlıklar.** İlk 2 görsel en kritik (kullanıcı
aramada yalnızca onları görür); faydayı büyük yaz, başlık ≤5 kelime kalın font.
Örnek sıra: 1) mod listesi/hero, 2) oyun + power-up, 3) Neon tema, 4) RPG rütbeleri,
5) engel/özel taşlar, 6) lider tablosu & başarımlar. İlk kareye "REKLAMSIZ" /
"TAMAMEN TÜRKÇE" gibi ayrıştırıcı rozet koy. Play feature graphic (1024×500): logo +
uygulama adı + birkaç tema önizlemesi.

**App ikonu.** `assets/icon.png` (1024×1024) üret, `app.json` → `expo.icon` ile bağla.
Android adaptive icon için `assets/adaptive-icon.png` (foreground) + `backgroundColor`.

## 5) `.easignore` — neden `store/` ve `fastlane/` hariç

EAS build arşivine mağaza görselleri girmemeli (~100+ MB gereksiz yük). `.easignore`
VARSA EAS `.gitignore`'u dikkate almaz → `.gitignore`'daki her şeyi burada tekrarla,
ayrıca listeleme varlıklarını ekle:

```
fastlane/      # Play metadata — yalnızca metadata/submit CI job'larında (git checkout) gerekir
store/         # Apple ekran görüntüleri — uygulama derlemesi için gereksiz
```

Bu klasörler CI'da git checkout üzerinden okunur (Mod D), uygulama derlemesine girmez.

## 6) Doğrulama

- **Karakter limiti kontrolü** (push'tan önce, kaynak proje kökünde çalıştır):
  ```bash
  # iOS: title/subtitle ≤30, promoText ≤170, keywords birleşik ≤100
  node -e 'const c=require("./store.config.json");for(const[l,i]of Object.entries(c.apple.info)){const k=(i.keywords||[]).join(",");console.log(l,"title",i.title?.length,"subtitle",i.subtitle?.length,"promo",i.promoText?.length,"desc",i.description?.length,"kw",k.length)}'
  # Android: title ≤30, short ≤80, full ≤4000
  for f in fastlane/metadata/android/*/title.txt; do echo "$f $(wc -m < "$f")"; done
  ```
- **`eas metadata:lint`** → şema/locale hatalarını yakalar (ör. `en-UK`, eksik advisory
  alanı). Push öncesi çalıştır.
- **`eas metadata:pull` DİKKAT:** ASC'deki mevcut değerleri çeker ve yerel
  `store.config.json`'u **ÜZERİNE YAZAR** — elle yazdığın metni kaybedebilirsin. Pull'u
  yalnızca ASC'yi kaynak kabul ettiğinde kullan; aksi halde repo'daki dosya kaynaktır.
- **Push:** bu skill push ETMEZ. Yayınlamak için `store-deploy` skill'i, Mod D
  (`metadata_ios` / `metadata_android` job'ları). Metni güncelledikten sonra oraya geç.

## İlgili skill'ler

- **`store-deploy`** — bu içeriği mağazalara push eden CI/CD (jobs `metadata_ios`,
  `metadata_android`; "Mod D"), iOS/Android EAS local build ve tag ile sürüm kesme.
- **`wappa-games-template`** — Expo oyun şablonu; bu listeleme dosyaları o proje
  iskeletinin parçası olarak gelir.
