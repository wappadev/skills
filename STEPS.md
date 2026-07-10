# STEPS.md — Sıfırdan yayına, adım adım (Claude Code çalıştırır)

Bu dosya bir **runbook**tur: Wappa altyapılı **oyun-olmayan** bir uygulamayı iskeletten mağaza
yayınına kadar **adım adım** kurar. Her adımın sonunda bir **Test ✅** kapısı vardır; kapı
geçmeden bir sonraki adıma **geçme**.

> **Oyun mu yapıyorsun?** Bu runbook `wappa-app-template` (Expo Router + NativeWind) içindir.
> Oyun için `wappa-games-template` kullan — ekran/stil adımları (Adım 1, 6) değişir, altyapı
> adımları (auth/push/ads/yarışma/store) **aynıdır**.

---

## Nasıl kullanılır (Claude Code'a talimat)

**Hedef projenin (yeni/boş klasör) içinde** Claude Code'a şunu de:

> **"STEPS.md'yi baştan sona adım adım uygula. Her adımı bitince o adımın Test bloğunu
> çalıştır; test geçmeden sonrakine geçme. Gizli değer (Firebase/AdMob/EAS/panel parolası)
> gerekirse bana sor, uydurma. `git push`/`git tag`/`eas submit`/`metadata:push`/`fastlane
> supply` gibi dışa dönük işlemleri onayımı almadan yapma."**

### Claude Code için kurallar
- **Test kapısı zorunlu.** Bir adımın Test'i başarısızsa **dur**, düzelt, tekrar dene; sessizce
  geçme. Testi çalıştıramadıysan (ör. fiziksel cihaz yok) bunu **açıkça söyle**, atlama diye işaretle.
- **Sırayı koru.** Skill'ler birbirini besler (auth → notifications/leaderboard; store-assets →
  store-deploy). Sıra atlanırsa importlar patlar.
- **Gizli değerleri uydurma** — Adım 0 tablosundan al; yoksa kullanıcıdan iste, `TODO` bırak.
- **Bu template'in 3 kuralı** (her altyapı adımında geçerli): dosyalar `game/` değil **`lib/`**
  altına; provider `index.js`'te değil **`app/_layout.tsx`**'te (index.js YOK); ekranlar bu
  template'ten (NativeWind + Expo Router), alt-skill'lerin StyleSheet'li ekranları kullanılmaz.

---

## Adım 0 — Ön hazırlık & kimlik bilgileri

**Ne yap:** Ortamı ve değerleri hazırla. Bunları topla (yoksa `TODO`, ilgili adımda tamamla):

| Değer | Ne | Kaynak |
|---|---|---|
| `APP_NAME` / `APP_SLUG` / `APP_SCHEME` | Ad / slug / derin link şeması | sen belirle (scheme: harf-rakam, boşluksuz) |
| `BUNDLE_ID` | iOS+Android paket id (son segment rakamla başlamaz) | ör. `com.appaflytech.uygulama` |
| `EAS_OWNER` / `EAS_PROJECT_ID` | Expo owner / proje id | `eas init` |
| `SITE_KEY` | Wappa panel site key | Wappa panel |
| `WAP_EMAIL` / `WAP_PASSWORD` | MCP panel girişi | Wappa panel (gizli) |
| `GOOGLE_WEB_CLIENT_ID` | OAuth "Web client" id | `google-services.json` → `client_type:3` |
| `ADMOB_*_APP_ID` / `ADMOB_*_UNIT` | AdMob app id (`~`) + ad-unit id (`/`) | AdMob paneli |
| `ATT_PERMISSION_TEXT` | iOS izleme izni metni | sen yaz |
| `ASC_APP_ID` / `APPLE_TEAM_ID` | App Store Connect app id / Apple Team ID | Apple Developer |

**Gerekli araçlar:** `node`, `bun` (veya npm), `git`, `npx expo` / `eas` CLI, Xcode (iOS) +
Android SDK. Push testi için **fiziksel cihaz** gerekir (simülatörde push çalışmaz).

