---
name: wappa-ads
description: >-
  Add Google AdMob monetization and iOS App Tracking Transparency (ATT) to an
  Expo / React Native app. Use this when adding ads of any kind — rewarded
  (continue / refill / 2x score), interstitial (game-over), app-open (cold
  start), or an adaptive banner — to a project; when wiring the iOS ATT consent
  prompt; when implementing ad frequency capping / cooldowns for retention; or
  when serving non-personalized ads (NPA) until tracking consent is granted.
  Drops in a central ad manager (game/ads.ts), ATT helpers (game/tracking.ts),
  and a banner component (components/AdBanner.tsx) that safely no-op on web and
  Expo Go. Also covers the app.json plugin config, AdMob dashboard setup, and
  App Store privacy declarations. Sibling of wappa-games-template and wappa-auth.
---

# wappa-ads — Expo/AdMob reklam + iOS ATT entegrasyonu

Bir Expo / React Native uygulamasına Google AdMob reklamlarını (ödüllü,
geçiş, app-open, banner) ve iOS App Tracking Transparency (ATT) akışını ekler.
Kod, web ve Expo Go'da güvenli biçimde no-op'a düşer; yalnızca gerçek native
dev/release build'lerde çalışır.

> Kardeş skill'ler: onboarding/karşılama (welcome) ekranı ve reklam
> başlatmanın onunla nasıl geciktirildiği için `wappa-games-template` ve
> `wappa-auth`'a bak. ATT prompt'u karşılama ekranındaki "Başla" dokunuşunda
> istenir; bu yüzden welcome akışı bu skill için ön koşuldur.

---

## 1. Amaç ve gelir stratejisi

Reklam türleri, eCPM ve kullanıcı deneyimi dengesine göre:

| Tür | Ne zaman | Neden |
| --- | --- | --- |
| **Ödüllü (rewarded)** | Oyuncu isteyerek: devam et / güç yenile / skoru 2× | En yüksek eCPM, izinli, retention'a zararsız |
| **Geçiş (interstitial)** | Oyun bitişinde, **frekans sınırlı** | İyi gelir ama sık gösterilirse retention'ı yer — sınırla |
| **App-open** | Uygulama arka plandan öne gelince (soğuk açılış), **cooldown ile** | Açılış başına ekstra gösterim, cooldown ile abartmadan |
| **Banner** | Sadece ana ekranın altında (adaptif) | Sürekli görünür, düşük eCPM, oyun akışını bozmaz |

Tümü tek merkezden (`game/ads.ts`) yönetilir. `Platform.OS === 'web'` veya
native modül yoksa (Expo Go) her şey sessizce no-op olur; `adsAvailable`
`false` döner ve `<AdBanner/>` hiçbir şey render etmez.

---

## 2. Kurulacak dosyalar

Template'ler `templates/` altında, projedeki hedef yollarını birebir yansıtır:

| Template | Hedef | İçerik |
| --- | --- | --- |
| `templates/game/ads.ts` | `game/ads.ts` | Merkezi reklam yöneticisi (rewarded/interstitial/appOpen/banner, frekans sınırları, NPA/ATT-uyumlu) |
| `templates/game/tracking.ts` | `game/tracking.ts` | ATT izin isteme/okuma yardımcıları |
| `templates/components/AdBanner.tsx` | `components/AdBanner.tsx` | Adaptif banner bileşeni |

Kopyaladıktan sonra:
1. `game/ads.ts` içindeki `PROD_UNITS` `{{...}}` placeholder'larını gerçek
   AdMob **ad unit** ID'leriyle doldur (bkz. §5).
2. `app.json`'a plugin ve izinleri ekle (bkz. §4).
3. `App.tsx`'i ATT + initAds + app-open için tel (bkz. §6).

---

## 3. package.json bağımlılıkları (kesin sürümler)

Kaynak projede doğrulanmış sürümler:

```json
{
  "dependencies": {
    "react-native-google-mobile-ads": "^16.4.0",
    "expo-tracking-transparency": "~56.0.5"
  }
}
```

