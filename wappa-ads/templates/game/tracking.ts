import { Platform } from 'react-native';

/**
 * iOS App Tracking Transparency (ATT) yönetimi.
 *
 * Apple, IDFA'ya erişip kişiselleştirilmiş reklam gösterebilmek için
 * kullanıcıdan açık izin (ATT prompt) ister. Bu izin alınmadan AdMob
 * yalnızca kişiselleştirilmemiş reklam sunar.
 *
 * - Sadece iOS'ta anlamlı; Android/web'de no-op'a düşer.
 * - Expo Go / native modülün olmadığı ortamlarda çökmemesi için dinamik require.
 * - Prompt kullanıcı ömrü boyunca bir kez gösterilir; sonrasında OS kayıtlı
 *   durumu döner (tekrar sormaz).
 */

// Web ve native modülün bulunmadığı ortamlarda güvenli no-op.
let TT: typeof import('expo-tracking-transparency') | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    TT = require('expo-tracking-transparency');
  } catch {
    TT = null;
  }
}

export type TrackingStatus =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'not-determined'
  | 'unavailable';

/**
 * Gerekiyorsa ATT iznini ister ve nihai durumu döner.
 * iOS dışında ya da modül yoksa 'unavailable' döner.
 * Hiçbir koşulda throw etmez — reklam katmanı buna göre davranır, oyun akışı bloklanmaz.
 */
export async function requestTracking(): Promise<TrackingStatus> {
  if (Platform.OS !== 'ios' || !TT) return 'unavailable';
  try {
    // Zaten karar verilmişse tekrar prompt gösterme, mevcut durumu dön.
    const current = await TT.getTrackingPermissionsAsync();
    if (current.status !== 'undetermined' && !current.canAskAgain) {
      return current.status as TrackingStatus;
    }
    const { status } = await TT.requestTrackingPermissionsAsync();
    return status as TrackingStatus;
  } catch {
    return 'unavailable';
  }
}

/** İzin istemeden mevcut ATT durumunu okur (prompt göstermez). */
export async function getTrackingStatus(): Promise<TrackingStatus> {
  if (Platform.OS !== 'ios' || !TT) return 'unavailable';
  try {
    const { status } = await TT.getTrackingPermissionsAsync();
    return status as TrackingStatus;
  } catch {
    return 'unavailable';
  }
}
