import React from 'react';
import { View, Platform } from 'react-native';
import { adsAvailable, BANNER_UNIT_ID, adRequestOptions } from '../game/ads';

// Native modül yoksa (web / Expo Go) hiçbir şey render etme.
let BannerAd: any = null;
let BannerAdSize: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('react-native-google-mobile-ads');
    BannerAd = m.BannerAd;
    BannerAdSize = m.BannerAdSize;
  } catch {
    BannerAd = null;
  }
}

/** Ana ekranın altına yerleştirilen adaptif banner. */
export default function AdBanner() {
  if (!adsAvailable || !BannerAd) return null;
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={adRequestOptions()}
      />
    </View>
  );
}
