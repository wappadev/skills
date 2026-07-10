---
name: store-screenshots
description: >-
  Generate App Store & Google Play MARKETING SCREENSHOTS (device-framed, captioned
  ad-style slides) for an Expo/EAS game and place them into this repo's store-assets
  layout — fully in code, no external editor required. Recommended flow: inspect the
  game's screens (src/*Screen.js) to decide which to capture and what caption goes on
  each, fill `screenshots.config.js`, capture raw frames from a running
  simulator/emulator (`capture-screens.js`), then `build-screenshots.js` composites
  gradient background + bold caption + rounded device-framed screenshot at exact store
  sizes, and `place-screenshots.js` routes each PNG by dimension into the right place:
  iOS `store/apple/screenshot/<locale>/APP_IPHONE_67/` (1290×2796) and
  `APP_IPAD_PRO_3GEN_129/` (2064×2752), Android
  `fastlane/metadata/android/<locale>/images/phoneScreenshots/` (1080×1920),
  `featureGraphic.png` (1024×500) and `icon.png` (512×512); optionally patches the
  `store.config.json` screenshots map. Alternatively wraps the external
  `app-store-screenshots` visual editor (ParthJadhav/app-store-screenshots) and places
  its ZIP export. All scripts self-bootstrap sharp (no project dep; text via SVG system
  fonts). Use when creating/refreshing store screenshots, feature graphic, or preview
  images for a game; when raw captures need marketable framed captioned slides; or when
  screenshots must land in the store/ + fastlane/ trees the store-assets & store-deploy
  skills expect. This is the IMAGE side; listing TEXT is `store-assets`, pushing to
  stores is `store-deploy`. Before capturing, ads MUST be off — temporarily make the
  banner component `return null` and don't trigger interstitial/app-open, then revert
  (`git checkout`); stores reject screenshots that show ads. Triggers: app store
  screenshots, ekran görüntüsü üret, mağaza görselleri, ss oluştur, otomatik görsel,
  reklamsız ekran görüntüsü, banner return null, no ads in screenshots, marketing
  screenshots, feature graphic, device frame, screenshot caption, app-store-screenshots,
  önizleme görselleri.
---

# store-screenshots — Mağaza pazarlama görsellerini üret ve store-assets'e yerleştir

Bir Expo/EAS oyununun App Store ve Google Play **pazarlama ekran görüntülerini**
(cihaz çerçeveli, başlıklı, reklam-stili slaytlar) üretir ve dışa aktarılan PNG'leri
bu repo'nun store-assets düzenine doğru boyut/ada yerleştirir.

## 1) Amaç ve sınır

- Bu skill **GÖRSEL üretir + yerleştirir**: cihaz çerçeveli, başlıklı ekran görüntüleri +
  feature graphic → doğru klasör ve boyutta repo'ya yazılır. **Dış editöre gerek yok**;
  başlık/çerçeve/arka plan/boyutlandırma tümü kodla (sharp) yapılır.
- **Neyi otomatikleştirir, neyi değil:**
  - ✅ Hangi ekranlar + üstündeki başlık kararı → ajan (Claude) `src/*Screen.js`'i okuyup
    `screenshots.config.js`'i doldurur.
  - ✅ Çerçeve + başlık + arka plan + tam mağaza boyutu + yerleştirme → betikler.
  - ⚠️ Uygulamayı **her ekrana getirmek** tam otomatik değil: ya elle gezerken
    `capture-screens.js` snap alır, ya da Maestro akışı yazılır (§7).
- **İçerik/metin bu skill'in işi değil** → `store-assets` (başlık, açıklama, anahtar
  kelime). **Mağazaya PUSH da değil** → `store-deploy` (CI job'ları / Mod D).

Şablonlar (hepsi self-bootstrapping sharp; proje bağımlılığı gerekmez, yalnızca `node`):
| Betik | İş |
|---|---|
| `capture-screens.js` | Çalışan simülatör/emülatörden ham kareleri yakalar. |
| `build-screenshots.js` | Ham kare + config → çerçeveli/başlıklı, mağaza boyutunda görseller. |
| `place-screenshots.js` | Üretilen görselleri boyuta göre `store/` + `fastlane/` ağacına yerleştirir. |
| `screenshots.config.example.js` | Slayt/başlık/tema tanımı — projeye `screenshots.config.js` olarak kopyala. |

## ⚠️ KURAL — ekran görüntülerinde reklam OLMAZ (yakalamadan önce kapat)

App Store ve Google Play, ekran görüntülerinde **reklam gösterilmesini reddeder**;
görsel de kötü durur. Ham kareleri çekmeden **ÖNCE** reklamları geçici olarak kapat,
**çektikten SONRA geri al**. Sıra: kapat → yakala (`capture-screens.js`) → geri al.

**a) Banner'ı `return null` yap** — kalıcı görünen tek reklam banner'dır (`AdBanner`).
Bileşenin en başına erken dönüş ekle:
```js
// components/AdBanner.js  → export default function AdBanner() {
export default function AdBanner() {
  return null; // TODO: mağaza ss'i — çekimden sonra bu satırı SİL
  // ... mevcut gövde olduğu gibi kalır
}
```
Banner `adsAvailable`/native modüle bağlı olsa da, ss modunda **koşulsuz** `return null`
en garantisidir (dev build'de test banner'ı da görünmez).