**Test ✅**
- [ ] `node -v`, `bun -v`, `npx expo --version`, `eas --version` çalışıyor.
- [ ] Boş/yeni proje klasöründesin (bu `wappa-app-skills` deposunun İÇİNDE değil).

---

## Adım 1 — Proje iskeleti + tasarım sistemi

**Skill:** `wappa-app-template` (Adım 1–2).
**Ne yap:** Template'ten kopyala ve `{{...}}` placeholder'larını Adım 0 değerleriyle doldur:
- Config: `app.json` (scheme + expo-router + typed routes), `package.json` (`main: expo-router/entry`),
  `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`,
  `tsconfig.json` (`@/` yolu), `eas.json`, `.gitignore`, `.easignore`, `.env.example`, `README.md`,
  `plugins/withKotlinSkipMetadataCheck.js`.
- Kabuk: `app/*` (`_layout`, `index`, `welcome`, `settings`, `login`, `compete`),
  `components/ui/*` (Screen, Button, Card, Field, ListItem, Header), `lib/theme.ts`, `lib/app-state.tsx`.
- **`index.js` OLUŞTURMA.** Bağımlılıkları kur: `bun install` → `bunx expo install --fix`
  (expo-router, nativewind, react-native-safe-area-context, react-native-screens sürümlerini hizalar).
- `eas init` ile `EAS_OWNER` + `EAS_PROJECT_ID` al, app.json'a yaz.

