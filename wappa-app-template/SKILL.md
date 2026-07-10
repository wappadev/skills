---
name: wappa-app-template
description: >-
  Scaffold a new modern, general-purpose (NON-game) Wappa-backed mobile app (Expo / React
  Native) from a reusable template, wiring all shared infrastructure while leaving the app's
  own screens to you. Modern stack: Expo Router (file-based navigation, typed routes) +
  NativeWind (Tailwind CSS) + a reusable UI component kit (Screen, Button, Card, Field,
  ListItem, Header) with light/dark support. Sets up the base Expo project + config (app.json
  with scheme + expo-router, package.json, babel/metro/tailwind/global.css for NativeWind,
  tsconfig with @/ paths, plugins), a working app shell (welcome/onboarding + home + settings
  + login + optional compete screens under app/), Firebase Google/Apple social login
  (wappa-auth), FCM push (wappa-notifications), AdMob + iOS ATT (wappa-ads), an optional
  competition/leaderboard (wappa-leaderboard) backed by Wappa entities over MCP
  (wappa-mcp-backend), and store publishing (store-assets + store-screenshots + store-deploy).
  Use when creating a NEW non-game app (quiz / ehliyet soruları, list/detail, forms, content,
  utility, dashboard), when you want a modern Tailwind (NativeWind) + Expo Router starter, or
  when asked for "the wappa app template" (as opposed to wappa-games-template for games).
  Sibling of wappa-games-template. Reply in the user's language.
---

# Wappa App Template — Modern Genel Amaçlı Uygulama Kurulumu (Orkestratör)

Bu skill, Wappa altyapılı **oyun-olmayan modern bir uygulamayı sıfırdan** iskeletler:
quiz/ehliyet soruları, liste-detay, form, içerik, araç (utility), dashboard vb. **her tür
app**. Uygulamanın kendi ekranları HARİÇ her şeyi kurar: proje yapısı, config, tasarım
sistemi, navigasyon, sosyal giriş, push, reklam, opsiyonel yarışma ve mağaza yayını.

**Modern stack:** **Expo Router** (dosya tabanlı navigasyon) + **NativeWind** (Tailwind CSS)
+ yeniden kullanılabilir **UI bileşen kiti** (light/dark hazır). Bu bir **orkestratördür**:
her alanın kendi odaklı skill'i vardır; bunları doğru sırada çağırır ve kabloları kurar.

> **Oyun mu yapıyorsun?** Bunun yerine `wappa-games-template`'i kullan. İki template aynı
> altyapı skill'lerini (auth/notifications/ads/leaderboard/mcp-backend/store) paylaşır;
> fark **kabuk + stil + navigasyon**tadır (bu: Expo Router + NativeWind + genel ekranlar;
> games: manuel switch + StyleSheet + oyun kabuğu).

## Alan haritası (hangi skill neyi sahiplenir)

| Alan | Skill | Kurduğu ana dosyalar |
|---|---|---|
| Proje iskeleti + config + kabuk + tasarım sistemi | **wappa-app-template** (bu) | `app/*` (Expo Router), `components/ui/*`, `lib/theme.ts`, `tailwind.config.js`, `metro.config.js`, `global.css`, `app.json`, `package.json` |
| Sosyal giriş (Google/Apple) | **wappa-auth** | `lib/auth.ts`, firebase plugin'leri (provider `app/_layout.tsx`'te) |
| Push bildirimleri (FCM) | **wappa-notifications** | `lib/notifications.ts` |
| Reklam (AdMob) + ATT | **wappa-ads** | `lib/ads.ts`, `lib/tracking.ts`, `components/AdBanner.tsx` |
| Yarışma / leaderboard (opsiyonel) | **wappa-leaderboard** | `lib/leaderboard.ts` |
| Backend modelleri (MCP) | **wappa-mcp-backend** | `.mcp.json` + MCP ile entity/query'ler |
| Mağaza metni & görseller | **store-assets** + **store-screenshots** | `store.config.json`, `fastlane/**` |
| CI/CD + yayın | **store-deploy** | `.gitlab-ci.yml`, `.claude/store-deploy.context.md` |