**b) Geçiş/app-open reklamı tetikleme** — interstitial bölüm bitişinde, app-open soğuk
açılışta çıkar. Yakalarken bölüm bitirip "Sonraki"ye basma; uygulamayı kapatıp yeniden
açma. Emin olmak istersen `game/ads.js` içindeki gösterim fonksiyonlarının başına da
geçici `return;` koy (interstitial/appOpen) ve sonra geri al.

**c) Çekim bitince GERİ AL** — `git checkout components/AdBanner.js game/ads.js`
(ya da eklediğin `return null;` / `return;` satırlarını sil). Reklamsız kod release'e
gitmemeli — yoksa gelir kaybolur.

> İpucu: Bunu her seferinde elle yapmamak için `SCREENSHOT_MODE` gibi tek bir bayrak da
> kullanabilirsin (ör. `if (SCREENSHOT_MODE) return null;`) ama en basiti yukarıdaki
> geçici düzenleme + `git checkout` ile geri almadır.

## 2) Önerilen akış — kod tabanlı, editörsüz (uçtan uca otomatik)

**a) Config'i doldur** — ajan `src/*Screen.js` ekranlarını inceler, hangi ekranın hangi
slayta gireceğini ve pazarlama başlığını önerir; `screenshots.config.example.js`'i projeye
`screenshots.config.js` olarak kopyalayıp doldurur (dile göre başlık, tema, cihaz listesi).

**b) Ham kareleri yakala** — oyunu simülatör/emülatörde aç; config'teki `raw` adlarıyla.
**Önce yukarıdaki "reklam OLMAZ" kuralını uygula** (banner `return null`), sonra:
```bash
node ~/.claude/skills/store-screenshots/templates/capture-screens.js \
  --platform ios --out ./raw --names welcome,game,boosters,compete,reward
# her adımda uygulamayı ilgili ekrana getir, ENTER'a bas → o kareyi çeker
```
**İlk 2 kare en kritik** (kullanıcı aramada yalnızca onları görür) — en güçlü faydayı öne al.

**c) Görselleri üret** — çerçeve + başlık + arka plan + tam mağaza boyutu:
```bash
node ~/.claude/skills/store-screenshots/templates/build-screenshots.js \
  --config ./screenshots.config.js --raw ./raw --out ./export
```
Her locale × slayt × cihaz için mağaza boyutunda PNG üretir (feature graphic dahil).

**d) Yerleştir** — oyun kökünde:
```bash
node ~/.claude/skills/store-screenshots/templates/place-screenshots.js \
  --from ./export --locale tr --project . --patch-config
```
Boyuta göre doğru hedefe kopyalar, sıralar (`01.png`…), zorunlulukları kontrol eder,
`--patch-config` ile store.config.json haritasını günceller.

## 2b) Alternatif — dış görsel editör (`app-store-screenshots`)

Daha zengin/elle tasarım istersen kod-üreticinin yerine ParthJadhav'ın editörünü kullan;
çıktısı yine `place-screenshots.js` ile yerleşir:
```bash
npx skills add ParthJadhav/app-store-screenshots      # tek seferlik kur (-g global)
# ajana: "Build App Store and Google Play screenshots for my app."
# ham kareleri yükle, başlık/tema seç, Export → ZIP
unzip ~/Downloads/app-store-screenshots-export.zip -d ./export
node ~/.claude/skills/store-screenshots/templates/place-screenshots.js \
  --from ./export --locale tr --project . --patch-config
```

## 3) Boyut → hedef eşlemesi (betiğin yaptığı)

| Görüntü boyutu | Platform/varlık | Hedef yol |
|---|---|---|
| **1290×2796** | iOS iPhone 6.9" (zorunlu) | `store/apple/screenshot/<iosLocale>/APP_IPHONE_67/NN.png` |
| **2064×2752** | iOS iPad 13" (yalnızca `supportsTablet`) | `store/apple/screenshot/<iosLocale>/APP_IPAD_PRO_3GEN_129/NN.png` |
| **1080×1920** | Android telefon (min 2, max 8) | `fastlane/metadata/android/<androidLocale>/images/phoneScreenshots/NN_*.png` |
| **1024×500** | Android feature graphic (zorunlu) | `.../images/featureGraphic.png` |
| **512×512** | Android ikon | `.../images/icon.png` |

