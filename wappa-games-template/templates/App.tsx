import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, View } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initAds, showAppOpen } from './game/ads';
import { requestTracking } from './game/tracking';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import { startPush } from './game/notifications';

import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import { theme } from './game/theme';

// [YARIŞMA] Yarışma (leaderboard) yoksa bu iki satırı ve aşağıdaki [YARIŞMA]
// işaretli blokları sil (bkz. wappa-leaderboard skill'i).
import CompeteScreen from './screens/CompeteScreen';
import { submitScore, userDisplayName } from './game/leaderboard';

// [YARIŞMA] 'compete' ekranı yarışma yoksa çıkarılır.
type Screen = 'home' | 'game' | 'settings' | 'login' | 'compete';
const SCREENS: readonly Screen[] = ['home', 'game', 'settings', 'login', 'compete'];

// İlk açılışta karşılama ekranını gösterdiğimizi hatırlamak için.
const welcomeKey = '@{{APP_SLUG}}:welcome_seen';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  // Giriş ekranı kapandığında hangi ekrana döneceğimiz.
  const [loginFrom, setLoginFrom] = useState<Screen>('settings');
  // null = bayrak henüz okunmadı (ekran seçimini flash'lamamak için)
  const [welcomeDone, setWelcomeDone] = useState<boolean | null>(null);
  const [startBusy, setStartBusy] = useState(false);
  const adsInited = useRef(false);
  const { isAuthenticated, user } = useWappaAuth();
  // [YARIŞMA] Bu oturumda gönderilen en yüksek skor (tekrar göndermeyi önler).
  const lastSubmittedRef = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(welcomeKey).then((v) => setWelcomeDone(v === '1'));
  }, []);

  // Reklamları yalnızca karşılama ekranı geçildikten sonra (bir kez) başlat.
  // Böylece ilk açılışta önce ATT izni istenir, sonra reklam SDK'sı kurulur.
  useEffect(() => {
    if (welcomeDone && !adsInited.current) {
      adsInited.current = true;
      initAds();
    }
  }, [welcomeDone]);

  // Karşılama ekranında "Başla": iOS'ta ATT izni iste, bayrağı kaydet, ana ekrana geç.
  const handleStart = useCallback(async () => {
    setStartBusy(true);
    try {
      await requestTracking();
    } finally {
      await AsyncStorage.setItem(welcomeKey, '1');
      setWelcomeDone(true);
    }
  }, []);

  // Bildirime dokununca: data.screen bir ekran adıysa oraya geç.
  const handlePushTap = useCallback(
    ({ notification }: { notification: { data: Record<string, unknown> } }) => {
      const target = notification.data?.screen;
      if (typeof target === 'string' && (SCREENS as readonly string[]).includes(target)) {
        setScreen(target as Screen);
      }
    },
    []
  );

  // Push bildirimleri: karşılama ekranı geçildikten sonra izin iste + FCM token'ı
  // panele kaydet. Kullanıcı giriş/çıkış yaptığında publicUserId değişir; effect
  // yeniden çalışıp token'ı güncel kimlikle yeniden kaydeder (kimlik bazlı hedefleme).
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

  // Uygulama arka plandan öne geldiğinde açılış reklamı (cooldown ads.ts'te).
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        showAppOpen(Date.now());
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // [YARIŞMA] Oyun bitince: giriş yapmış kullanıcının skorunu yarışmaya gönder.
  // (Yeni kişisel rekor kontrolünü kendi skor sistemine göre burada yap.)
  const handleGameEnd = useCallback(
    (score: number) => {
      if (!isAuthenticated || !user || score <= 0) return;
      if (score <= lastSubmittedRef.current) return;
      lastSubmittedRef.current = score;
      submitScore({
        userId: user.id,
        name: userDisplayName(user),
        score,
        avatar: '🙂',
      });
    },
    [isAuthenticated, user]
  );

  // Bayrak henüz okunmadı — splash sonrası kısa an; ekran flash'ını önle.
  if (welcomeDone === null) {
    return <View style={{ flex: 1, backgroundColor: theme.screenBg }} />;
  }

  // İlk açılış: karşılama ekranı (ATT izni burada istenir).
  if (!welcomeDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WelcomeScreen theme={theme} onStart={handleStart} busy={startBusy} />
      </GestureHandlerRootView>
    );
  }

  if (screen === 'game') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GameScreen theme={theme} onGameEnd={handleGameEnd} onBack={() => setScreen('home')} />
      </GestureHandlerRootView>
    );
  }

  if (screen === 'login') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoginScreen
          theme={theme}
          onBack={() => setScreen(loginFrom)}
          onDone={() => setScreen(loginFrom)}
        />
      </GestureHandlerRootView>
    );
  }

  // [YARIŞMA] Yarışma ekranı.
  if (screen === 'compete') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CompeteScreen
          theme={theme}
          onBack={() => setScreen('home')}
          onOpenLogin={() => {
            setLoginFrom('compete');
            setScreen('login');
          }}
        />
      </GestureHandlerRootView>
    );
  }

  if (screen === 'settings') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsScreen
          theme={theme}
          onBack={() => setScreen('home')}
          onOpenLogin={() => {
            setLoginFrom('settings');
            setScreen('login');
          }}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HomeScreen
        theme={theme}
        onPlay={() => setScreen('game')}
        onOpenCompete={() => setScreen('compete')}
        onOpenSettings={() => setScreen('settings')}
      />
    </GestureHandlerRootView>
  );
}