Kurulum:

```bash
npx expo install react-native-google-mobile-ads expo-tracking-transparency
```

> Native modüller içerir: Expo Go'da çalışmaz. Test için **dev client** ya da
> gerçek bir dev/release build gerekir (`expo run:ios` / `expo run:android`).

---

## 4. app.json yapılandırması

Üç parça: AdMob plugin'i (app ID'leri), ATT plugin'i (izin metni), ve Android
`AD_ID` izni.

```jsonc
{
  "expo": {
    "android": {
      "permissions": [
        "com.google.android.gms.permission.AD_ID"
      ]
    },
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "{{ADMOB_ANDROID_APP_ID}}",
          "iosAppId": "{{ADMOB_IOS_APP_ID}}"
        }
      ],
      [
        "expo-tracking-transparency",
        {
          "userTrackingPermission": "Sana daha alakalı reklamlar gösterebilmemiz için bu izni kullanıyoruz. Reddedersen yine oynayabilirsin."
        }
      ]
    ]
  }
}
```

Notlar:

- **`androidAppId` / `iosAppId` = AdMob APP ID'si**, ad unit değil. AdMob →
  Apps → <uygulaman> → App settings'te bulunur. Formatı `~` içerir:
  `ca-app-pub-XXXX~YYYY`.
- Kaynak projedeki gerçek örnek değerler (referans olsun diye):
  - Android app ID: `ca-app-pub-2328726718423322~5078932827`
  - iOS app ID: `ca-app-pub-2328726718423322~2857305610`
- **`~` (app ID) vs `/` (ad unit ID) farkı önemli:** app.json'a `~`'li APP
  ID'leri, `game/ads.ts` `PROD_UNITS`'e `/`'li AD UNIT ID'leri yazılır.
  Karıştırma reklamların hiç dolmamasına yol açar.
- **`userTrackingPermission`**: iOS ATT prompt'unda görünen metin. Her uygulama
  için özelleştir — kısa, dürüst, "reddedebilirsin" tonunda olması onay
  oranını artırır. Yukarıdaki Türkçe metin bir örnektir.
- **`AD_ID` izni**: Android 13+ reklam ID'sine erişim için zorunlu (Google Play
  Data safety ile de uyumlu olmalı).

---

## 5. AdMob kurulumu

