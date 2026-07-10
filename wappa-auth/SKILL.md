---
name: wappa-auth
description: >-
  Add Firebase-backed Google and Apple social login to an Expo / React Native app
  via the @appaflytech/wappa-auth SDK (WappaAuthProvider + useWappaAuth). Use this
  skill when adding social sign-in / Google sign-in / Apple sign-in / "login with
  Wappa" / Firebase auth to an Expo app, when wiring WappaAuthProvider or
  useWappaAuth, or when debugging these symptoms: Google login throws
  "webClientId is required" (often because EXPO_PUBLIC_* env vars are not inlined
  into the bundle), the login modal does not open / "nothing happens" on tap
  (controller === null, provider not initialized), or the iOS build fails under
  static frameworks with react-native-firebase errors like
  "non-modular-include-in-framework-module", "RCTPromiseRejectBlock must be
  imported from module RNFBApp.RNFBAppModule", or "unknown type name RCT_EXTERN".
  Only social login (Google/Apple) — no email/password.
---

# wappa-auth — Google / Apple sosyal giriş (Expo + Firebase)

Bu skill, bir Expo / React Native uygulamasına **yalnızca Google ve Apple sosyal girişi**
`@appaflytech/wappa-auth` SDK'sı üzerinden ekler. E-posta/şifre girişi YOKTUR. Kimlik
doğrulama Firebase Auth + Google Sign-In / Apple Authentication ile yapılır, oturum
Wappa tarafında `siteKey` ile bağlanır.

Kardeş skill'ler:
- **wappa-games-template** — genel oyun/app iskeletini kuran orkestratör; bu skill'i
  onun bir parçası olarak çağırır.
- **wappa-notifications** — push bildirimleri; aynı `siteKey` ve API tabanını kullanır.
- **store-deploy** — CI/EAS ile store'a build & release.

## 1. Amaç

Uygulamaya tek işlev ekler: **Google ile giriş** (iOS + Android) ve **Apple ile giriş**
(yalnızca iOS). `WappaAuthProvider` uygulamayı sarar, `useWappaAuth()` her yerden oturum
durumunu ve login fonksiyonlarını verir. Başka bir auth yöntemi (email/şifre, telefon)
kapsam dışıdır.

## 2. Ön koşullar

Bunları SEN (proje sahibi) hazırlamalısın; skill kod tarafını kurar:

