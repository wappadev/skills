---
name: wappa-games-template
description: >-
  Scaffold a new Wappa-backed mobile GAME app (Expo / React Native) from a reusable template,
  wiring up all shared infrastructure while leaving the game logic to you. Sets up: the base
  Expo project + config (app.json, eas.json, package.json, plugins, tsconfig, babel), a working
  game-agnostic shell (Welcome/Home/Game-stub/Settings/Login/Compete screens + navigation),
  Firebase Google/Apple social login (wappa-auth), FCM push (wappa-notifications), AdMob + iOS ATT
  (wappa-ads), an optional competition/leaderboard (wappa-leaderboard) backed by Wappa entities
  created over MCP (wappa-mcp-backend), and store publishing (store-assets + store-deploy: GitLab
  CI EAS local build, App Store / Play submit & metadata). Use when creating a NEW game app, starting
  another app "like the 2048 one", replicating this stack across apps, or asked for the wappa game
  template. Asks whether the game has a competition section; if yes, opens the backend models via MCP.
  Reply in the user's language.
---

# Wappa Games Template — Yeni Oyun Uygulaması Kurulumu (Orkestratör)

Bu skill, Wappa altyapılı bir **oyun uygulamasını sıfırdan** iskeletler. **Oyunun içeriği
HARİÇ** her şeyi kurar: proje yapısı, config, sosyal giriş, push, reklam, yarışma ve mağaza
yayını. Sen sadece `screens/GameScreen.tsx` içindeki oyun mantığını yazarsın.

Bu bir **orkestratördür**: her alanın kendi odaklı skill'i vardır; bu skill onları doğru
sırada çağırır ve aralarındaki kabloları kurar.

## Alan haritası (hangi skill neyi sahiplenir)

| Alan | Skill | Kurduğu ana dosyalar |
|---|---|---|
| Proje iskeleti + config + kabuk | **wappa-games-template** (bu) | `app.json`, `eas.json`, `package.json`, `App.tsx`, `screens/*`, `game/theme.ts`, `plugins/withKotlinSkipMetadataCheck.js` |
| Sosyal giriş (Google/Apple) | **wappa-auth** | `game/auth.ts`, `index.js`, firebase plugin'leri |
| Push bildirimleri (FCM) | **wappa-notifications** | `game/notifications.ts` |
| Reklam (AdMob) + ATT | **wappa-ads** | `game/ads.ts`, `game/tracking.ts`, `components/AdBanner.tsx` |
| Yarışma / leaderboard (opsiyonel) | **wappa-leaderboard** | `game/leaderboard.ts` |
| Backend modelleri (MCP) | **wappa-mcp-backend** | `.mcp.json` + MCP ile Score entity/query'ler |
| Mağaza metni & görseller | **store-assets** | `store.config.json`, `fastlane/metadata/android/**` |
| CI/CD + yayın | **store-deploy** | `.gitlab-ci.yml`, `.claude/store-deploy.context.md` |

Şablon dosyalar bu skill'in `templates/` klasöründedir. Kopyalarken içindeki `{{...}}`
placeholder'larını Adım 0'da toplanan değerlerle değiştir.

---

## Adım 0 — Kimlik bilgilerini topla (önce bunu yap)

Kullanıcıya sor / öğren, sonra tüm `{{...}}` placeholder'larını doldur. Bir değer henüz
yoksa `TODO` bırak ve ilgili adımda tamamlanacağını not et.