- Eşleme **en-boy oranına** göre yapılır (±%3 tolerans); tam boyut değilse uyarır,
  `--resize` verilirse hedefe `cover` ile ölçekler (oran korunur, kırpma olabilir).
- Boyut tam tutarsa dosya **ham kopyalanır** (yeniden kodlama yok, kalite kaybı olmaz).
- Sıra kaynak dosya adına göre (numerik) → editörde `01-`, `02-` diye adlandır.

## 4) Locale eşlemesi

iOS ile Android locale kodları farklıdır (iOS `tr`, Android `tr-TR`). `--locale tr`
ikisini de türetir. Gerekirse ayrı ayrı ez:
```bash
--ios-locale tr --android-locale tr-TR
```
Her dil için ayrı export + ayrı çalıştırma yap (görseldeki başlık metni dile göre değişir).

## 5) Betik bayrakları

**`build-screenshots.js`** — ham kare + config → mağaza görselleri:

| Bayrak | İş |
|---|---|
| `--config <f>` | `screenshots.config.js` yolu (verilmezse çalıştığın dizinde aranır). |
| `--raw <dir>` | Ham kare klasörü (config'teki `raw` adları burada aranır). |
| `--out <dir>` | Üretilen görsellerin klasörü (`place-screenshots.js --from` bunu alır). |
| `--only <loc>` | Yalnızca bu locale'i üret. |
| `--devices a,b` | Cihazları kısıtla (`iphone67,ipad13,android,feature`). |

**`place-screenshots.js`** — görselleri store-assets ağacına yerleştir:

| Bayrak | İş |
|---|---|
| `--from <dir>` | Görsel klasörü (build çıktısı ya da editör ZIP'i). **Zorunlu.** |
| `--locale <c>` | Kısayol: hem iOS hem Android locale'i türetir. |
| `--ios-locale` / `--android-locale` | Locale'i platform bazında ez. |
| `--project <dir>` | Proje kökü (varsayılan: bulunduğun dizin). |
| `--resize` | Boyut tam tutmuyorsa hedefe `cover` ile ölçekle. |
| `--patch-config` | `store.config.json` → `apple.info.<locale>.screenshots` haritasını güncelle. |
| `--dry-run` | Dosya yazmadan ne yapılacağını göster. |

Önce daima `--dry-run` ile çalıştır, eşlemeyi doğrula, sonra gerçek yaz.

**Config şeması** (`screenshots.config.js`): `appName`, `devices[]`, `locales.<loc>` →
`textColor`, `background` (tek renk düz / iki renk gradyan), `slides[]` (`raw`, `title`,
`subtitle`, opsiyonel `badge`, `devices[]`), `feature` (feature graphic başlığı). Tam örnek:
`templates/screenshots.config.example.js`.

## 6) Zorunluluk kontrolü (betik uyarır)

- **iOS:** iPhone 6.9" en az 1 (max 10). `app.json` → `ios.supportsTablet: true` ise
  iPad 13" seti de **zorunlu** → ya iPad görsellerini ekle ya tablet desteğini kapat.
- **Android:** telefon **min 2, max 8**; feature graphic **1024×500 zorunlu**.
- **ASO:** ilk 2 kareye faydayı büyük yaz, başlık ≤5 kelime; ilk kareye "REKLAMSIZ" /
  "TAMAMEN TÜRKÇE" gibi ayrıştırıcı rozet koy.

## 7) Otomatik gezinme (opsiyonel) — Maestro

`capture-screens.js` uygulamayı ekranlar arasında GEZDİRMEZ; her karede sen ekranı
getirirsin. Tam otomatik (elle dokunmadan) yakalama istiyorsan **Maestro** akışı yaz —
her adımda dokun/kaydır + `takeScreenshot`:
```yaml
# .maestro/store-shots.yaml
appId: com.appaflytech.sweetpop
---
- launchApp
- takeScreenshot: raw/welcome
- tapOn: "Oyna"
- takeScreenshot: raw/game
# tapOn/scroll ile diğer ekranlara git, her birinde takeScreenshot
```
`maestro test .maestro/store-shots.yaml` → `raw/*.png` üretir → doğrudan
`build-screenshots.js --raw ./raw`'a girer. Maestro yoksa `capture-screens.js` yeterli.

## 8) Push / doğrulama (başka skill'ler)

- Ekran görüntüsü **App Store Connect'e** genelde metinden ayrı yüklenir (EAS Metadata
  screenshot push kırılgan) → `store-deploy` **Mod D** ve `fastlane deliver`/`supply`.
- Görseller `store/` + `fastlane/` altında `.easignore` ile derleme arşivinden hariç
  tutulur (uygulama bundle'ına girmez) — bkz. `store-assets` §5.
- Listeleme **metni** için `store-assets`; **PUSH** için `store-deploy`.
