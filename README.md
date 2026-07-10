# wappa-app-skills

Wappa altyapılı **mobil uygulamalar** (Expo / React Native) için yeniden kullanılabilir
**Claude Code skill** ailesi. **İki orkestratör template** + 9 odaklı altyapı skill'inden
oluşur; birlikte tek komutla komple bir app'i iskeletler (uygulama mantığı hariç): sosyal
giriş, push, reklam, yarışma/leaderboard, backend modelleri, ikon/asset üretimi, mağaza
görselleri ve yayını.

> **İki template — hangisi?**
> - **`wappa-games-template`** → **oyun** app'i (manuel ekran switch + StyleSheet + oyun kabuğu).
> - **`wappa-app-template`** → **oyun-olmayan modern** app (quiz/ehliyet, liste-detay, form,
>   içerik…): **Expo Router** (dosya tabanlı navigasyon) + **NativeWind (Tailwind CSS)** +
>   yeniden kullanılabilir UI bileşen kiti.
>
> İkisi de aynı altyapı skill'lerini (auth/notifications/ads/leaderboard/mcp-backend/store)
> paylaşır; fark **kabuk + stil + navigasyon**tadır.

> **🚀 Uçtan uca, adım adım kurulum → [STEPS.md](STEPS.md).** İskeletten mağaza yayınına kadar
> her adımı ve **test kapısını** sırayla anlatan bir runbook. Hedef projede Claude Code'a
> _"STEPS.md'yi adım adım uygula, her adımı test et"_ de; template → app → auth/push/reklam →
> (yarışma) → ikon → screenshot → store-deploy sırasını otomatik yürütür.

> **Nasıl tetiklenir?** Skill'leri elle çağırmana gerek yok — Claude Code'a **düz Türkçe** yaz,
> ilgili skill kendiliğinden devreye girer. Aşağıdaki her skill başlığında **"Şöyle de:"**
> satırında hedef projeyi adıyla anıp ne istediğini söyleyen hazır örnek cümleler var.
> Örn: **"2048-cakmasi projesine expo ikonlarını üret, app.json'ı da güncelle"**.

`games/2048-cakmasi` projesinin altyapısından (oyun içeriği hariç) çıkarıldı; `seker-patlatmaca`,
`tank`, `tetris` gibi diğer oyunlarda ve başka makinelerde aynı yapı yeniden kullanılır.

> Bu klasör **tek kaynaktır** (source of truth): skill'leri burada düzenle, her makinede
> `install.sh` ile `~/.claude/skills/`'e **symlink** olarak kurulur. Düzenlemeler symlink
> sayesinde anında yansır.

---

## İçindekiler