**Test ✅**
- [ ] `app/`, `components/ui/`, `lib/`, `tailwind.config.js`, `metro.config.js`, `global.css` yerinde.
- [ ] `package.json` `main` = `expo-router/entry`; `index.js` **yok**.
- [ ] `bun install` hatasız. (Not: `typecheck` bu adımda **beklenen şekilde** patlar — `lib/auth.ts`
      vb. altyapı modülleri Adım 2–4'te gelecek. Tam derleme Adım 4 sonunda yeşile döner.)

---

## Adım 2 — Sosyal giriş (Google / Apple)

**Skill:** `wappa-auth`. **Bu template'e uyarla:**
- `game/auth.ts` yerine **`lib/auth.ts`** oluştur (`webClientId`/`siteKey`/`apiUrl` **SABİT** —
  env'e güvenme). Provider **`app/_layout.tsx`**'te zaten var; **index.js oluşturma**.
- Firebase config plugin'lerini `plugins/`'e ekle (`withFirebaseNonModularHeaders`,
  `withRNFirebaseStaticFramework`) — app.json plugin listesi bunlara referans veriyor.
- `LoginScreen` **kopyalama**; `app/login.tsx` hazır.
- Firebase dosyalarını köke koy: `google-services.json` (Android) + `GoogleService-Info.plist` (iOS).

**Test ✅**
- [ ] `lib/auth.ts` var, `wappaAuthConfig` export ediyor; `_layout.tsx` bunu `@/lib/auth`'tan alıyor.
- [ ] Firebase dosyaları kökte; `app.json` `ios.useFrameworks:"static"` + `usePrecompiledModules:false`.

---

## Adım 3 — Push bildirimleri (FCM)

**Skill:** `wappa-notifications`. **Ne yap:** `game/notifications.ts` yerine **`lib/notifications.ts`**.
`app/_layout.tsx` zaten `startPush`/`stopPush` kablolarını içerir (welcome sonrası izin,
`publicUserId` ile kimlik hedefleme, `data.screen` → `router.push`, çıkışta unregister).
Panel tarafı (Firebase/APNs kimlikleri) Adım 5'te (wappa-mcp-backend) yüklenir.

**Test ✅**
- [ ] `lib/notifications.ts` var, `startPush`/`stopPush` export ediyor; `_layout.tsx` + `settings.tsx` çözülüyor.

---

## Adım 4 — Reklam + iOS ATT  ·  🟢 İLK TAM DERLEME

**Skill:** `wappa-ads`. **Ne yap:** `lib/ads.ts`, `lib/tracking.ts`, `components/AdBanner.tsx`.
app.json'da AdMob + expo-tracking-transparency plugin'leri zaten var; ad-unit id'lerini `lib/ads.ts`'e,
app id'lerini app.json'a gir (**`~` app id vs `/` ad-unit id** karıştırma).
**Reklam istemiyorsan:** bu dosyaları ekleme; `_layout.tsx`/`welcome.tsx`/`index.tsx`'teki
`initAds`/`showAppOpen`/`requestTracking`/`<AdBanner/>` (`// [OPSIYONEL]`) satırlarını kaldır.

**Test ✅** (artık tüm `lib/` modülleri hazır → proje derlenir)
- [ ] `bun run typecheck` **temiz** geçer.
- [ ] `npx expo run:ios` (veya `run:android`) → **Welcome** → (iOS) **ATT izni** → **Home**
      (NativeWind kartları, koyu/açık tema cihazla değişir) → **Login** (Google/Apple modalı **açılır**).
- [ ] Dev'de reklam çıkarsa **Google test reklamı** olmalı (gerçek reklama tıklama!).

> Bu kapı geçmeden devam etme. Firebase hataları için: `wappa-auth` SSS (static framework).

---

## Adım 5 — (Opsiyonel) Yarışma / sıralama

**Önce SOR:** "Bu uygulamada yarışma/leaderboard olacak mı?" **Hayırsa** `app/compete.tsx`'i sil,
`app/index.tsx`'teki "Yarışma" `ListItem`'ını kaldır, bu adımı atla.

**Evetse — Skill'ler:** `wappa-mcp-backend` **sonra** `wappa-leaderboard`.
- `wappa-mcp-backend`: `.mcp.json` kur (MCP'yi yeniden yükle) → MCP ile `Score` entity
  (PlayerName/Score/Avatar/UserId/ScoreDate) + `score-leaderboard` (GET, azalan, `?scoreDate=`) +
  `submit-score` (create) query'leri. **Panele Firebase/APNs push kimliklerini de buradan yükle** (Adım 3 için).
- `wappa-leaderboard`: `game/leaderboard.ts` yerine **`lib/leaderboard.ts`**. `app/compete.tsx` hazır.
  Kendi bitiş noktanda yeni rekorda `submitScore({ userId, name, score, avatar })` çağır.

**Test ✅**
- [ ] `wappa_list_queries` `score-leaderboard` + `submit-score`'u gösteriyor (adlar client ile birebir).
- [ ] Giriş yap → `submitScore` çağır → `app/compete.tsx`'te kendi satırın highlight'lı görünür (günlük + tüm zamanlar).

---

## Adım 6 — Uygulamanın kendi ekranları (senin app'in)

**Ne yap:** İskelet hazır; şimdi **asıl uygulamayı** kur. `app/index.tsx`'i kendi ana ekranınla
değiştir. Yeni ekran = `app/` altına yeni dosya (ör. `app/quiz.tsx` → `/quiz`, `app/detail.tsx`
→ `/detail`). Stil için **NativeWind `className`** + `components/ui` kiti (Screen/Button/Card/
Field/ListItem/Header). Renkler `tailwind.config.js` `brand` paletinden; koyu tema `dark:` ile.
Navigasyon: `router.push('/route')` / `<Link>`. Gerekirse `components/ui`'a yeni bileşen ekle.

**Test ✅**
- [ ] `bun run typecheck` temiz.
- [ ] `npx expo run:ios/android` → yeni ekranlar arası gezinme çalışıyor; koyu/açık tema düzgün.

---

## Adım 7 — İkon & splash

**Skill:** `expo-icons`. **Ne yap:** Tek kaynak logodan (`assets/logo-mark.png`) tüm ikon/splash'i
üret ve `app.json`'a bağla:
```bash
node ~/.claude/skills/expo-icons/templates/generate-icons.js \
  --source ./assets/logo-mark.png --out ./assets \
  --bg "#ffffff" --adaptive-bg "#4f46e5" --splash-dark-bg "#0b1120" \
  --app-json ./app.json
npx expo install expo-splash-screen
```

**Test ✅**
- [ ] `sips -g hasAlpha assets/icon.png` → **no** (opak); `assets/adaptive-icon.png` → **yes** (şeffaf).
- [ ] `app.json` `icon` / `android.adaptiveIcon` / `web.favicon` + `expo-splash-screen` plugin dolu.
- [ ] `npx expo run:ios` → splash + app ikonu doğru (siyah kutu yok, adaptive kırpılmıyor).

---

## Adım 8 — Mağaza metni

**Skill:** `store-assets`. **Ne yap:** `store.config.json` (iOS EAS Metadata) + `fastlane/metadata/
android/<locale>/` (title/short/full description). Karakter limitleri ve locale kuralları skill'de
(`en-UK` GEÇERSİZ; iOS `tr`, Android `tr-TR`). `store/` + `fastlane/` **`.easignore`** ile hariç.

**Test ✅**
- [ ] `eas metadata:lint` temiz.
- [ ] Zorunlu alanlar dolu; karakter limitleri aşılmamış.

---

## Adım 9 — Mağaza görselleri (screenshot + feature graphic)

**Skill:** `store-screenshots`. **⚠️ ÖNCE reklamları kapat** (banner `return null`, geçiş/app-open
tetikleme yok) — store'lar reklamlı görseli reddeder; çekimden sonra `git checkout` ile geri al.
```bash
# a) reklam kapat  b) ham kare  c) çerçeve+başlık  d) yerleştir
node ~/.claude/skills/store-screenshots/templates/capture-screens.js --platform ios --out ./raw --names welcome,home,login
node ~/.claude/skills/store-screenshots/templates/build-screenshots.js --config ./screenshots.config.js --raw ./raw --out ./export
node ~/.claude/skills/store-screenshots/templates/place-screenshots.js --from ./export --locale tr --project . --patch-config --dry-run
```

**Test ✅**
- [ ] `place-screenshots.js --dry-run` doğru boyut→hedef eşlemesi gösteriyor (iPhone 1290×2796,
      Android 1080×1920, feature graphic 1024×500), sonra `--dry-run`'suz gerçek yaz.
- [ ] Görsellerde **reklam yok**; ilk 2 kare en güçlü faydayı gösteriyor.
- [ ] `git status`: `AdBanner`/`ads` geçici değişiklikleri **geri alındı** (release'e reklamsız kod gitmesin).

---

## Adım 10 — CI/CD kurulumu + yayın

**Skill:** `store-deploy`. **Ne yap (yeni proje):** `templates/.gitlab-ci.yml` → kök `.gitlab-ci.yml`
(`{{BUNDLE_ID}}`, `{{APP_NAME}}`, macOS runner tag doldur); `templates/store-deploy.context.md` →
`.claude/store-deploy.context.md`. Pipeline **git tag**'de tetiklenir; submit/metadata job'ları manuel.

**⚠️ Dışa dönük — kullanıcı onayı şart.** `git push`, `git tag`, `eas submit`, `eas metadata:push`,
`fastlane supply` işlemlerini **onaysız yapma**. Keychain/imza durumu için kullanıcının kendi terminal
çıktısına güven.

**Test ✅**
- [ ] `.gitlab-ci.yml` + `.claude/store-deploy.context.md` yerinde; placeholder kalmadı.
- [ ] (Onaylıysa) `git tag vX.Y.Z && git push origin vX.Y.Z` → pipeline build başlıyor.
- [ ] Build yeşil; `submit_*` / `metadata_*` job'ları manuel tetikle. Hata olursa `store-deploy`
      Mod A (teşhis) + Mod B (bilinen düzeltmeler).

---

## Bitiş kontrol listesi

- [ ] Uygulama dev cihazda uçtan uca çalışıyor: Welcome→ATT→Home→Login→(app ekranları)→(varsa Compete).
- [ ] Push fiziksel cihazda geliyor, dokununca doğru ekrana gidiyor.
- [ ] İkon/splash doğru; mağaza metni lint temiz; görseller reklamsız ve doğru boyutta.
- [ ] CI build yeşil; sürüm git tag ile çıkıldı.
- [ ] `typecheck` temiz; `.mcp.json` / servis anahtarları repoya **sızmadı** (bkz. Güvenlik notları, README).