Şablon dosyalar bu skill'in `templates/` klasöründedir. Kopyalarken içindeki `{{...}}`
placeholder'larını Adım 0'da toplanan değerlerle değiştir.

---

## ⚠️ Bu template'in games-template'ten 3 kritik farkı

Alt-skill'ler (wappa-auth/ads/notifications/leaderboard) varsayılan olarak `game/` klasörünü
ve `index.js` sarmalamasını anlatır. Bu template **modern** olduğu için şu 3 uyarlamayı yap:

1. **Klasör `game/` DEĞİL `lib/`.** Alt-skill'lerin ürettiği `game/<dosya>.ts`'leri
   **`lib/<dosya>.ts`** olarak koy. Dosyaların **kendi içindeki** göreli importlar (`./auth`
   gibi) aynen çalışır — sadece klasör adı değişir. Ekran/bileşen importları `@/lib/...` kullanır.
2. **Provider `index.js`'te DEĞİL `app/_layout.tsx`'te.** Expo Router'da kök `app/_layout.tsx`'tir
   ve `WappaAuthProvider` sarmalaması **zaten oradadır** (`main: "expo-router/entry"`).
   **`index.js` OLUŞTURMA**; wappa-auth'un index.js adımını atla, sadece `lib/auth.ts`'i al.
3. **Ekranlar bu template'ten.** Alt-skill'lerin StyleSheet'li örnek ekranlarını (LoginScreen
   vb.) KULLANMA; bu template'in Expo Router + NativeWind ekranları (`app/login.tsx` vb.)
   zaten hazır. Alt-skill'lerden yalnızca **mantık modüllerini** (`lib/*.ts`) al.

---

## Adım 0 — Kimlik bilgilerini topla (önce bunu yap)

Kullanıcıya sor / öğren, sonra tüm `{{...}}` placeholder'larını doldur. Yoksa `TODO` bırak.

| Placeholder | Anlam | Örnek / kaynak |
|---|---|---|
| `{{APP_NAME}}` | Görünen ad | "Ehliyet Sınavı" |
| `{{APP_SLUG}}` | Expo slug | "ehliyet-sinav" |
| `{{APP_SCHEME}}` | Derin link şeması (Expo Router için gerekli) | "ehliyetsinav" (harf/rakam, boşluksuz) |
| `{{BUNDLE_ID}}` | iOS+Android paket id (son segment rakamla başlamaz!) | "com.appaflytech.ehliyet" |
| `{{EAS_OWNER}}` | Expo hesabı/owner | "appasoft" — `eas init` |
| `{{EAS_PROJECT_ID}}` | EAS proje id | `eas init` app.json'a yazar |
| `{{SITE_KEY}}` | Wappa panel site key | "ehliyet" |
| `{{WAPPA_UI_API_URL}}` | Wappa UI API (client) | `https://wappa-ui-api.appaflytech.com` |
| `{{WAPPA_ADMIN_API_URL}}` | Wappa Admin API (MCP) | `https://wappa-admin-api.appaflytech.com` |
| `{{WAP_EMAIL}}` / `{{WAP_PASSWORD}}` | MCP panel girişi | `.mcp.json` |
| `{{GOOGLE_WEB_CLIENT_ID}}` | Firebase OAuth "Web client" id | google-services.json client_type:3 |
| `{{ADMOB_ANDROID_APP_ID}}` / `{{ADMOB_IOS_APP_ID}}` | AdMob app id (`~`) | app.json |
| `{{ADMOB_*_REWARDED/INTERSTITIAL/APP_OPEN/BANNER}}` | AdMob ad-unit id (`/`) | `lib/ads.ts` |
| `{{ATT_PERMISSION_TEXT}}` | iOS izleme izni metni | app.json |
| `{{ASC_APP_ID}}` | App Store Connect app id | eas.json submit.ios |
| `{{APPLE_TEAM_ID}}` | Apple Team ID | store-deploy context |

> **Reklam/yarışma opsiyonel:** reklam istemiyorsan wappa-ads'i atla (`AdBanner`'ı ve
> `_layout.tsx`/`index.tsx`'teki reklam çağrılarını kaldır). Yarışma kararı Adım 6'da sorulur.