- [Tek komutla ne yapar?](#tek-komutla-ne-yapar)
- [Skill ailesi](#skill-ailesi)
- [Kurulum](#kurulum)
- [Başka PC'ye taşıma / senkron](#başka-pcye-taşıma--senkron)
- [Nasıl kullanılır](#nasıl-kullanılır)
- [Bağımlılık grafiği](#bağımlılık-grafiği)
- [Adım 0 — placeholder / kimlik bilgileri referansı](#adım-0--placeholder--kimlik-bilgileri-referansı)
- [Skill'lerin detaylı kullanımı](#skilllerin-detaylı-kullanımı)
  - [1. wappa-games-template (orkestratör — oyun)](#1-wappa-games-template-orkestratör)
  - [1b. wappa-app-template (orkestratör — oyun-olmayan, Expo Router + NativeWind)](#1b-wappa-app-template-orkestratör--oyun-olmayan-expo-router--nativewind)
  - [2. wappa-auth (Google / Apple giriş)](#2-wappa-auth-google--apple-giriş)
  - [3. wappa-notifications (FCM push)](#3-wappa-notifications-fcm-push)
  - [4. wappa-ads (AdMob + iOS ATT)](#4-wappa-ads-admob--ios-att)
  - [5. wappa-mcp-backend (MCP ile backend)](#5-wappa-mcp-backend-mcp-ile-backend)
  - [6. wappa-leaderboard (yarışma / skor tablosu)](#6-wappa-leaderboard-yarışma--skor-tablosu)
  - [7. store-assets (mağaza metni & görseller)](#7-store-assets-mağaza-metni--görseller)
  - [8. store-screenshots (mağaza pazarlama görselleri)](#8-store-screenshots-mağaza-pazarlama-görselleri)
  - [9. store-deploy (CI/CD + yayın)](#9-store-deploy-cicd--yayın)
  - [10. expo-icons (ikon & splash üretimi)](#10-expo-icons-ikon--splash-üretimi)
- [Uçtan uca doğrulama](#uçtan-uca-doğrulama)
- [Sorun giderme (SSS)](#sorun-giderme-sss)
- [Güvenlik notları](#güvenlik-notları)
- [Depo yapısı](#depo-yapısı)

---

## Tek komutla ne yapar?

**Evet — tüm skill'ler tek seferde kullanılabilir.** `wappa-games-template` bir
**orkestratördür**: onu çağırdığında sana birkaç soru sorar (Adım 0) ve diğer 7 skill'i
doğru sırada çalıştırıp aralarındaki kabloları kurar. Tek tek çağırmana gerek yoktur.

Yeni/boş bir proje klasöründe Claude Code'a şunu de:

> **"wappa-app-skills kullanarak yeni oyun app'i oluştur"**
> _(veya "2048'deki gibi app yap")_

Orkestratör sırayla şunu yürütür:

```
Adım 0  Kimlik bilgilerini sor (app adı, slug, bundle id, EAS/Firebase/AdMob…)
Adım 1  Proje iskeleti + config (app.json, eas.json, package.json, plugins…)
Adım 2  Çalışan generic oyun kabuğu (Welcome/Home/Game-stub/Settings/Login/Compete)
Adım 3  wappa-auth          → Google/Apple sosyal giriş
Adım 4  wappa-notifications → FCM push
Adım 5  wappa-ads           → AdMob + iOS ATT           (opsiyonel)
Adım 6  SORAR: "Yarışma olacak mı?"
          EVET → wappa-mcp-backend + wappa-leaderboard
Adım 7  store-assets + store-deploy → mağaza metni + CI/CD
```

Sen sadece `screens/GameScreen.tsx` içindeki **oyun mantığını** yazarsın; oyun bitince
`onGameEnd(score)` çağırırsın (yarışma açıksa skor otomatik gönderilir).

---

## Skill ailesi

| # | Skill | Ne yapar | Kurduğu ana dosyalar |
|---|---|---|---|
| 1 | **wappa-games-template** | Orkestratör (**oyun**) — iskelet + config + generic kabuk, alt-skill'leri çağırır | `app.json`, `eas.json`, `package.json`, `App.tsx`, `screens/*`, `game/theme.ts`, `plugins/withKotlinSkipMetadataCheck.js` |
| 1b | **wappa-app-template** | Orkestratör (**oyun-olmayan**) — Expo Router + NativeWind (Tailwind) + UI kit; aynı alt-skill'leri çağırır | `app/*` (Expo Router), `components/ui/*`, `lib/theme.ts`, `tailwind.config.js`, `metro.config.js`, `global.css`, `app.json` |
| 2 | **wappa-auth** | Firebase + Google/Apple sosyal giriş | `game/auth.ts`, `index.js`, firebase config plugin'leri, `screens/LoginScreen.tsx` |
| 3 | **wappa-notifications** | FCM push (panel üzerinden hedefli) | `game/notifications.ts` |
| 4 | **wappa-ads** | AdMob (rewarded/interstitial/app-open/banner) + iOS ATT | `game/ads.ts`, `game/tracking.ts`, `components/AdBanner.tsx` |
| 5 | **wappa-mcp-backend** | Wappa MCP sunucusu + entity/query + push kimlikleri | `.mcp.json` + MCP ile `Score` entity ve query'ler |
| 6 | **wappa-leaderboard** | Yarışma / skor tablosu client'ı | `game/leaderboard.ts`, `screens/CompeteScreen.tsx` |
| 7 | **store-assets** | Mağaza metni & görselleri (kod olarak) | `store.config.json`, `fastlane/metadata/android/**` |
| 8 | **store-screenshots** | Cihaz çerçeveli, başlıklı pazarlama ekran görüntüleri üretir + yerleştirir | `store/apple/screenshot/**`, `fastlane/metadata/android/**/images/**`, `screenshots.config.js` |
| 9 | **store-deploy** | GitLab CI (EAS local build, macOS runner) + submit/metadata | `.gitlab-ci.yml`, `.claude/store-deploy.context.md` |
| 10 | **expo-icons** | Tek logodan tüm Expo ikon/splash'ini üretir + app.json'a bağlar | `assets/icon.png`, `adaptive-icon.png`, `splash-icon*.png`, `favicon.png`; `app.json` |

Her skill'in `templates/` klasöründeki dosyalar `{{PLACEHOLDER}}`'lıdır; yeni projeye
kopyalanırken [Adım 0](#adım-0--placeholder--kimlik-bilgileri-referansı) değerleriyle doldurulur.

---

## Kurulum

### A) `npx skills add` ile (önerilen — repo public)

Depoyu klonlamaya gerek yok; [`vercel-labs/skills`](https://github.com/vercel-labs/skills)
CLI'ı skill'leri doğrudan GitHub'dan çeker:

```bash
# Tüm skill'leri global kur (~/.claude/skills/) — her projede görünür
npx skills add wappadev/skills -g

# Sadece bulunduğun projeye kur (.claude/skills/)
npx skills add wappadev/skills

# Tek bir skill seç
npx skills add wappadev/skills -s wappa-auth

# Listele / güncelle
npx skills list
npx skills update
```

Kurulumdan sonra **Claude Code'u yeniden başlat** ki skill'leri görsün.

### B) `install.sh` ile (repoyu klonlayıp symlink)

Depoyu geliştirecek/düzenleyeceksen bu yolu kullan; symlink olduğu için değişiklikler
anında yansır. Her PC'de **bir kez** çalıştır:

```bash
git clone https://github.com/wappadev/skills.git wappa-app-skills
cd wappa-app-skills
./install.sh
```

`~/.claude/skills/<ad>` → `wappa-app-skills/<ad>` symlink'leri oluşur. Claude Code hangi
projede olursan ol bu skill'leri **global** görür. Depodaki düzenlemeler anında yansır
(symlink olduğu için tekrar kurmaya gerek yok).

- `install.sh` **idempotent**'tir; mevcut **gerçek** bir skill dizinini ezmez, `<ad>.bak`
  olarak yedekler. Sadece symlink'leri tazeler.
- Kurulumdan sonra **Claude Code'u yeniden başlat** (ya da yeni oturum aç) ki yeni/güncellenen
  skill'leri görsün.

**Doğrulama:**

```bash
ls -l ~/.claude/skills | grep -E 'wappa|store|expo-icons'
```

On satırın hepsi bu depoya işaret etmeli. Symlink hedefi kırıksa (ör. depo yeniden
adlandırıldıysa) `./install.sh`'i tekrar çalıştır.

> ⚠️ **Klasör adı değişirse symlink'ler kırılır.** Symlink'ler mutlak yola bağlıdır; bu
> depoyu taşır/yeniden adlandırırsan `./install.sh`'i yeni konumdan tekrar çalıştır.

---

## Başka PC'ye taşıma / senkron

Git ile senkronla (önerilen):

```bash
# bu makinede: uzak depo ekle ve push et
git remote add origin <gitlab-veya-github-url>
git push -u origin main

# yeni PC'de:
git clone <url> wappa-app-skills && cd wappa-app-skills && ./install.sh
```

iCloud/Drive ile de paylaşabilirsin; her yeni makinede yalnızca `./install.sh` yeterli.

---

## Nasıl kullanılır

**A) Tüm zinciri çalıştır (yeni app):** boş/yeni bir proje klasöründe

> "wappa-app-skills kullanarak yeni oyun app'i oluştur" / "2048'deki gibi app yap"

→ `wappa-games-template` tetiklenir, Adım 0'daki soruları sorar, tüm skill'leri sırayla kurar.

**B) Tek bir alanı çalıştır (mevcut app):** yalnızca ilgili skill'i çağır, ör.

> "bu projeye push bildirimi ekle" → `wappa-notifications`
> "reklam ekle" → `wappa-ads`
> "yarışma/leaderboard ekle" → `wappa-mcp-backend` + `wappa-leaderboard`
> "mağaza ekran görüntülerini üret (çerçeveli, başlıklı)" → `store-screenshots`
> "expo ikonlarını üret, app.json'ı güncelle" → `expo-icons`
> "CI build hatası: <log>" → `store-deploy`

> **Not:** Bu `wappa-app-skills` deposu skill'lerin **kaynağıdır**; app'i burada değil,
> **yeni/ayrı bir oyun projesi klasöründe** açtır. Skill dosyaları o hedef projeye kurar.

---

## Bağımlılık grafiği

Skill'ler birbirini besler; orkestratör bu sırayı garanti eder. Tek tek kurarken sırayı koru:

```
wappa-games-template  (orkestratör — hepsini sırayla çağırır)
        │
        ├─ wappa-auth ......................... çekirdek. game/auth.ts = tek doğruluk noktası
        │        │  (siteKey + apiUrl buradan okunur)
        │        ├─ wappa-notifications ....... auth'un siteKey/apiUrl'ini kullanır
        │        └─ wappa-leaderboard ......... auth'un user.id + config'ini kullanır
        │                    │
        │                    └─ wappa-mcp-backend  (Score entity + query'leri ÖNCE açar)
        │
        ├─ wappa-ads .......................... welcome/ATT akışına bağlı (bağımsız)
        │
        └─ store-assets ─┬─▶ store-screenshots  görselleri üret + store/ ağacına yerleştir
                         └─▶ store-deploy ...... içerik üret, sonra CI ile push et
```

Kritik kurallar:
- **`game/auth.ts` tek doğruluk noktasıdır.** `siteKey` ve `apiUrl` orada sabit yazılır;
  notifications ve leaderboard bu dosyadan okur (env'e güvenilmez — bkz. SSS).
- **wappa-leaderboard, wappa-mcp-backend olmadan çalışmaz.** Önce MCP ile `Score` entity +
  `score-leaderboard` / `submit-score` query'leri açılmalı; kolon/sorgu adları client ile
  **birebir** aynı olmalı.
- **wappa-notifications**, panelde Firebase (Android) + APNs (iOS) kimlikleri gerektirir →
  bunlar wappa-mcp-backend'in MCP araçlarıyla yüklenir.

---

## Adım 0 — placeholder / kimlik bilgileri referansı

Orkestratör başta bunları sorar/öğrenir ve tüm `{{...}}` placeholder'larını doldurur. Bir
değer henüz yoksa `TODO` bırakılıp ilgili adımda tamamlanır. **Gizli değerleri (Firebase,
AdMob, EAS, panel parolası) uydurma — kullanıcıdan iste.**

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
| `{{WAP_EMAIL}}` / `{{WAP_PASSWORD}}` | MCP panel girişi | `.mcp.json` (gizli!) |
| `{{GOOGLE_WEB_CLIENT_ID}}` | Firebase OAuth "Web client" id | `google-services.json` → `client_type:3` |
| `{{ADMOB_ANDROID_APP_ID}}` / `{{ADMOB_IOS_APP_ID}}` | AdMob **app** id (`~` içerir) | app.json |
| `{{ADMOB_*_REWARDED/INTERSTITIAL/APP_OPEN/BANNER}}` | AdMob **ad-unit** id (`/` içerir), 8 birim | `game/ads.ts` |
| `{{ATT_PERMISSION_TEXT}}` | iOS izleme izni metni | app.json |
| `{{ASC_APP_ID}}` | App Store Connect app id | eas.json submit.ios |
| `{{APPLE_TEAM_ID}}` | Apple Team ID | store-deploy context |
| `{{APP_STORE_TITLE/SUBTITLE/DESCRIPTION/KEYWORDS/PROMO}}` | Mağaza metni | store-assets |
| `{{MARKETING_URL}}` / `{{SUPPORT_URL}}` / `{{PRIVACY_URL}}` / `{{COPYRIGHT}}` | Mağaza URL/telif | store-assets |

> **`~` vs `/` farkı önemlidir:** app.json'a AdMob **APP ID** (`ca-app-pub-XXXX~YYYY`),
> `game/ads.ts`'e **AD UNIT ID** (`ca-app-pub-XXXX/ZZZZ`) yazılır. Karıştırmak reklamların
> hiç dolmamasına yol açar.

---

## Skill'lerin detaylı kullanımı

### 1. wappa-games-template (orkestratör)

> **Şöyle de (Claude Code'a):**
> - _"wappa-app-skills kullanarak yeni oyun app'i oluştur"_
> - _"seker-patlatmaca diye 2048'deki gibi yeni bir oyun app'i iskeletle"_
> - _"bu boş projeye wappa oyun template'ini kur, yarışma da olsun"_

**Amaç:** Wappa altyapılı bir oyun app'ini sıfırdan iskeletler. Oyun içeriği HARİÇ her şeyi
kurar; alt-skill'leri doğru sırada çağırır ve aralarını bağlar.

**Kurar:** proje iskeleti + config (`app.json`, `eas.json`, `package.json`, `babel.config.js`,
`tsconfig.json`, `index.js`, `.env.example`, `.gitignore`, `.easignore`, `README.md`,
`plugins/withKotlinSkipMetadataCheck.js`), ve **derlenip çalışan generic kabuk**
(`App.tsx`, `game/theme.ts`, `screens/*`: Welcome, Home, Game-stub, Settings, Login, Compete).

**Akış:** yukarıdaki [Adım 0–7](#tek-komutla-ne-yapar). `App.tsx`, `HomeScreen.tsx`,
`CompeteScreen.tsx` içinde `// [YARIŞMA]` ile işaretli satırlar vardır — yarışma yoksa Adım 6'da
kaldırılır.

**Ne zaman:** yeni oyun app'i açarken, "2048'deki gibi app yap" derken, bu stack'i başka
uygulamaya kopyalarken.

**Sen ne yaparsın:** `screens/GameScreen.tsx` içine oyun mantığını yazar, oyun bitince
`onGameEnd(score)` çağırırsın.

---

### 1b. wappa-app-template (orkestratör — oyun-olmayan, Expo Router + NativeWind)

> **Şöyle de (Claude Code'a):**
> - _"wappa-app-template kullanarak yeni bir uygulama oluştur (ehliyet quiz gibi)"_
> - _"oyun-olmayan modern bir app iskeletle: Expo Router + Tailwind (NativeWind)"_
> - _"bu boş projeye wappa app template'ini kur, yarışma da olsun"_

**Amaç:** Wappa altyapılı **oyun-olmayan modern** bir uygulamayı sıfırdan iskeletler:
quiz/ehliyet soruları, liste-detay, form, içerik, araç, dashboard… **her tür app**.
`wappa-games-template`'in kardeşidir ve **aynı** altyapı skill'lerini (auth/notifications/
ads/leaderboard/mcp-backend/store) kullanır; fark **kabuk + stil + navigasyon**tadır.

**Modern stack:** **Expo Router** (dosya tabanlı navigasyon, typed routes) + **NativeWind**
(Tailwind CSS, `className` + light/dark) + yeniden kullanılabilir **UI bileşen kiti**.

**Kurar:** `app/*` (Expo Router route'ları: `_layout`, `index`, `welcome`, `settings`,
`login`, `compete`), `components/ui/*` (`Screen`, `Button`, `Card`, `Field`, `ListItem`,
`Header`), `lib/theme.ts` + `lib/app-state.tsx`, NativeWind config (`tailwind.config.js`,
`metro.config.js`, `global.css`, `babel.config.js`, `nativewind-env.d.ts`), `tsconfig.json`
(`@/` yol kısayolu), `app.json` (scheme + expo-router plugin + typed routes).

**games-template'ten 3 kritik fark (SKILL.md'de detaylı):**
1. Alt-skill dosyaları `game/` yerine **`lib/`** altına konur (`lib/auth.ts`, `lib/ads.ts` …).
2. `WappaAuthProvider` sarmalaması `index.js`'te değil **`app/_layout.tsx`**'te (`index.js` YOK;
   `main: "expo-router/entry"`).
3. Ekranlar bu template'ten (Expo Router + NativeWind); alt-skill'lerin StyleSheet'li örnek
   ekranları kullanılmaz — yalnızca mantık modülleri (`lib/*.ts`) alınır.

**Sen ne yaparsın:** `app/index.tsx`'i kendi ana ekranınla değiştirir, yeni ekran için
`app/` altına dosya eklersin (ör. `app/quiz.tsx` → `/quiz`); stil için NativeWind `className`
ve `components/ui` kitini kullanırsın.

---

### 2. wappa-auth (Google / Apple giriş)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine Google ve Apple ile giriş ekle"_
> - _"bu app'e wappa-auth ile sosyal login kur"_
> - _"Google girişi 'webClientId is required' hatası veriyor, düzelt"_

**Amaç:** `@appaflytech/wappa-auth` SDK'sı ile **yalnızca Google ve Apple** sosyal girişi.
E-posta/şifre yoktur. `WappaAuthProvider` app'i sarar, `useWappaAuth()` her yerden oturum
durumu + login fonksiyonları verir.

**Kurar:** `game/auth.ts` (siteKey/apiUrl/webClientId config'i — **tek doğruluk noktası**),
`index.js` (provider sarmalama), `screens/LoginScreen.tsx`, `plugins/withFirebaseNonModularHeaders.js`,
`plugins/withRNFirebaseStaticFramework.js`, `.env.example`.

**Ön koşullar (sen hazırlarsın):** Firebase projesi (iOS+Android app), `google-services.json`
(Android, kök) + `GoogleService-Info.plist` (iOS, kök), OAuth "Web client" ID (`client_type:3`),
Apple Developer'da "Sign In with Apple" capability, Wappa site key.

**Bağımlılıklar:** `@appaflytech/wappa-auth@^0.0.4`, `@react-native-firebase/app@^25.1.0`,
`@react-native-firebase/auth@^25.1.0`, `@react-native-google-signin/google-signin@^16.1.2`,
`expo-apple-authentication@~56.0.4`, `expo-secure-store@~56.0.4`, `expo-build-properties@~56.0.21`.

**API:**
```ts
const { isAuthenticated, user, loginWithGoogle, loginWithApple, loading } = useWappaAuth();
const result = await loginWithGoogle();
if (result === undefined) { /* provider init olmadı (controller=null) — modal açılmadı */ }
```

**Kritik uyarılar:**
- **`webClientId`/`siteKey` SABİT yazılır**, env'den okunmaz — bu stack'te `EXPO_PUBLIC_*`
  bundle'a güvenilir inline edilmez (bkz. SSS). Env yalnızca opsiyonel `||` fallback'i.
- **iOS static frameworks** — react-native-firebase iki config plugin gerektirir; app.json'da
  `ios.useFrameworks: "static"` + `ios.usePrecompiledModules: false`. Plugin sırası önemli
  (local firebase plugin'leri firebase plugin'lerinden önce).
- LoginScreen'de **iptal tespiti** (`isCancel`) ve **`controller===null`** tespiti şablonda hazır.

---

### 3. wappa-notifications (FCM push)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine push bildirimi ekle"_
> - _"bu app'te FCM token'ı panele kaydet, bildirime dokununca ilgili ekrana yönlensin"_
> - _"panelden dil bazlı push gönderebileyim, gerekli teli App.tsx'e kur"_

**Amaç:** Wappa paneli üzerinden yönetilen FCM push. Cihaz token üretir, panele kaydeder
(`POST {apiUrl}/push-tokens`); hedefleme ve gönderim panelde yapılır. Bildirime dokununca
`data.screen` ile ilgili ekrana yönlenir.

**Kurar:** `game/notifications.ts` (`startPush`/`stopPush`). `siteKey`/`apiUrl` `./auth`'tan gelir.

**Ön koşullar:** `wappa-auth` kurulu olmalı (config kaynağı); panelde Firebase (Android) +
APNs (iOS) kimlikleri yüklü olmalı → `wappa-mcp-backend` ile.

**Bağımlılıklar:** `@appaflytech/wappa-notifications@^0.0.7`, `@react-native-firebase/messaging@^25.1.0`,
`expo-notifications@~56.0.20`. app.json `plugins`'e `expo-notifications` ekle.

**App.tsx teli (özet):**
```tsx
useEffect(() => {
  if (!welcomeDone) return;            // izin onboarding SONRASI istenir
  let ctrl = null, cancelled = false;
  startPush({ publicUserId: user?.id, onTap: handlePushTap })
    .then(c => { cancelled ? c.remove() : (ctrl = c); }).catch(() => {});
  return () => { cancelled = true; ctrl?.remove(); };
}, [welcomeDone, user?.id, handlePushTap]);
// çıkışta: await stopPush();
```

**Hedefleme:** `publicUserId` (kimlik bazlı) ve `language` (dil bazlı) opsiyonel; verilmezse
token yalnızca siteKey ile "tüm cihazlar" hedeflemesine girer.

**Notlar:** `startPush` asla throw etmez; push **fiziksel cihaz** ister (iOS simülatörde çalışmaz).

---

### 4. wappa-ads (AdMob + iOS ATT)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine AdMob reklamlarını ve iOS ATT iznini ekle"_
> - _"oyun bitince geçiş reklamı, 'devam et' için ödüllü reklam göster"_
> - _"ekranın altına adaptif banner koy"_

**Amaç:** Google AdMob (ödüllü / geçiş / app-open / banner) + iOS App Tracking Transparency.
Web ve Expo Go'da güvenle **no-op**; yalnızca native build'lerde çalışır.

**Kurar:** `game/ads.ts` (merkezi reklam yöneticisi + frekans sınırları + NPA/ATT uyumu),
`game/tracking.ts` (ATT yardımcıları), `components/AdBanner.tsx` (adaptif banner).

**Bağımlılıklar:** `react-native-google-mobile-ads@^16.4.0`, `expo-tracking-transparency@~56.0.5`.
app.json'a AdMob plugin (app id'ler), ATT plugin (izin metni), Android `AD_ID` izni.

**Kritik sıra:** önce ATT izni iste (welcome "Başla"da `requestTracking()`), **sonra** reklam
SDK'sını başlat (`initAds()`). İzin verilene kadar reklamlar **NPA** (non-personalized).

**API:** `initAds()`, `showRewarded(onReward, opts?)`, `onGameOver(now)`, `showAppOpen(now)`,
`<AdBanner/>`, `adsAvailable`.
```tsx
showRewarded(() => continueGame());                       // devam et / 2× skor
showRewarded(() => doubleScore(), { fallbackReward:false }); // ödülü reklama bağla
onGameOver(Date.now());                                    // oyun bitişi (frekans sınırlı)
```

**Frekans sınırları (retention ayarı):** `INTERSTITIAL_EVERY_N_GAMES=2`,
`INTERSTITIAL_MIN_GAP_MS=90_000`, `APP_OPEN_COOLDOWN_MS=4*60_000`. Retention için büyüt.

**Uyarılar:** `~` (app id, app.json) vs `/` (ad unit id, ads.ts) karıştırma. `__DEV__`'de
**Google test reklamı** çıkar — kendi gerçek reklamına dev'de **asla tıklama** (hesap askıya alınır).
Store'da App Privacy (iOS) + Data safety (Android, `AD_ID`) beyanı gerekir.

---

### 5. wappa-mcp-backend (MCP ile backend)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine Wappa MCP sunucusunu kur"_
> - _"leaderboard için Score entity'sini ve score-leaderboard / submit-score query'lerini MCP ile aç"_
> - _"panele Firebase (Android) ve APNs (iOS) push kimliklerini yükle"_

**Amaç:** Projeyi Wappa admin backend'ine `wappa-mcp` MCP sunucusuyla bağlar. Entity, query
ve push kimlikleri artık Claude Code içinden **MCP tool'larıyla** yönetilir.

**Kurar:** `.mcp.json` (kök) + MCP ile: `Score` entity ve `score-leaderboard` / `submit-score`
query'leri; ayrıca push kimlikleri (`wappa_set_firebase_credential`, `wappa_set_apns_credential`).

**`.mcp.json` env:** `WAP_ADMIN_API_URL`, `WAP_SITE_KEY`, `WAP_EMAIL`, `WAP_PASSWORD`,
`WAP_LANGUAGE=en-us`, `WAPPA_PROJECT_ROOT="."`. Sunucu anahtarı = site key → tool adları
`mcp__{{SITE_KEY}}__wappa_*` biçiminde çıkar.

**MCP yeniden yükleme:** `.mcp.json` ekleyince Claude Code'u yeniden başlat veya `/mcp` ile bağla.
İlk çalıştırmada `npx` paketi indirir (kısa gecikme normal).

**Score entity kolonları** (client ile birebir kontrat): `PlayerName`(Text, zorunlu),
`Score`(Number, zorunlu), `Avatar`(Text), `UserId`(Text), `ScoreDate`(DateOnly `YYYY-MM-DD`).
`Order`/`Id` otomatik eklenir. `hasPageRelation:false` (değiştirilemez), `accessType:3`.

**Query sözleşmesi:**
- `score-leaderboard` (GET) — skora göre **azalan**; opsiyonel `?scoreDate=YYYY-MM-DD` günlük filtre;
  field alias'ları client'ın beklediği camelCase (`playerName/score/avatar/userId/scoreDate`).
- `submit-score` (insert) — canlıda `httpMethod:"create"` görüldü (tool enum'u GET/POST/PUT/DELETE
  listeler → **tutarsızlık**). Yazmadan önce mevcut bir insert query'sini `wappa_get_query` ile
  aç, kalıbı **call anında doğrula**, uydurma.

**Kritik:** İsim/alias uyumsuzluğu sessiz boş sonuç veya 404 üretir. Query adları
(`score-leaderboard`, `submit-score`) `game/leaderboard.ts` çağrılarıyla birebir eşleşmeli.

> UI API (client, `wappa-ui-api...`) ile Admin API (MCP, `wappa-admin-api...`) **ayrı adreslerdir**
> — karıştırma. Read-only doğrulama: `wappa_list_entities`, `wappa_list_queries`, `wappa_run_query`.

---

### 6. wappa-leaderboard (yarışma / skor tablosu)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine yarışma/leaderboard ekle (günlük + tüm zamanlar)"_
> - _"yeni kişisel rekorda skoru otomatik gönder, kendi satırımı highlight et"_
> - _"CompeteScreen'i skor tablosuna bağla"_

**Amaç:** Gerçek (backend'e bağlı) yarışma: günlük + tüm zamanlar sıralaması, kişisel rekorda
skor gönderme, kendi satırını highlight, anonim oyuncular için giriş bandı. Ek npm bağımlılığı
**yok** (sadece `fetch`).

**Kurar:** `game/leaderboard.ts` (zorunlu client), `screens/CompeteScreen.tsx` (örnek ekran).

**Bağımlılıklar:** `wappa-mcp-backend` (Score entity + query'ler — **önce kurulmalı**) ve
`wappa-auth` (user.id + `game/auth.ts` config). `apiUrl`/`siteKey` `./auth`'tan import edilir.

**API:**
```ts
fetchLeaderboard(scope: 'daily'|'all', me?: ScoreUser): Promise<LeaderboardRow[]>
submitScore({ userId, name, score, avatar? }): Promise<boolean>
userDisplayName(user): string
```
`fetchLeaderboard` kullanıcı başına **en yüksek** skoru tutar (dedupe), azalan sıralar, `rank`
atar; `me` verilirse kendi satırına `me:true` koyar.

**Entegrasyon:** Skoru **yalnızca** giriş yapılmış + **yeni kişisel rekor** varsa gönder;
`preGameBestRef` (oyuna girerkenki rekor) ve `lastSubmittedRef` (oturumda gönderilen) ile
tekrar yazımı engelle. CompeteScreen açılınca `daily`+`all` paralel çekilir.

**Çalıştırma yolu:** `{apiUrl}/{site}/queries/en-us/{name}/run[?scoreDate=YYYY-MM-DD]`.

---

### 7. store-assets (mağaza metni & görseller)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi için App Store ve Play mağaza metnini (başlık, açıklama, anahtar kelimeler) yaz"_
> - _"store.config.json'a Türkçe ve İngilizce listelemeyi ekle"_
> - _"Android feature graphic ve ekran görüntülerinin boyutlarını söyle, fastlane metadata'yı hazırla"_

**Amaç:** App Store + Google Play **listeleme metni ve görsellerini KOD olarak** üretmek.
İçeriği üretir; **push ETMEZ** (push işi `store-deploy` Mod D).

**Kurar/düzenler:**
- **iOS:** `store.config.json` (EAS Metadata, yalnızca Apple). `apple.info.<locale>`: `title`(30),
  `subtitle`(30), `promoText`(170), `description`(4000), `keywords`(virgülle birleşik 100),
  URL'ler; `categories`, `advisory` (reklam varsa `advertising:true`), `screenshots`.
- **Android:** `fastlane/metadata/android/<locale>/`: `title.txt`(30), `short_description.txt`(80),
  `full_description.txt`(4000) + `images/` (icon 512×512, featureGraphic **1024×500 zorunlu**,
  phone/tablet screenshots).

**Görsel boyutları:** iOS app icon 1024×1024, iPhone 6.9" **1290×2796** (zorunlu, 2024+ tek
zorunlu set), iPad 13" 2064×2752 (`supportsTablet:true` ise zorunlu). Play icon 512×512,
feature graphic 1024×500, telefon 1080×1920 (min 2 max 8).

**Uyarılar:** İngilizce locale `en-US/en-GB/en-AU/en-CA` — **`en-UK` GEÇERSİZ**. iOS Türkçe `tr`
(bölgesiz), Android `tr-TR`. `store/` ve `fastlane/` **`.easignore`** ile bundle'dan hariç.
Doğrulama: `eas metadata:lint`; `eas metadata:pull` **dosyanın üstüne yazar** (dikkat).

> **Görselleri otomatik üretmek istiyorsan → `store-screenshots` (aşağıda #8).** Bu skill
> yalnızca metni + görsel yerleşimi/klasör düzenini tanımlar; çerçeveli-başlıklı pazarlama
> ekran görüntülerini üretip doğru boyutlarda buraya yerleştirmek store-screenshots'un işidir.

---

### 8. store-screenshots (mağaza pazarlama görselleri)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi için App Store ve Play mağaza ekran görüntülerini üret (cihaz çerçeveli, başlıklı)"_
> - _"src/*Screen.js'i incele, hangi ekranların çekileceğine ve başlıklarına karar verip screenshots.config.js'i doldur"_
> - _"feature graphic ve telefon ekran görüntülerini üretip store/ + fastlane/ ağacına yerleştir"_
> - _"ekran görüntüsü çekmeden önce reklamları kapat (banner return null)"_

**Amaç:** Bir oyunun App Store + Google Play **pazarlama ekran görüntülerini** (cihaz çerçeveli,
başlıklı, reklam-stili slaytlar) **KOD olarak** üretir ve `store-assets` düzenine doğru boyut/adla
yerleştirir. Dış editöre gerek yok — çerçeve, başlık, arka plan ve boyutlandırma `sharp` ile yapılır.
Bu skill **GÖRSEL** tarafıdır; **metin** `store-assets`, **mağazaya PUSH** `store-deploy` işidir.

**Kurar/üretir:** projeye `screenshots.config.js` (slayt/başlık/tema tanımı); `store/apple/screenshot/
<locale>/APP_IPHONE_67/` (1290×2796) + `APP_IPAD_PRO_3GEN_129/` (2064×2752), `fastlane/metadata/
android/<locale>/images/phoneScreenshots/` (1080×1920), `featureGraphic.png` (1024×500), `icon.png`
(512×512); `--patch-config` ile `store.config.json` screenshots haritasını yamalar.

**Betikler** (hepsi self-bootstrapping `sharp`; proje bağımlılığı gerekmez, yalnızca `node`):
`capture-screens.js` (çalışan simülatör/emülatörden ham kare), `build-screenshots.js` (ham kare +
config → çerçeveli/başlıklı mağaza boyutunda görsel), `place-screenshots.js` (boyuta göre `store/` +
`fastlane/` ağacına yerleştir), `screenshots.config.example.js` (kopyalanacak örnek config).

**Akış (kod tabanlı, editörsüz):**
```bash
# a) config'i doldur (ajan src/*Screen.js'i okuyup slayt+başlık önerir)
# b) reklamları KAPAT (banner return null), sonra ham kareleri yakala:
node ~/.claude/skills/store-screenshots/templates/capture-screens.js \
  --platform ios --out ./raw --names welcome,game,boosters,compete,reward
# c) çerçeve + başlık + arka plan + tam mağaza boyutu:
node ~/.claude/skills/store-screenshots/templates/build-screenshots.js \
  --config ./screenshots.config.js --raw ./raw --out ./export
# d) boyuta göre yerleştir (önce --dry-run):
node ~/.claude/skills/store-screenshots/templates/place-screenshots.js \
  --from ./export --locale tr --project . --patch-config
```

**⚠️ Ekran görüntülerinde reklam OLMAZ.** Store'lar reklamlı görseli reddeder. Yakalamadan **ÖNCE**
banner'ı `return null` yap ve geçiş/app-open tetikleme; **çektikten SONRA** `git checkout` ile geri al
(reklamsız kod release'e gitmemeli). İlk 2 kare en kritiktir (aramada yalnızca onlar görünür) — en
güçlü faydayı öne al, başlık ≤5 kelime, ilk kareye ayrıştırıcı rozet ("REKLAMSIZ" vb.) koy.

**Zorunluluklar (betik uyarır):** iOS iPhone 6.9" en az 1; `ios.supportsTablet:true` ise iPad 13"
seti de zorunlu. Android telefon min 2 max 8, feature graphic **1024×500 zorunlu**. Locale: `--locale tr`
hem iOS (`tr`) hem Android (`tr-TR`) kodunu türetir; her dil için ayrı çalıştır (başlık dile göre değişir).

**Alternatif:** ParthJadhav'ın `app-store-screenshots` görsel editörünün ZIP export'unu da yine
`place-screenshots.js --from ./export` ile yerleştirebilirsin.

---

### 9. store-deploy (CI/CD + yayın)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine GitLab CI (EAS local build) pipeline'ını kur"_
> - _"CI build hatası veriyor, işte log: <gitlab-ios.log> — teşhis edip düzelt"_
> - _"v1.2.0 sürümünü çıkar (git tag)"_ / _"mağaza metnini stores'a push et"_

**Amaç:** EAS local build + self-hosted macOS runner kullanan Expo projelerinin GitLab CI'ını
yönetir; sürüm çıkarmayı (git tag) ve mağaza metni push'unu yürütür. Projeye özgü değerleri
her çalıştırmada **Adım 0** ile repo kökünden keşfeder (hardcode yok).

**Kurar (Mod E — yeni proje):** `templates/.gitlab-ci.yml` → kök `.gitlab-ci.yml` (`{{BUNDLE_ID}}`,
`{{APP_NAME}}`, macOS runner tag'i doldurulur); `templates/store-deploy.context.md` →
`.claude/store-deploy.context.md` (proje kökünde, skill klasörünün İÇİNDE değil).

**Modlar:**
- **A** — başarısız build'i teşhis (log'da hata kalıbı ara, kök satırı bul).
- **B** — bilinen düzeltmeler: iOS imza temizliği (stale distribution cert), Android
  `lintVitalAnalyzeRelease` crash'ini config plugin ile kapatma, jenv/Gradle lock vb.
- **C** — sürüm yayınla: `git tag vX.Y.Z && git push origin vX.Y.Z` (pipeline yalnızca tag'de).
- **D** — mağaza metni push: iOS `eas metadata:push`, Android `fastlane supply` (validate önce).

**Kritik kurallar:** `git push`/`git tag`/`eas submit`/`metadata:push`/`fastlane supply` gibi
**dışa dönük** işlemleri **onaysız yapma**. Keychain durumu için **kullanıcının kendi terminal
çıktısına** güven — Bash aracıyla `security` çalıştırıp sonuç çıkarma (sandbox gerçek keychain'i
yansıtmaz). Sürüm = yeni git tag; tag tekrar atılamaz.

---

### 10. expo-icons (ikon & splash üretimi)

> **Şöyle de (Claude Code'a):**
> - _"2048-cakmasi projesine expo ikonlarını üret, app.json'ı da güncelle"_
> - _"assets klasörüne ikonları oluştur, kaynak logo ./assets/logo-mark.png, arka plan #faf8ef"_
> - _"iOS ikonunda siyah kutu çıkıyor / Android adaptive ikon kırpılıyor, düzelt"_
> - _"açık ve koyu temalı splash ekranı ekle"_

**Amaç:** Tek bir kaynak logodan bir Expo app'inin `assets/` klasöründe **gereken tüm ikon ve
açılış görsellerini** üretir ve `app.json`'a ilgili alanları (`icon`, `android.adaptiveIcon`,
`web.favicon`) ile `expo-splash-screen` plugin'ini ekler/günceller.

**Kurar/üretir:** `assets/` altına `icon.png` (1024, **opak**), `icon-512.png`, `adaptive-icon.png`
(**şeffaf**, %66 güvenli alan), `splash-icon.png` + `splash-icon-dark.png` (şeffaf), `favicon.png`
(48), `logo-mark.png`. `--app-json` verilirse `app.json` **birleştirici** yamalanır (mevcut plugin
listesi ve diğer alanlar korunur).

**Betik:** `templates/generate-icons.js`. **Proje bağımlılığı gerekmez** — `sharp` yoksa
`~/.cache/wappa-icons`'a tek seferlik `--no-save` kurup oradan yükler; yalnızca `node` yeterli.

**Elle çalıştırma** (proje kökünde):
```bash
node ~/.claude/skills/expo-icons/templates/generate-icons.js \
  --source ./assets/logo-mark.png --out ./assets \
  --bg "#faf8ef" --adaptive-bg "#bbada0" --splash-dark-bg "#1c1c1e" \
  --app-json ./app.json          # bu satırı silersen app.json'a dokunulmaz
```

| Bayrak | Varsayılan | Açıklama |
|---|---|---|
| `--source` | otomatik (`assets/logo-mark.png`→`icon.png`) | Kaynak logo (kare, ≥1024, tercihen şeffaf PNG) |
| `--source-dark` | `--source` | Koyu splash için ayrı logo (opsiyonel) |
| `--out` | `./assets` | Çıktı klasörü |
| `--bg` | `#ffffff` | `icon.png`/favicon arka planı (opak) |
| `--adaptive-bg` | `--bg` | Android adaptive arka planı → app.json'a yazılır |
| `--splash-dark-bg` | `#000000` | Koyu splash arka planı → app.json'a yazılır |
| `--app-json` | (yok) | Verilirse app.json yamalanır |

**Uyarılar:** `icon.png` **opak** olmalı (App Store alpha'lı ikonu reddeder) — betik alpha kanalını
siler. Android adaptive foreground kenarları maskelenir → logo %66 güvenli alanda tutulur.
`expo-splash-screen` çalışması için pakete gerek: `npx expo install expo-splash-screen`.
Doğrulama: `sips -g hasAlpha assets/icon.png` → `no`; `assets/adaptive-icon.png` → `yes`.

---

## Uçtan uca doğrulama

Orkestratör kurulumdan sonra:

1. **Typecheck:** `bun run typecheck` (veya `npm run typecheck`) temiz geçer.
2. **Dev build:** `npx expo run:ios` / `run:android` → Welcome → (iOS) ATT izni → Home →
   Game placeholder → Settings/Login (Google/Apple modalı **açılır**) → (varsa) Compete tablosu.
3. **Push:** fiziksel cihazda panele token düşer, test bildirimi gelir, dokununca `data.screen`'e gider.
4. **Reklam:** dev'de her yerde **test reklamı** çıkar; ATT prompt'u welcome "Başla"da görünür.
5. **Yarışma:** giriş yap → yeni kişisel rekor kır → `submit-score` çağrılır → `score-leaderboard`'da
   görünür (kendi satırın highlight'lı, günlük sekmesi her gün sıfırlanır).
6. **Yayın:** git tag at → CI build; `submit_*` / `metadata_*` job'ları manuel.

---

## Sorun giderme (SSS)

**Skill'ler görünmüyor / symlink kırık.**
Depoyu taşıdıysan/yeniden adlandırdıysan symlink'ler mutlak yola bağlı olduğu için kırılır.
`./install.sh`'i yeni konumdan çalıştır, sonra Claude Code'u yeniden başlat.
Kontrol: `ls -l ~/.claude/skills | grep wappa` → hedefler bu depoyu göstermeli.

**Google girişi "webClientId is required" veriyor / modal açılmıyor.**
Bu stack'te `EXPO_PUBLIC_*` env bundle'a güvenilir inline **edilmez** → runtime'da `undefined`.
Çözüm: `webClientId`/`siteKey`/`apiUrl` değerlerini `game/auth.ts`'e **sabit** yaz (şablon zaten
böyle). Bunlar gizli değildir (google-services dosyalarında da var). Modal hâlâ açılmıyorsa
`WappaAuthProvider` app root'unu sarmıyor olabilir → `index.js`'i kontrol et (`controller===null`).

**iOS build react-native-firebase hatası** (`non-modular-include`, `RCTPromiseRejectBlock…`,
`unknown type name RCT_EXTERN`). Static framework fix'leri eksik/yanlış sırada. app.json:
`ios.useFrameworks:"static"` + `usePrecompiledModules:false`; iki firebase config plugin'i firebase
plugin'lerinden **önce** gelmeli. Her `expo prebuild` android/ios'u sıfırlar → düzeltmeler
config plugin olarak yaşamalı, elle Podfile düzenleme silinir.

**Leaderboard boş / 404.** Query veya alias adı uyuşmuyor. `game/leaderboard.ts`'deki query
adları (`score-leaderboard`, `submit-score`) ve alias'lar backend'deki (MCP ile açılan) adlarla
**birebir** eşleşmeli. `wappa_list_queries` ile doğrula.

**Push token panele düşmüyor.** Simülatörde push çalışmaz — fiziksel cihaz kullan. İzin
onboarding'den sonra istenir (`welcomeDone`). Panelde Firebase/APNs kimlikleri yüklü mü kontrol et.

**Reklam görünmüyor / hesap riski.** Dev'de daima **test reklamı** çıkmalı; gerçek reklam
görüyorsan `__DEV__` yolu yanlış — durdur, tıklama. Yeni ad unit'lerde prod'da "no fill" birkaç
saat normal olabilir.

**CI build patlıyor.** `store-deploy` skill'ini çağır, build log'unu ver → Mod A teşhis + Mod B
düzeltme. iOS imza ve Android lint crash en sık iki kök neden.

---

## Güvenlik notları

- **`.mcp.json` düz metin admin e-posta + parola içerir.** Paylaşılan repoda commit'lenirse
  sızar. `.gitignore`'a ekle veya yalnızca placeholder'lı `.mcp.json.example` tut; mümkünse
  az yetkili panel kullanıcısı kullan.
- **Fastlane/Play service account key'i** (`SUPPLY_JSON_KEY`) ve **APNs .p8** dosyalarını
  repoya koyma.
- `google-services.json` / `GoogleService-Info.plist` client config'tir (gizli değil), ama
  repoya koyup koymamak sana kalmış.
- Dışa dönük işlemler (`git push/tag`, `eas submit`, `metadata:push`, `fastlane supply`)
  **onaysız yapılmaz**.

---

## Depo yapısı

```
wappa-app-skills/
├── install.sh                 # skill'leri ~/.claude/skills/'e symlink'ler (idempotent)
├── README.md                  # bu dosya
├── wappa-games-template/      # orkestratör (oyun)
│   ├── SKILL.md
│   └── templates/             # App.tsx, app.json, eas.json, screens/*, game/theme.ts …
├── wappa-app-template/        # orkestratör (oyun-olmayan): Expo Router + NativeWind
│   ├── SKILL.md
│   └── templates/             # app/* (router), components/ui/*, lib/*, tailwind/metro/global.css …
├── wappa-auth/                # SKILL.md + templates/ (game/auth.ts, plugins, LoginScreen)
├── wappa-notifications/       # SKILL.md + templates/ (game/notifications.ts)
├── wappa-ads/                 # SKILL.md + templates/ (game/ads.ts, tracking.ts, AdBanner)
├── wappa-leaderboard/         # SKILL.md + templates/ (game/leaderboard.ts, CompeteScreen)
├── wappa-mcp-backend/         # SKILL.md + templates/ (.mcp.json)
├── store-assets/              # SKILL.md + templates/ (store.config.json, fastlane/…)
├── store-screenshots/         # SKILL.md + templates/ (capture/build/place-screenshots.js, config örneği)
├── store-deploy/              # SKILL.md + templates/ (.gitlab-ci.yml, context.md)
└── expo-icons/                # SKILL.md + templates/ (generate-icons.js)
```

Her skill kendi kendini belgeler (`SKILL.md`); en güncel ve ayrıntılı davranış oradadır.
Bu README bir üst-harita ve hızlı başlangıç rehberidir.