1. **Firebase projesi.** Firebase console'da bir proje aç, içine bir iOS app
   (`bundleIdentifier` = app.json'daki `ios.bundleIdentifier`) ve bir Android app
   (`package` = app.json'daki `android.package`) ekle.
2. **`google-services.json`** (Android) — Firebase'den indir, **proje köküne** koy.
3. **`GoogleService-Info.plist`** (iOS) — Firebase'den indir, **proje köküne** koy.
4. **OAuth "Web client" ID'si** — Google girişi için ŞART. `google-services.json`
   içinde `oauth_client` dizisinde `client_type: 3` olan girişin `client_id`'si budur
   (`...apps.googleusercontent.com`). Firebase iOS app'i eklerken de otomatik oluşur.
   Bu değer `webClientId` olarak kullanılır.
5. **Apple Sign-In capability** — Apple Developer hesabında App ID için "Sign In with
   Apple" capability'sini aç (iOS build'de Apple butonu için gerekir). app.json'daki
   `ios.usesAppleSignIn: true` bunu prebuild'de entitlement olarak ekler.
6. **Wappa site key** — Wappa panelindeki site key'in (`{{SITE_KEY}}` yerine gelir).
   `wappa-notifications` ile aynı key.

> `google-services.json` ve `GoogleService-Info.plist` gizli dosyalar DEĞİLDİR (client
> tarafı config) ama yine de repo'ya koyup koymamak sana kalmış; app.json bunlara kök
> dizinden referans verir.

## 3. Kurulacak dosyalar

Şablonlar `templates/` altında, proje içi hedef yolunu birebir yansıtır:

| Şablon | Hedef yol (proje kökünden) |
| --- | --- |
| `templates/game/auth.ts` | `game/auth.ts` — WappaAuthConfig (siteKey, apiUrl, google.webClientId) |
| `templates/index.js` | `index.js` — app root'unu `WappaAuthProvider` ile sarar |
| `templates/screens/LoginScreen.tsx` | `screens/LoginScreen.tsx` — Google/Apple butonlu giriş ekranı |
| `templates/plugins/withFirebaseNonModularHeaders.js` | `plugins/withFirebaseNonModularHeaders.js` — iOS static framework fix (1/2) |
| `templates/plugins/withRNFirebaseStaticFramework.js` | `plugins/withRNFirebaseStaticFramework.js` — iOS static framework fix (2/2) |
| `templates/.env.example` | `.env.example` — opsiyonel env override referansı |

Kopyalarken şablondaki `{{...}}` placeholder'larını gerçek değerlerle değiştir:

- `{{SITE_KEY}}` — Wappa site key
- `{{GOOGLE_WEB_CLIENT_ID}}` — OAuth Web client ID (client_type:3)
- `{{WAPPA_UI_API_URL}}` — Wappa API tabanı (varsayılan: `https://wappa-ui-api.appaflytech.com`, ?? / || zincirinde fallback olarak kalsın)
- `{{BUNDLE_ID}}` — app.json bundle id (ör. `com.appaflytech.oyun2048`)
- `{{APP_NAME}}` — uygulama görünen adı (ör. `2048 Efsane Yolu`)

`LoginScreen.tsx` `../game/themes`'ten `Theme`, `tileBg`, `tileText` import eder — bu
projenin tema modülüdür. Farklı projede kendi tema/stiline uyarla (marka taşları
tamamen kozmetik; asıl önemli kısım `useWappaAuth()` kullanımı, iptal yakalama ve
`controller===null` tespitidir).

## 4. package.json bağımlılıkları (kaynaktaki BİREBİR sürümler)

```jsonc
"dependencies": {
  "@appaflytech/wappa-auth": "^0.0.4",
  "@react-native-firebase/app": "^25.1.0",
  "@react-native-firebase/auth": "^25.1.0",
  "@react-native-google-signin/google-signin": "^16.1.2",
  "expo-apple-authentication": "~56.0.4",
  "expo-secure-store": "~56.0.4"
}
```

Notlar:
- `@react-native-firebase/messaging` (`^25.1.0`) auth için ŞART DEĞİL; ama
  `wappa-notifications` ekliyorsan onun için gerekir ve iki static-framework config
  plugin'i asıl messaging yüzünden vardır (bkz. §9). Sadece auth kuruyorsan messaging'i
  atlayabilirsin — plugin'ler yine zararsız çalışır.
- `expo-build-properties` (`~56.0.21`) iOS static framework ayarı için gerekir.
- Expo SDK 56 / React Native 0.85 / React 19 hattıyla uyumludur.

## 5. app.json değişiklikleri

`expo.plugins` dizisine şunları ekle (sıra önemli: local firebase plugin'leri firebase
plugin'lerinden ÖNCE gelmeli):

```jsonc
"plugins": [
  // ... mevcut plugin'ler ...
  [
    "expo-build-properties",
    {
      "android": { "kotlinVersion": "2.3.20" },
      "ios": {
        "usePrecompiledModules": false,
        "useFrameworks": "static"
      }
    }
  ],
  "./plugins/withFirebaseNonModularHeaders",
  "./plugins/withRNFirebaseStaticFramework",
  "@react-native-firebase/app",
  "@react-native-firebase/auth",
  "@react-native-google-signin/google-signin",
  "expo-secure-store",
  "expo-apple-authentication"
]
```

Ayrıca `expo.ios` ve `expo.android` altına:

```jsonc
"ios": {
  "bundleIdentifier": "{{BUNDLE_ID}}",
  "googleServicesFile": "./GoogleService-Info.plist",
  "usesAppleSignIn": true
},
"android": {
  "package": "{{BUNDLE_ID}}",
  "googleServicesFile": "./google-services.json"
}
```

Kritik iOS ayarları:
- `ios.useFrameworks: "static"` — react-native-firebase iOS'ta static framework ister.
- `ios.usePrecompiledModules: false` — precompiled RN modülleri static framework ile
  çakışır; kapalı olmalı.

## 6. index.js — provider ile sar

Uygulama kökünü BİR KEZ `WappaAuthProvider` ile sar; içeride `useWappaAuth()` her yerde
çalışır:

```jsx
import { registerRootComponent } from 'expo';
import { WappaAuthProvider } from '@appaflytech/wappa-auth';
import App from './App';
import { wappaAuthConfig } from './game/auth';

function Root() {
  return (
    <WappaAuthProvider config={wappaAuthConfig}>
      <App />
    </WappaAuthProvider>
  );
}

registerRootComponent(Root);
```

`wappaAuthConfig` `game/auth.ts`'ten gelir: `{ siteKey, apiUrl, google: { webClientId } }`.

## 7. Kullanım — `useWappaAuth()` API

Hook şunları verir:

- `isAuthenticated: boolean` — oturum açık mı.
- `user` — `{ id, firstname, lastname, email }` (giriş yoksa null/undefined).
- `loginWithGoogle(): Promise<...>` — Google akışını başlatır.
- `loginWithApple(): Promise<...>` — Apple akışını başlatır (iOS).
- `loading: boolean` — provider/oturum hazırlanıyor mu.

LoginScreen deseninde iki kritik incelik var (şablonda hazır):

1. **İptal tespiti** — kullanıcı akışı iptal ettiğinde hata GÖSTERME. `isCancel(err)`
   Apple `ERR_REQUEST_CANCELED` ve Google `SIGN_IN_CANCELLED` / `-5` (iOS) / `12501`
   (Android) kodlarını yakalar.
2. **`controller === null` → provider init olmamış** — provider henüz hazır değilken
   `loginWithGoogle()` sessizce `undefined` döner ve modal HİÇ açılmaz. Şablon bunu
   `result === undefined` ile yakalayıp ekranda görünür kılar (yoksa "hiçbir şey
   olmuyor" gibi görünür). Ayrıca gerçek hatayı ekrana basar çünkü store/CI build'de
   `console` görünmez.

```jsx
const { loginWithGoogle, loginWithApple, loading } = useWappaAuth();
// ...
const result = await loginWithGoogle();
if (result === undefined) {
  // provider init olmadı (controller=null) — modal açılmadı
}
```

Oturum durumunu okumak için:

```jsx
const { isAuthenticated, user } = useWappaAuth();
if (isAuthenticated) {
  // user.firstname, user.email ...
}
```

## 8. ÖNEMLİ GOTCHA — "webClientId is required"

**Bu stack'te `EXPO_PUBLIC_*` env değişkenleri bundle'a GÜVENİLİR ŞEKİLDE inline
EDİLMİYOR.** Sonuç: `process.env.EXPO_PUBLIC_WAPPA_GOOGLE_WEB_CLIENT_ID` runtime'da
`undefined` kalır, `webClientId` boş gider ve Google girişi **modal açılmadan**
`"webClientId is required"` hatasıyla patlar.

**Çözüm:** Değerleri doğrudan `game/auth.ts` içine SABİT yaz (şablon zaten böyle). Bunlar
gizli değildir — `google-services.json` / `GoogleService-Info.plist` içinde de bulunurlar.
Env yalnızca opsiyonel override olarak `||` zincirinde kalır:

```ts
const WEB_CLIENT_ID = '{{GOOGLE_WEB_CLIENT_ID}}';
const SITE_KEY = '{{SITE_KEY}}';
const API_BASE_URL = '{{WAPPA_UI_API_URL}}';

export const wappaAuthConfig: WappaAuthConfig = {
  siteKey: process.env.EXPO_PUBLIC_WAPPA_KEY || SITE_KEY,
  apiUrl: process.env.EXPO_PUBLIC_WAPPA_API_BASE_URL || API_BASE_URL,
  google: {
    webClientId: process.env.EXPO_PUBLIC_WAPPA_GOOGLE_WEB_CLIENT_ID || WEB_CLIENT_ID,
  },
};
```

Yani: `.env`'e güvenme, sabitleri doldur. `wappa-notifications` de aynı sebeple
`game/auth.ts`'teki sabitleri okur.

## 9. iOS static frameworks — iki config plugin neden var?

`ios.useFrameworks: "static"` altında her pod bir framework modülü olarak derlenir ve
`react-native-firebase` iki ayrı hatayla kırılır:

1. **Non-modular header** — RNFB'nin ObjC header'ları React header'larını modüler
   olmayan şekilde import eder (`#import <React/RCTConvert.h>`). clang bunu
   `-Wnon-modular-include-in-framework-module -Werror` ile hataya çevirir.
   → `withFirebaseNonModularHeaders.js` tüm pod'larda
   `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` yapar ve RNFB pod'larında
   `CLANG_ENABLE_MODULES = NO` ile modülleri kapatır.

2. **`RCTPromiseRejectBlock must be imported from module RNFBApp.RNFBAppModule` /
   `unknown type name RCT_EXTERN`** — messaging'in category header'ları React tiplerini
   framework modülü altında ifşa eder.
   → `withRNFirebaseStaticFramework.js` Podfile'ın en başına
   `$RNFirebaseAsStaticFramework = true` ekleyerek RNFB pod'larını static *kütüphane*
   olarak derletir.

**Neden config plugin, neden elle Podfile/gradle düzenlemesi değil?** Her `expo prebuild`
`android/` ve `ios/` klasörlerini SIFIRDAN yeniden üretir; elle düzenlenen `Podfile`
veya gradle dosyası her prebuild'de silinir. Bu yüzden bu düzeltmeler `withDangerousMod`
tabanlı config plugin olarak yaşamak ZORUNDA (Android tarafındaki
`./plugins/withKotlinSkipMetadataCheck` ile aynı mantık). İkisi de idempotent (marker
ile çift ekleme yapmaz).

## 10. Doğrulama

1. **Tip kontrolü:**
   ```bash
   npm run typecheck   # tsc --noEmit
   ```
2. **Bağımlılıklar & prebuild:**
   ```bash
   npm install
   npx expo prebuild --clean
   ```
   iOS'ta pod install hatasızsa (§9 hataları görünmüyorsa) static framework fix'leri
   çalışıyor demektir.
3. **Gerçek build / dev client** — sadece typecheck yeterli DEĞİL; login modalının
   FİİLEN açıldığını görmelisin:
   ```bash
   npx expo run:ios      # veya run:android
   ```
   LoginScreen'e git → "Google ile devam et"e bas → Google hesap seçim modalı AÇILMALI.
   - Modal açılmıyor / "webClientId is required" → §8 (sabitleri kontrol et).
   - "Oturum hazır değil (controller=null)" → provider (`WappaAuthProvider`)
     app root'unu sarmıyor, index.js'i kontrol et (§6).
   - iOS build react-native-firebase hatasıyla kırılıyor → §9 (plugin sırası + app.json
     useFrameworks/usePrecompiledModules).

Başarılı giriş sonrası `useWappaAuth().isAuthenticated === true` ve `user` dolu olur.
