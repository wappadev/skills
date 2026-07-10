// Wappa Auth yapılandırması (yalnızca Google / Apple sosyal giriş).
//
// Değerler EXPO_PUBLIC_* env değişkenlerinden okunur (bkz. .env.example). Env yerine
// aşağıdaki sabitleri doğrudan da doldurabilirsin.
//
// GEREKLİ:
//   • siteKey       — Wappa panelindeki site key'in (EXPO_PUBLIC_WAPPA_KEY)
//   • webClientId   — Firebase projendeki OAuth "Web client" ID'si
//                     (google-services.json içindeki client_type: 3 olan client_id /
//                      GoogleService-Info.plist içindeki değer). Google girişi için şart.
// İsteğe bağlı:
//   • apiUrl        — Wappa API tabanı (varsayılan public API kullanılır)
//
// Firebase projesini ve google-services.json / GoogleService-Info.plist dosyalarını
// sen oluşturup proje köküne koyacaksın (panele de yükle). app.json bunlara referans verir.

import type { WappaAuthConfig } from '@appaflytech/wappa-auth';

// NOT: EXPO_PUBLIC_* env değişkenleri bu projede bundle'a güvenilir şekilde inline
// edilmiyor (bkz. wappa-auth-integration hafıza notu) — webClientId undefined kalınca
// Google girişi modal açılmadan "webClientId is required" ile patlıyor. Bu yüzden
// değerler doğrudan sabit yazılı; bunlar gizli değil (google-services.json /
// GoogleService-Info.plist içinde de var). Env varsa yine de override edebilir.
const WEB_CLIENT_ID =
  '{{GOOGLE_WEB_CLIENT_ID}}';
const SITE_KEY = '{{SITE_KEY}}';
const API_BASE_URL = '{{WAPPA_UI_API_URL}}';

export const wappaAuthConfig: WappaAuthConfig = {
  siteKey: process.env.EXPO_PUBLIC_WAPPA_KEY || SITE_KEY,
  apiUrl: process.env.EXPO_PUBLIC_WAPPA_API_BASE_URL || API_BASE_URL,
  google: {
    webClientId: process.env.EXPO_PUBLIC_WAPPA_GOOGLE_WEB_CLIENT_ID || WEB_CLIENT_ID,
  },
};
