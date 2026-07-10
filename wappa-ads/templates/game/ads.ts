import { Platform } from 'react-native';
import { getTrackingStatus } from './tracking';

/**
 * Merkezi reklam yönetimi (Google AdMob).
 *
 * Gelir stratejisi:
 *  - Ödüllü (rewarded): en yüksek eCPM. Devam et / güç yenile / skoru 2×.
 *  - Geçiş (interstitial): oyun bitişinde, FREKANS SINIRLI gösterilir.
 *  - App-open: soğuk açılışta, cooldown ile.
 *  - Banner: sadece ana ekran altında (ayrı bileşen: AdBanner).
 *
 * ID'ler: dev build'de Google TEST birimleri, release'de PROD_UNITS'teki gerçek
 * AdMob birimleri kullanılır (bkz. aşağıdaki pick()). App ID'ler app.json'da.
 */

// Web ve Expo Go'da native reklam modülü yok — güvenli no-op'a düş.
let Ads: typeof import('react-native-google-mobile-ads') | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Ads = require('react-native-google-mobile-ads');
  } catch {
    Ads = null;
  }
}

const available = Ads != null;

// --- Reklam birimi ID'leri ---------------------------------------------------
// __DEV__ (Expo dev build) → Google TEST reklamı. Prod (release) → aşağıdaki GERÇEK ID'ler.
//
// GERÇEK ID'leri buraya gir: AdMob → Apps → <uygulaman> → Ad units → her birimin ID'si.
// Android ve iOS için AYRI ad unit oluşturulur; platforma göre seçilir.
// (Not: buradakiler ad unit ID'leri `.../XXXX`; app.json'daki app ID `~XXXX` farklıdır.)
const ids = Ads?.TestIds;

type PlatformIds = { android: string; ios: string };
const PROD_UNITS: Record<'rewarded' | 'interstitial' | 'appOpen' | 'banner', PlatformIds> = {
  rewarded: { android: '{{ADMOB_ANDROID_REWARDED}}', ios: '{{ADMOB_IOS_REWARDED}}' },
  interstitial: { android: '{{ADMOB_ANDROID_INTERSTITIAL}}', ios: '{{ADMOB_IOS_INTERSTITIAL}}' },
  appOpen: { android: '{{ADMOB_ANDROID_APP_OPEN}}', ios: '{{ADMOB_IOS_APP_OPEN}}' },
  banner: { android: '{{ADMOB_ANDROID_BANNER}}', ios: '{{ADMOB_IOS_BANNER}}' },
};

// Dev → test ID. Prod → platforma uygun gerçek ID (boşsa crash olmasın diye test'e düşer).
const pick = (test: string | undefined, prod: PlatformIds): string => {
  if (__DEV__) return test ?? '';
  const real = Platform.OS === 'ios' ? prod.ios : prod.android;
  return real || test || '';
};

const AD_UNITS = {
  rewarded: pick(ids?.REWARDED, PROD_UNITS.rewarded),
  interstitial: pick(ids?.INTERSTITIAL, PROD_UNITS.interstitial),
  appOpen: pick(ids?.APP_OPEN, PROD_UNITS.appOpen),
  banner: pick(ids?.BANNER, PROD_UNITS.banner), // AdBanner bileşeni doğrudan bunu okur
};

export const BANNER_UNIT_ID = AD_UNITS.banner;
export const adsAvailable = available;

// --- Frekans sınırları -------------------------------------------------------
// Retention'ı korumak için: her oyunda değil, her N oyunda bir + min süre farkı.
const INTERSTITIAL_EVERY_N_GAMES = 2; // en az 2 oyunda bir
const INTERSTITIAL_MIN_GAP_MS = 90_000; // son reklamdan en az 90 sn sonra
const APP_OPEN_COOLDOWN_MS = 4 * 60_000; // açılış reklamı için 4 dk cooldown

let gamesSinceInterstitial = 0;
let lastInterstitialAt = 0;
let lastAppOpenAt = 0;
let rewardedInFlight = false; // aynı anda tek ödüllü reklam açılabilsin

// Kişiselleştirilmiş reklam yalnızca kullanıcı izin verdiyse. İzin/durum netleşene
// kadar gizlilik-güvenli varsayılan: kişiselleştirme kapalı (NPA).
let nonPersonalized = true;

/** Tüm reklam isteklerinin ortak seçenekleri (banner dahil). */
export function adRequestOptions() {
  return { requestNonPersonalizedAdsOnly: nonPersonalized };
}

// --- Önyüklenen reklam örnekleri ---------------------------------------------
let interstitial: any = null;
let rewarded: any = null;
let appOpen: any = null;