| Placeholder | Anlam | Örnek / kaynak |
|---|---|---|
| `{{APP_NAME}}` | Görünen ad | "2048 Efsane Yolu" |
| `{{APP_SLUG}}` | Expo slug | "game-2048" |
| `{{BUNDLE_ID}}` | iOS+Android paket id (son segment rakamla başlamaz!) | "com.appaflytech.oyun2048" |
| `{{EAS_OWNER}}` | Expo hesabı/owner | "appasoft" — `eas init` |
| `{{EAS_PROJECT_ID}}` | EAS proje id | `eas init` app.json'a yazar |
| `{{SITE_KEY}}` | Wappa panel site key | "2048" |
| `{{WAPPA_UI_API_URL}}` | Wappa UI API (client) | varsayılan `https://wappa-ui-api.appaflytech.com` |
| `{{WAPPA_ADMIN_API_URL}}` | Wappa Admin API (MCP) | varsayılan `https://wappa-admin-api.appaflytech.com` |
| `{{WAP_EMAIL}}` / `{{WAP_PASSWORD}}` | MCP panel girişi | `.mcp.json` |
| `{{GOOGLE_WEB_CLIENT_ID}}` | Firebase OAuth "Web client" id | google-services.json client_type:3 |
| `{{ADMOB_ANDROID_APP_ID}}` / `{{ADMOB_IOS_APP_ID}}` | AdMob app id (`~`) | app.json |
| `{{ADMOB_*_REWARDED/INTERSTITIAL/APP_OPEN/BANNER}}` | AdMob ad-unit id (`/`) | 8 birim, `game/ads.ts` |
| `{{ATT_PERMISSION_TEXT}}` | iOS izleme izni metni | app.json |
| `{{ASC_APP_ID}}` | App Store Connect app id | eas.json submit.ios |
| `{{APPLE_TEAM_ID}}` | Apple Team ID | store-deploy context |

> **Reklam/yarışma opsiyonel:** reklam istemiyorsan wappa-ads'i atla (AdBanner'ı ve
> App.tsx'teki reklam çağrılarını kaldır). Yarışma kararı Adım 6'da sorulur.

---

## Adım 1 — Proje iskeleti + config

Bu skill'in `templates/` kökünden kopyala (placeholder'ları doldurarak):
`app.json`, `eas.json`, `package.json`, `babel.config.js`, `tsconfig.json`, `index.js`,
`.env.example`, `.gitignore`, `.easignore`, `README.md`, `plugins/withKotlinSkipMetadataCheck.js`.

Sonra bağımlılıkları kur (`bun install` — CI bun.lock kullanır; npm/yarn de olur).
`assets/` içine ikon/splash görsellerini ekle (bkz. store-assets). `eas init` ile
`{{EAS_PROJECT_ID}}` + `{{EAS_OWNER}}` alınır.

## Adım 2 — Generic oyun kabuğu

`templates/App.tsx`, `templates/game/theme.ts` ve `templates/screens/*` (Welcome, Home,
Game, Settings, Login, Compete) kopyala. Bu kabuk **derlenir ve çalışır**; `GameScreen`
bir placeholder'dır. Oyun mantığını buraya SEN yazacaksın; oyun bitince `onGameEnd(score)`
çağır (yarışma açıksa skor otomatik gönderilir).

> `App.tsx`, `HomeScreen.tsx`, `CompeteScreen.tsx` içinde `// [YARIŞMA]` ile işaretli
> satırlar/bloklar vardır — yarışma yoksa Adım 6'da bunları kaldır.

## Adım 3 — Sosyal giriş (wappa-auth) [çekirdek]

**`wappa-auth` skill'ini uygula.** `game/auth.ts`, firebase config plugin'leri, app.json
plugin ekleri ve `index.js`'teki `WappaAuthProvider` sarmalamasını kurar. Firebase projesi
+ `google-services.json` / `GoogleService-Info.plist` gerekir. **Kritik:** bu stack'te
`EXPO_PUBLIC_*` bundle'a güvenilir inline EDİLMEZ → `webClientId`/`siteKey` sabit yazılır
(bkz. wappa-auth GOTCHA).

## Adım 4 — Push bildirimleri (wappa-notifications)

**`wappa-notifications` skill'ini uygula.** `game/notifications.ts` kurulur; `App.tsx`
zaten `startPush`/`stopPush` kablolarını içerir (welcome sonrası izin, `publicUserId`
ile kimlik bazlı hedefleme, `data.screen` yönlendirmesi, çıkışta unregister). Panel
tarafında Firebase (Android) + APNs (iOS) kimlikleri gerekir → `wappa-mcp-backend`.