1. [AdMob](https://apps.admob.com) → **Apps → Add app**. Android ve iOS için
   **ayrı** uygulama oluştur → 2 adet **APP ID** (`~`'li) alırsın → app.json'a
   yaz (§4).
2. Her uygulama için **4 ad unit** oluştur (Rewarded, Interstitial, App open,
   Banner) → toplam **8 ad unit** (Android 4 + iOS 4). Her biri `/`'li bir
   **ad unit ID** verir.
3. Bu ad unit ID'lerini `game/ads.ts` içindeki `PROD_UNITS`'e yaz:

   ```ts
   const PROD_UNITS = {
     rewarded:     { android: '{{ADMOB_ANDROID_REWARDED}}',     ios: '{{ADMOB_IOS_REWARDED}}' },
     interstitial: { android: '{{ADMOB_ANDROID_INTERSTITIAL}}', ios: '{{ADMOB_IOS_INTERSTITIAL}}' },
     appOpen:      { android: '{{ADMOB_ANDROID_APP_OPEN}}',     ios: '{{ADMOB_IOS_APP_OPEN}}' },
     banner:       { android: '{{ADMOB_ANDROID_BANNER}}',       ios: '{{ADMOB_IOS_BANNER}}' },
   };
   ```

4. **Test ID'leri otomatik**: `__DEV__` (dev build) iken kod Google'ın resmi
   TEST birimlerini (`Ads.TestIds`) kullanır; release'de `PROD_UNITS`'e geçer.
   Bir prod ID boş bırakılırsa `pick()` çökmemek için test ID'sine düşer.
   **Kendi gerçek reklamlarına dev'de asla tıklama** — hesap askıya alınır;
   dev'de her zaman test reklamı çıktığından emin ol.

---

## 6. ATT akışı (iOS) ve App.tsx teli

Kritik sıra: **önce ATT izni iste, sonra reklam SDK'sını başlat.** Böylece
kullanıcı IDFA kararını verdikten sonra AdMob doğru kişiselleştirme moduyla
başlar. İzin verilene kadar reklamlar **non-personalized (NPA)** sunulur.

Akış:
1. Karşılama ekranındaki **"Başla"** dokunuşunda `requestTracking()` çağrılır
   (ATT prompt'u iOS'ta burada çıkar).
2. Welcome bayrağı kaydedilir → `welcomeDone = true`.
3. Ayrı bir effect `welcomeDone` olunca **bir kez** `initAds()` çalıştırır.
   Böylece ATT prompt'u her zaman SDK init'inden önce gelir.
4. Uygulama arka plandan öne gelince `showAppOpen(Date.now())` (cooldown ads.ts'te).

`App.tsx` içindeki asgari tel:

```tsx
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { initAds, showAppOpen } from './game/ads';
import { requestTracking } from './game/tracking';

const adsInited = useRef(false);
const [welcomeDone, setWelcomeDone] = useState<boolean | null>(null);

// Reklamları yalnızca karşılama ekranı geçildikten sonra (bir kez) başlat.
// Böylece ilk açılışta önce ATT izni istenir, sonra reklam SDK'sı kurulur.
useEffect(() => {
  if (welcomeDone && !adsInited.current) {
    adsInited.current = true;
    initAds();
  }
}, [welcomeDone]);

// Karşılama "Başla": iOS'ta ATT izni iste, bayrağı kaydet, ana ekrana geç.
const handleStart = useCallback(async () => {
  try {
    await requestTracking();
  } finally {
    await AsyncStorage.setItem(welcomeKey, '1');
    setWelcomeDone(true);
  }
}, []);

// Uygulama arka plandan öne gelince açılış reklamı (cooldown ads.ts'te).
const appStateRef = useRef<AppStateStatus>(AppState.currentState);
useEffect(() => {
  const sub = AppState.addEventListener('change', (next) => {
    if (appStateRef.current.match(/inactive|background/) && next === 'active') {
      showAppOpen(Date.now());
    }
    appStateRef.current = next;
  });
  return () => sub.remove();
}, []);
```

> `requestTracking()` throw etmez ve iOS dışında `'unavailable'` döner —
> Android/web akışını bloklamaz. Welcome ekranı deseni için `wappa-auth` /
> `wappa-games-template`'e bak.

---

## 7. Frekans sınırları (retention için ayar)

`game/ads.ts` başındaki sabitler. Amaç: gelir ile oyuncu tahammülü dengesi.

```ts
const INTERSTITIAL_EVERY_N_GAMES = 2;      // en az 2 oyunda bir geçiş reklamı
const INTERSTITIAL_MIN_GAP_MS = 90_000;    // son reklamdan en az 90 sn sonra
const APP_OPEN_COOLDOWN_MS = 4 * 60_000;   // açılış reklamı için 4 dk cooldown
```

- `INTERSTITIAL_EVERY_N_GAMES` — geçiş reklamı en fazla her N oyunda bir. Küçült
  → daha çok gelir + daha çok rahatsızlık. Kısa oturumlu oyunlarda 2–3 iyi.
- `INTERSTITIAL_MIN_GAP_MS` — iki geçiş reklamı arası minimum süre. Hızlı üst
  üste bitişlerde arka arkaya reklamı önler. İki koşul da (`enoughGames &&
  enoughGap`) sağlanmalı.
- `APP_OPEN_COOLDOWN_MS` — app-open için cooldown. Uygulamaya sık girip çıkan
  kullanıcıyı her seferinde reklamla karşılamamak için. 4 dk makul.

Retention'ı önceleyeceksen bu değerleri **büyüt**; agresif gelir için dikkatle
küçült ve churn'ü izle. Ödüllü reklamda sınır yok — oyuncu isteyerek izliyor.

---

## 8. API

`game/ads.ts` dışa açtıkları:

| Sembol | İmza | Ne yapar |
| --- | --- | --- |
| `initAds()` | `() => Promise<void>` | SDK'yı başlatır (G derecesi + ATT'ye göre NPA), interstitial + app-open önden yükler. Welcome sonrası bir kez çağır. |
| `showRewarded()` | `(onReward: () => void, opts?: { fallbackReward?: boolean }) => void` | Ödüllü reklam gösterir; ödül hak edilince `onReward()`. Reklam yoksa/hata olursa `fallbackReward` (varsayılan `true`) ise yine `onReward()` çağrılır. Çift açılışa karşı kilitli, 10 sn timeout. |
| `onGameOver()` | `(now: number) => boolean` | Oyun bitişinde çağır. Frekans sınırını geçerse geçiş reklamı gösterir; gösterdiyse `true` döner. `now = Date.now()`. |
| `showAppOpen()` | `(now: number) => void` | Öne gelişte açılış reklamı (cooldown'lu). `AppState` 'active' geçişinde çağır. |
| `<AdBanner/>` | React bileşeni | Ana ekran altına adaptif banner. Reklam yoksa `null` render eder. |
| `adsAvailable` | `boolean` | Native reklam modülü mevcut mu (web/Expo Go'da `false`). |
| `BANNER_UNIT_ID` | `string` | Seçili banner ad unit ID'si (AdBanner içeride kullanır). |
| `adRequestOptions()` | `() => { requestNonPersonalizedAdsOnly: boolean }` | Tüm isteklerin ortak seçenekleri (NPA bayrağı). |

Kullanım örnekleri:

```tsx
// Devam et / 2× skor
showRewarded(() => continueGame());
// Ödül vermeyi reklama bağla (reklam çıkmazsa ödül yok)
showRewarded(() => doubleScore(), { fallbackReward: false });

// Oyun bitti
onGameOver(Date.now());

// Ana ekranda banner
<AdBanner />
```

---

## 9. Store / gizlilik notları

- **`initAds()` içinde ayarlı**: `maxAdContentRating: G` (4+ yaş + Apple reklam
  şartı), `tagForChildDirectedTreatment: false`, `tagForUnderAgeOfConsent: false`.
  Uygulama çocuklara yönelikse bu değerler değişmeli (COPPA/GDPR-K).
- **App Store — App Privacy**: Reklam SDK'sı kimlik/kullanım verisi topladığı
  için "Identifiers", "Usage Data" vb. beyan et; ATT ile "tracking" kullanımını
  bildir. `userTrackingPermission` metni App Store incelemesinde kontrol edilir.
- **Google Play — Data safety**: `AD_ID` izni ve reklam kimliği kullanımını
  beyan et.
- İzin verilmeden (ya da iOS dışı belirsizken) varsayılan **NPA (non-personalized)**
  — gizlilik-güvenli taraf.

---

## 10. Doğrulama

- **Dev build**: Her reklam yerinde Google **test reklamı** ("Test Ad" etiketli)
  çıkmalı. Gerçek reklam görüyorsan `__DEV__` yolu yanlış — durdur, gerçek
  reklama tıklama.
- **Release/prod**: `PROD_UNITS` ve app.json app ID'leri gerçek olmalı; yeni
  ad unit'ler dolmaya başlaması birkaç saat sürebilir ("no fill" normal olabilir).
- **web / Expo Go**: `adsAvailable === false`, banner render edilmez, tüm
  fonksiyonlar no-op — hata vermemeli.
- **iOS ilk açılış**: Karşılama "Başla"da ATT prompt'u çıkmalı, sonra reklamlar
  yüklenmeli. Prompt çıkmıyorsa `expo-tracking-transparency` plugin'i ve iOS
  ayarlarını (Settings → Privacy → Tracking) kontrol et.
- **Frekans**: Üst üste oyun bitir → her seferinde değil, `EVERY_N_GAMES` +
  `MIN_GAP` kurallarına göre geçiş reklamı çıkmalı.