function makeInterstitial() {
  if (!Ads) return null;
  const ad = Ads.InterstitialAd.createForAdRequest(
    AD_UNITS.interstitial,
    adRequestOptions()
  );
  // Kapanınca bir sonrakini önden yükle.
  ad.addAdEventListener(Ads.AdEventType.CLOSED, () => {
    interstitial = makeInterstitial();
  });
  ad.addAdEventListener(Ads.AdEventType.ERROR, () => {});
  ad.load();
  return ad;
}

function makeAppOpen() {
  if (!Ads) return null;
  const ad = Ads.AppOpenAd.createForAdRequest(AD_UNITS.appOpen, adRequestOptions());
  ad.addAdEventListener(Ads.AdEventType.CLOSED, () => {
    appOpen = makeAppOpen();
  });
  ad.addAdEventListener(Ads.AdEventType.ERROR, () => {});
  ad.load();
  return ad;
}

/** SDK'yı başlat ve interstitial + app-open reklamları önden yükle. */
export async function initAds(): Promise<void> {
  if (!Ads) return;
  try {
    // İçerik derecesini G ile sınırla (4+ yaş derecesi + reklam için Apple şartı)
    // ve uygulamayı çocuklara yönelik / rıza-altı olarak İŞARETLEME.
    await Ads.default().setRequestConfiguration({
      maxAdContentRating: Ads.MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });

    // ATT rızasına göre kişiselleştirme kararı (iOS). Diğer platformlarda personalized.
    const status = await getTrackingStatus();
    nonPersonalized = Platform.OS === 'ios' ? status !== 'granted' : false;

    await Ads.default().initialize();
    interstitial = makeInterstitial();
    appOpen = makeAppOpen();
  } catch {
    // sessizce yut — reklam olmadan oyun çalışmaya devam etsin
  }
}

/**
 * Ödüllü reklam göster. Kullanıcı ödülü hak ederse onReward() çağrılır.
 * Reklam yoksa/yüklenemezse onReward yine de çağrılır ki oyuncu mağdur olmasın
 * (opsiyonel: fallbackReward=false verirsen ödül verilmez).
 */
export function showRewarded(
  onReward: () => void,
  opts: { fallbackReward?: boolean } = {}
): void {
  const { fallbackReward = true } = opts;

  // Zaten bir ödüllü reklam açık/yükleniyorsa yeni istekleri yok say
  // (hızlı çift tıklamada birden fazla reklam açılmasını engeller).
  if (rewardedInFlight) return;

  if (!Ads) {
    if (fallbackReward) onReward();
    return;
  }

  rewardedInFlight = true;

  const ad = Ads.RewardedAd.createForAdRequest(AD_UNITS.rewarded, adRequestOptions());

  let earned = false;
  let settled = false;
  const finish = (give: boolean) => {
    if (settled) return;
    settled = true;
    rewardedInFlight = false; // kilidi bırak
    if (give) onReward();
  };

  const unsubLoaded = ad.addAdEventListener(
    Ads.RewardedAdEventType.LOADED,
    () => {
      ad.show().catch(() => finish(fallbackReward));
    }
  );
  const unsubEarned = ad.addAdEventListener(
    Ads.RewardedAdEventType.EARNED_REWARD,
    () => {
      earned = true;
    }
  );
  const unsubClosed = ad.addAdEventListener(Ads.AdEventType.CLOSED, () => {
    finish(earned);
    unsubLoaded();
    unsubEarned();
    unsubClosed();
    unsubError();
  });
  const unsubError = ad.addAdEventListener(Ads.AdEventType.ERROR, () => {
    finish(fallbackReward);
  });

  // Güvenlik zaman aşımı: 10 sn içinde yüklenmezse fallback.
  setTimeout(() => finish(fallbackReward), 10_000);

  ad.load();
}

/**
 * Oyun bitişinde çağrılır. Frekans sınırını geçerse geçiş reklamı gösterir.
 * Reklam gösterildiyse true döner (isteyen ekran akışını buna göre bekletir).
 */
export function onGameOver(now: number): boolean {
  if (!Ads || !interstitial) return false;
  gamesSinceInterstitial += 1;

  const enoughGames = gamesSinceInterstitial >= INTERSTITIAL_EVERY_N_GAMES;
  const enoughGap = now - lastInterstitialAt >= INTERSTITIAL_MIN_GAP_MS;

  if (enoughGames && enoughGap && interstitial.loaded) {
    lastInterstitialAt = now;
    gamesSinceInterstitial = 0;
    interstitial.show().catch(() => {});
    return true;
  }
  return false;
}

/** Uygulama öne geldiğinde açılış reklamı (cooldown ile). */
export function showAppOpen(now: number): void {
  if (!Ads || !appOpen || !appOpen.loaded) return;
  if (now - lastAppOpenAt < APP_OPEN_COOLDOWN_MS) return;
  lastAppOpenAt = now;
  appOpen.show().catch(() => {});
}
