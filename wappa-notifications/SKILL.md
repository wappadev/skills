---
name: wappa-notifications
description: >-
  Add FCM push notifications to an Expo / React Native app via the
  @appaflytech/wappa-notifications package and the Wappa panel. Use when adding
  push notifications, registering a device FCM token, wiring notification tap
  routing, or setting up panel-based (identity / language targeted) push to an
  Expo app. Covers: initWappaNotifications/unregisterWappaNotifications,
  posting the device FCM token to the Wappa panel (POST {apiUrl}/push-tokens),
  the panel "Mobil Bildirimler" send screen, notification-tap deep routing via
  data.screen, and per-user / per-language targeting. Trigger on mentions of
  push notifications, FCM, wappa-notifications, expo-notifications,
  @react-native-firebase/messaging, APNs, or "bildirim gönderme".
---

# Wappa Notifications (FCM push)

Bir Expo / React Native uygulamasına, Wappa paneli üzerinden yönetilen FCM push
bildirim desteği ekler. Bu skill `2048-cakmasi` oyunundaki gerçek, çalışan
entegrasyonu şablon olarak taşır; başka projelere olduğu gibi uygulanabilir.

## 1. Amaç

Akış şu şekilde çalışır:

1. Uygulama açılınca cihaz FCM (Firebase Cloud Messaging) token'ını alır.
2. `@appaflytech/wappa-notifications` bu token'ı panele kaydeder:
   `POST {apiUrl}/push-tokens` (siteKey ile ilişkilendirilir; ayrıca
   `publicUserId` ve `language` ile de işaretlenebilir).
3. Panelin "Mobil Bildirimler" ekranından bu cihazlara bildirim gönderilir.
   Teslimat FCM HTTP v1 ile yapılır:
   - Android → site'a yüklenen **Firebase** kimliği (service account).
   - iOS → site'a yüklenen **APNs** kimliği (auth key).
4. Kullanıcı bildirime dokununca uygulama `notification.data.screen` alanını
   okuyup ilgili ekrana yönlenir (deep-link / routing).

Yani cihaz tarafı yalnızca token üretip panele bildirir; hedefleme ve gönderim
tamamen panelde yapılır.

## 2. Ön koşul

- **`wappa-auth` skill kurulu olmalı.** Bildirimler `siteKey` ve `apiUrl`
  değerlerini `game/auth.ts` içindeki `wappaAuthConfig`'ten okur — tek doğruluk
  noktası. Auth kurulu değilse `game/auth.ts` yoksa, ya `wappa-auth` skill'ini
  uygula ya da `game/notifications.ts` içindeki `SITE_KEY` / `API_BASE_URL`
  değerlerini doğrudan kendi site key'in ve API tabanınla doldur.
- **Firebase (Android) + APNs (iOS) kimlikleri panele yüklü olmalı.** Bu
  kimlikler olmadan panel bildirim gönderemez. Yükleme `wappa-mcp-backend`
  skill'inin MCP araçlarıyla yapılabilir:
  - `wappa_set_firebase_credential` — Android FCM için Firebase service account.
  - `wappa_set_apns_credential` — iOS için APNs auth key.
- Firebase projesi ve `google-services.json` / `GoogleService-Info.plist`
  dosyaları `wappa-auth` firebase kurulumuyla zaten proje köküne konur; push da
  aynı Firebase projesini kullanır. (Genel şablon için `wappa-games-template`
  skill'ine bakılabilir.)

## 3. Kurulacak dosyalar

| Şablon | Hedef |
| --- | --- |
| `templates/game/notifications.ts` | `game/notifications.ts` |

`game/notifications.ts` içinde doğrudan doldurulacak sabit yoktur — `siteKey` ve
`apiUrl` `./auth`'tan gelir. `wappa-auth` kullanmıyorsan sadece o dosyadaki iki
sabiti kendi değerlerinle değiştir.

## 4. package.json bağımlılıkları

Aşağıdaki paketleri (aynı sürümlerle) ekle:

```json
{
  "dependencies": {
    "@appaflytech/wappa-notifications": "^0.0.7",
    "@react-native-firebase/messaging": "^25.1.0",
    "expo-notifications": "~56.0.20"
  }
}
```

Not: `@react-native-firebase/messaging`, `wappa-auth` firebase kurulumunda zaten
gelmiş olabilir; yoksa ekle. `@react-native-firebase/app` (^25.1.0) da gereklidir
ve auth tarafından kurulur.

## 5. app.json

`plugins` dizisine `expo-notifications` ekle:

```json
{
  "expo": {
    "plugins": [
      "expo-notifications"
    ]
  }
}
```

`@react-native-firebase/messaging` için ayrı bir plugin girişi gerekmez;
`@react-native-firebase/app` plugin'i (wappa-auth firebase kurulumu tarafından
eklenir) messaging modülünü de kapsar. iOS'ta push için `bundleIdentifier`
(`{{BUNDLE_ID}}`) ve `GoogleService-Info.plist`, Android'de `package` ve
`google-services.json` referansları app.json'da bulunmalıdır (bunlar wappa-auth
tarafından kurulur).

## 6. App.tsx bağlantısı

Kopyala-yapıştır iskelet:

```tsx
import { startPush, stopPush } from './game/notifications';
import { useWappaAuth } from '@appaflytech/wappa-auth';

// Bildirim data.screen alanı bilinen bir ekran adıysa oraya yönlendiririz.
const SCREENS = ['home', 'game', 'compete', 'settings', 'login'] as const;
type Screen = (typeof SCREENS)[number];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const { user } = useWappaAuth();
  // "Karşılama / onboarding tamamlandı" bayrağı (bu projede welcomeDone).
  const [welcomeDone, setWelcomeDone] = useState<boolean | null>(null);

  // Bildirime dokununca: data.screen bilinen bir ekransa oraya geç.
  const handlePushTap = useCallback(
    ({ notification }: { notification: { data: Record<string, unknown> } }) => {
      const target = notification.data?.screen;
      if (typeof target === 'string' && (SCREENS as readonly string[]).includes(target)) {
        setScreen(target as Screen);
      }
    },
    []
  );

  // Push: onboarding geçildikten sonra izin iste + FCM token'ı panele kaydet.
  // user?.id değişince (giriş/çıkış) effect yeniden çalışır ve token'ı güncel
  // kimlikle yeniden kaydeder (kimlik bazlı hedefleme).
  useEffect(() => {
    if (!welcomeDone) return;
    let ctrl: Awaited<ReturnType<typeof startPush>> | null = null;
    let cancelled = false;
    startPush({ publicUserId: user?.id, onTap: handlePushTap })
      .then((c) => {
        if (cancelled) c.remove();
        else ctrl = c;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ctrl?.remove();
    };
  }, [welcomeDone, user?.id, handlePushTap]);

  // Çıkışta cihaz token'ını panelden sil (artık bu kullanıcıya gitmesin).
  const handleLogout = useCallback(async () => {
    await stopPush();
    // ...wappa-auth signOut vb.
  }, []);

  // ...
}
```

Kritik noktalar:

- Effect **onboarding tamamlandıktan sonra** çalışsın (`if (!welcomeDone) return`).
  İzin isteği `initWappaNotifications` içinde, onboarding'den SONRA sorulur;
  böylece ATT / karşılama akışı bozulmaz.
- Dönen controller'ı sakla ve cleanup'ta `controller.remove()` çağır
  (dinleyicileri söker). `cancelled` bayrağı, promise geç çözülürse controller'ı
  sızdırmadan temizler.
- Effect bağımlılıklarına `user?.id` koy — kullanıcı giriş/çıkış yaptığında token
  güncel kimlikle yeniden kaydedilsin (kimlik bazlı hedefleme).
- Çıkışta `stopPush()` ile token'ı panelden sil.

## 7. Hedefleme (panelde)

`startPush` iki opsiyonel parametreyle token'ı işaretler:

- **`publicUserId`** (kimlik bazlı): Giriş yapan kullanıcının id'si. Panelde
  "Mobil Bildirimler" ekranında belirli kullanıcı(lar)a bildirim gönderirken bu
  id kullanılır. Kullanıcı değişince effect yeniden çalışıp token'ı yeni id ile
  günceller.
- **`language`** (dil bazlı): Cihaz dili (ör. `"tr"`). Panelde belli bir dildeki
  kullanıcılara toplu bildirim göndermek için filtre olarak kullanılır.

Her ikisi de opsiyoneldir; verilmezse token yalnızca siteKey ile ilişkilenir ve
"tüm cihazlar" hedeflemesine dahil olur.

## 8. Notlar

- `startPush` **asla throw etmez**; hatalar `onError` callback'i ile bildirilir
  (şablonda `console.warn('[push]', e)`). Bu yüzden App.tsx'te `.catch(() => {})`
  yeterli.
- Bildirim izni `initWappaNotifications` **içinde**, onboarding tamamlandıktan
  SONRA istenir. iOS'ta ATT ve karşılama ekranı akışının bozulmaması için push
  effect'ini onboarding bayrağına bağla.
- `game/notifications.ts`, `siteKey` / `apiUrl` değerlerini `game/auth.ts`'ten
  okur — env yerine sabit kullanır (bu projede EXPO_PUBLIC_* güvenilir inline
  edilmiyor; wappa-auth aynı yaklaşımı kullanır).

## 9. Doğrulama

1. Uygulamayı fiziksel bir cihazda (push simülatörde çalışmaz; iOS'ta gerçek
   cihaz şart) onboarding'i geçecek şekilde aç.
2. Panelde `push-tokens` listesinde cihazın token'ının belirdiğini doğrula
   (MCP: `wappa_list_push_tokens` / `wappa_get_push_token_stats`).
3. Panelin "Mobil Bildirimler" ekranından (veya MCP `wappa_send_notification`
   ile) bir test bildirimi gönder; cihaza ulaştığını gör.
4. `data.screen` alanı bilinen bir ekran (ör. `compete`) olan bir bildirim
   gönder; bildirime dokununca uygulamanın o ekrana yönlendiğini doğrula.
5. Giriş yaptıktan sonra token'ın `publicUserId` ile güncellendiğini, çıkışta
   `stopPush()` ile silindiğini kontrol et.

## İlgili skiller

- **`wappa-auth`** — `game/auth.ts` içindeki `siteKey` / `apiUrl` config'i sağlar
  (bu skill ona bağımlıdır) ve Firebase kurulumunu yapar.
- **`wappa-mcp-backend`** — panel tarafı Firebase / APNs kimlik kurulumu
  (`wappa_set_firebase_credential`, `wappa_set_apns_credential`) ve bildirim
  gönderme (`wappa_send_notification`) MCP araçları.
- **`wappa-games-template`** — genel oyun/uygulama şablonu.
