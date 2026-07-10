// Wappa push notification yapılandırması.
//
// Paket (@appaflytech/wappa-notifications) cihazın FCM token'ını alıp panele
// (POST {apiUrl}/push-tokens) kaydeder; panelden "Mobil Bildirimler" ekranıyla
// bu cihazlara bildirim gönderilir. Teslimat, panele yüklenen site'a ait Firebase
// (Android) + APNs (iOS) kimlikleri üzerinden FCM HTTP v1 ile yapılır.
//
// siteKey / apiUrl auth ile aynı kaynaktan (game/auth.ts) okunur — tek doğruluk
// noktası. EXPO_PUBLIC_* env değişkenleri bu projede bundle'a güvenilir inline
// edilmediği için (bkz. wappa-auth-integration hafıza notu) değerler orada sabit
// yazılıdır; burada da o sabitleri kullanıyoruz, env vermiyoruz.

import {
  initWappaNotifications,
  unregisterWappaNotifications,
} from '@appaflytech/wappa-notifications';
import type {
  WappaNotificationsController,
  WappaNotificationTapPayload,
} from '@appaflytech/wappa-notifications';
import { wappaAuthConfig } from './auth';

const SITE_KEY = wappaAuthConfig.siteKey;
const API_BASE_URL = wappaAuthConfig.apiUrl;

type StartPushOptions = {
  // Giriş yapan kullanıcının id'si — panelde "Kimlik bazlı" hedefleme için.
  publicUserId?: string;
  // Cihaz dili (ör. "tr") — panelde "Dil bazlı" hedefleme için.
  language?: string;
  // Bildirime dokunulduğunda çağrılır (data.screen'e yönlendirme burada yapılır).
  onTap?: (payload: WappaNotificationTapPayload) => void;
};

// İzin ister, FCM token'ı panele kaydeder, ön plan + tıklama dinleyicilerini kurar.
// Asla throw etmez; hatalar onError ile bildirilir. Dönen controller'ın remove()
// metodu dinleyicileri sökar, unregister() token'ı panelden siler (çıkışta).
export function startPush(
  opts: StartPushOptions = {}
): Promise<WappaNotificationsController> {
  return initWappaNotifications({
    siteKey: SITE_KEY,
    apiUrl: API_BASE_URL,
    publicUserId: opts.publicUserId,
    language: opts.language,
    onTap: opts.onTap,
    onError: (e) => console.warn('[push]', e),
  });
}

// Çıkış yapıldığında cihaz token'ını panelden sil.
export function stopPush(): Promise<void> {
  return unregisterWappaNotifications({
    siteKey: SITE_KEY,
    apiUrl: API_BASE_URL,
  });
}