---

## Adım 1 — Proje iskeleti + config (Expo Router + NativeWind)

`templates/` kökünden kopyala (placeholder'ları doldurarak): `app.json`, `eas.json`,
`package.json`, `babel.config.js`, **`metro.config.js`**, **`tailwind.config.js`**,
**`global.css`**, **`nativewind-env.d.ts`**, `tsconfig.json`, `.env.example`, `.gitignore`,
`.easignore`, `README.md`, `plugins/withKotlinSkipMetadataCheck.js`.

- **`index.js` YOK** — Expo Router girişini `main: "expo-router/entry"` (package.json) sağlar.
- Bağımlılıkları kur: `bun install`. Versiyonları SDK ile hizala: `bunx expo install --fix`
  (özellikle `expo-router`, `nativewind`, `react-native-safe-area-context`, `react-native-screens`).
- `assets/` ikon/splash: **`expo-icons`** skill'i ile üret.
- `eas init` ile `{{EAS_PROJECT_ID}}` + `{{EAS_OWNER}}`.

## Adım 2 — Uygulama kabuğu + tasarım sistemi

`templates/app/*`, `templates/components/ui/*`, `templates/lib/theme.ts` +
`templates/lib/app-state.tsx` kopyala. Bu kabuk **derlenir ve çalışır**:

- **`app/_layout.tsx`** — kök: `global.css` yükler, sağlayıcıları (Auth, güvenli alan, jest)
  sarar, push/reklam/ATT kablolarını içerir, `Stack`'i kurar.
- **`app/index.tsx`** (ana), **`app/welcome.tsx`** (onboarding + ATT), **`app/settings.tsx`**,
  **`app/login.tsx`**, **`app/compete.tsx`** (`// [YARIŞMA]`).
- **`components/ui/`** — `Screen`, `Button`, `Card`, `Field`, `ListItem`, `Header` (NativeWind).

**Uygulama mantığını SEN yazarsın:** yeni ekran = `app/` altına yeni dosya (ör. `app/quiz.tsx`
→ `/quiz`). Bileşen kitini ve Tailwind `className`'lerini kullan. `app/index.tsx`'i kendi
ana ekranınla değiştir.

> `_layout.tsx`, `index.tsx`, `compete.tsx` içinde `// [YARIŞMA]` / `// [OPSIYONEL]` işaretli
> satırlar var — yarışma/reklam yoksa Adım 5/6'da kaldır.

## Adım 3 — Sosyal giriş (wappa-auth) [çekirdek]

**`wappa-auth` skill'ini uygula**, ama **bu template'e uyarla**:
- `game/auth.ts` yerine **`lib/auth.ts`** oluştur (içerik aynı, sadece konum).
- **`index.js` OLUŞTURMA** — provider sarmalaması `app/_layout.tsx`'te zaten var
  (`wappaAuthConfig`'i `@/lib/auth`'tan alır).
- Firebase config plugin'lerini (`withFirebaseNonModularHeaders`, `withRNFirebaseStaticFramework`)
  `plugins/`'e ekle — app.json plugin listesi bunlara zaten referans veriyor.
- LoginScreen'i **kopyalama**; `app/login.tsx` zaten hazır (aynı `isCancel`/`controller===null` mantığı).
- **Kritik:** `EXPO_PUBLIC_*` bundle'a güvenilir inline EDİLMEZ → `webClientId`/`siteKey` sabit yazılır.

## Adım 4 — Push bildirimleri (wappa-notifications)

**`wappa-notifications` skill'ini uygula** → `game/notifications.ts` yerine
**`lib/notifications.ts`**. `app/_layout.tsx` zaten `startPush`/`stopPush` kablolarını içerir
(welcome sonrası izin, `publicUserId` ile kimlik bazlı hedefleme, `data.screen` yönlendirmesi
`router.push` ile, çıkışta unregister). Panel tarafı Firebase (Android) + APNs (iOS) → `wappa-mcp-backend`.

## Adım 5 — Reklam + ATT (wappa-ads) [opsiyonel]

Reklam istiyorsan **`wappa-ads` skill'ini uygula** → `lib/ads.ts`, `lib/tracking.ts`,
`components/AdBanner.tsx`. app.json'da AdMob + expo-tracking-transparency plugin'leri zaten
var. `app/_layout.tsx` `initAds`/`requestTracking`/`showAppOpen`; `app/welcome.tsx`
`requestTracking`; `app/index.tsx` `<AdBanner/>` içerir.

**İstemiyorsan:** `lib/ads.ts`/`lib/tracking.ts`/`AdBanner.tsx` ekleme; `_layout.tsx`'teki
`initAds`/`showAppOpen`/`requestTracking` importlarını ve çağrılarını, `welcome.tsx`'teki
`requestTracking`'i, `index.tsx`'teki `AdBanner`'ı (`// [OPSIYONEL]` bloğu) kaldır.

## Adım 6 — YARIŞMA (leaderboard): SOR

**Kullanıcıya sor:** "Bu uygulamada **yarışma / sıralama (leaderboard)** olacak mı?"
(ör. quiz'de en yüksek doğru sayısı sıralaması.)

**EVET ise:**
1. **`wappa-mcp-backend` skill'ini uygula** → `.mcp.json` kur ve MCP ile: `Score` entity
   (PlayerName, Score, Avatar, UserId, ScoreDate) + `score-leaderboard` (GET, azalan,
   `?scoreDate=` günlük) ve `submit-score` (create) query'leri. Ad/kolonlar client ile birebir.
2. **`wappa-leaderboard` skill'ini uygula** → `game/leaderboard.ts` yerine **`lib/leaderboard.ts`**.
   `app/compete.tsx` zaten `@/lib/leaderboard`'ı kullanır. Skoru göndermek için kendi bitiş
   noktanda `submitScore({ userId, name, score, avatar })` çağır (yeni kişisel rekorda).

**HAYIR ise:** yarışmayı çıkar → `app/compete.tsx`'i sil, `app/index.tsx`'teki "Yarışma"
`ListItem`'ını kaldır, `lib/leaderboard.ts` ekleme. `.mcp.json` push kimlikleri için gerekebilir.

## Adım 7 — Mağaza (store-assets + store-screenshots + store-deploy)

- **`store-assets`**: `store.config.json` (iOS) + `fastlane/metadata/android/**` (metin + görsel yerleşimi).
- **`store-screenshots`**: cihaz çerçeveli, başlıklı pazarlama ekran görüntülerini üretir + yerleştirir.
- **`store-deploy`**: `.gitlab-ci.yml` (EAS local build, macOS runner, tag-tabanlı) + context. Sürüm = git tag.

---

## Doğrulama

1. `bun run typecheck` temiz geçer (kabuk + kurulan `lib/` modülleri).
2. `npx expo run:ios` / `run:android`: **Welcome** (ATT izni) → **Home** (bileşen kiti kartları)
   → **Settings/Login** (Google/Apple modalı açılır) → (varsa) **Compete** tablosu. Koyu/açık
   tema cihaz ayarıyla otomatik değişir (NativeWind `dark:`).
3. Push: fiziksel cihazda panele token düşer, test bildirimi gelir, dokununca `data.screen`'e gider.
4. (Yarışma) giriş yapıp `submitScore` ile skor gönder → `score-leaderboard`'da görünür.
5. Yayın: git tag at → CI build; submit/metadata job'ları manuel.

## Davranış kuralları
- Kullanıcının diliyle yanıt ver. Placeholder'ları Adım 0'dan al, hardcode varsayma.
- **`game/` → `lib/`** ve **provider `app/_layout.tsx`'te (index.js YOK)** uyarlamalarını her
  alt-skill'de uygula (yukarıdaki 3 fark).
- Stil için StyleSheet değil **NativeWind `className`** kullan; renkleri `tailwind.config.js`
  `brand` paletinden al, koyu tema için `dark:` önekini ekle.
- Yarışma kararını **mutlaka sor** (Adım 6); EVET ise modelleri MCP ile aç.
- `git push`/`git tag`, `eas submit`, `metadata:push`, `fastlane supply` gibi dışa dönük
  işlemleri onaysız yapma. Firebase/AdMob/EAS gizli değerleri kullanıcıdan iste; uydurma.