## Adım 5 — Reklam + ATT (wappa-ads) [opsiyonel]

Reklam istiyorsan **`wappa-ads` skill'ini uygula.** `game/ads.ts`, `game/tracking.ts`,
`components/AdBanner.tsx` kurulur; app.json'a AdMob + expo-tracking-transparency plugin'leri
eklenir. `App.tsx` zaten `initAds`/`requestTracking`/`showAppOpen` çağrılarını içerir.
İstemiyorsan bu dosyaları ve App.tsx'teki ilgili importları/çağrıları kaldır.

## Adım 6 — YARIŞMA (leaderboard): SOR

**Kullanıcıya sor:** "Bu oyunda **yarışma (leaderboard)** bölümü olacak mı?"

**EVET ise:**
1. **`wappa-mcp-backend` skill'ini uygula** → `.mcp.json` kur ve **MCP üzerinden backend
   modellerini aç**: `Score` entity (PlayerName, Score, Avatar, UserId, ScoreDate) +
   `score-leaderboard` (GET, skora göre azalan, `?scoreDate=` günlük filtre) ve
   `submit-score` (create) query'leri. Query/kolon adları client ile birebir aynı olmalı.
2. **`wappa-leaderboard` skill'ini uygula** → `game/leaderboard.ts` kurulur; App.tsx'teki
   `handleGameEnd`/`submitScore` ve `CompeteScreen` zaten bağlı.

**HAYIR ise:** yarışmayı çıkar:
- `game/leaderboard.ts` ve `screens/CompeteScreen.tsx` dosyalarını ekleme.
- `App.tsx`, `HomeScreen.tsx` içindeki `// [YARIŞMA]` işaretli import/blok/butonları sil
  (`compete` ekranı, `submitScore`, `userDisplayName`, `handleGameEnd` gövdesi, Yarışma butonu).
- `.mcp.json` yalnızca push kimlikleri için hâlâ gerekebilir; leaderboard modeli açma.

## Adım 7 — Mağaza (store-assets + store-deploy)

- **`store-assets`**: `store.config.json` (iOS EAS Metadata) + `fastlane/metadata/android/**`
  (başlık/açıklama/anahtar kelimeler + görseller). Karakter limitleri ve ekran görüntüsü
  boyutları orada.
- **`store-deploy`**: `.gitlab-ci.yml` (EAS local build, self-hosted macOS runner, tag-tabanlı)
  + `.claude/store-deploy.context.md` (bu repoya özgü değerler). Şablonlar store-deploy
  skill'inin `templates/` klasöründe. Sürüm = yeni git tag (`vX.Y.Z`).

---

## Doğrulama

1. `bun run typecheck` temiz geçer (kabuk + kurulan modüller).
2. `npx expo run:ios` / `run:android` ile dev build: Welcome → ATT izni → Home → Game
   placeholder → Settings/Login (Google/Apple modalı açılır) → (varsa) Compete tablosu.
3. Push: panele token düşer, test bildirimi gelir, dokununca `data.screen`'e gider.
4. (Yarışma) giriş yapıp `onGameEnd` ile skor gönder → `score-leaderboard`'da görünür.
5. Yayın: git tag at → CI build; submit/metadata job'ları manuel.

## Davranış kuralları
- Kullanıcının diliyle yanıt ver. Placeholder'ları Adım 0'dan al, hardcode varsayma.
- Yarışma kararını **mutlaka sor** (Adım 6); EVET ise modelleri MCP ile aç.
- `git push`/`git tag`, `eas submit`, `metadata:push`, `fastlane supply` gibi dışa dönük
  işlemleri onaysız yapma (bkz. store-deploy).
- Firebase/AdMob/EAS gizli değerleri kullanıcıdan iste; uydurma.
