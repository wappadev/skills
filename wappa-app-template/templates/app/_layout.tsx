import '../global.css';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState as RNAppState, useColorScheme } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WappaAuthProvider, useWappaAuth } from '@appaflytech/wappa-auth';

// Wappa altyapı modülleri — bu skill'ler tarafından lib/ altına kurulur:
//   wappa-auth → lib/auth.ts, wappa-ads → lib/ads.ts + lib/tracking.ts,
//   wappa-notifications → lib/notifications.ts
import { wappaAuthConfig } from '@/lib/auth';
import { initAds, showAppOpen } from '@/lib/ads';
import { requestTracking } from '@/lib/tracking';
import { startPush } from '@/lib/notifications';
import { AppStateProvider } from '@/lib/app-state';

const welcomeKey = '@{{APP_SLUG}}:welcome_seen';

// Ekranlar arası bildirim yönlendirmesi için geçerli route adları (data.screen).
const ROUTES = new Set(['/', 'settings', 'login', 'compete']);

/**
 * Kök layout: tüm sağlayıcıları (Auth, güvenli alan, jest) sarar, Tailwind'i
 * (global.css) yükler ve Expo Router Stack'ini kurar. ATT→reklam sıralaması ve
 * push kaydı karşılama (welcome) sonrası çalışır.
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  const [welcomeDone, setWelcomeDone] = useState<boolean | null>(null);
  const adsInited = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(welcomeKey).then((v) => setWelcomeDone(v === '1'));
  }, []);

  // Karşılama geçildikten sonra reklam SDK'sını bir kez başlat (ATT'den SONRA;
  // ATT izni welcome ekranında istenir → kişiselleştirilmiş reklam uyumu).
  useEffect(() => {
    if (welcomeDone && !adsInited.current) {
      adsInited.current = true;
      initAds();
    }
  }, [welcomeDone]);

  const markWelcomeDone = useCallback(() => setWelcomeDone(true), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WappaAuthProvider config={wappaAuthConfig}>
          <AppStateProvider value={{ welcomeDone, markWelcomeDone }}>
            <RootEffects welcomeDone={welcomeDone} />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            </Stack>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          </AppStateProvider>
        </WappaAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Sağlayıcıların içinde çalışan efektler (görsel çıktısı yok):
 * push kaydı + bildirime dokunma yönlendirmesi + öne gelişte app-open reklamı.
 */
function RootEffects({ welcomeDone }: { welcomeDone: boolean | null }) {
  const { user } = useWappaAuth();

  const handlePushTap = useCallback(
    ({ notification }: { notification: { data: Record<string, unknown> } }) => {
      const target = notification.data?.screen;
      if (typeof target === 'string' && ROUTES.has(target)) {
        router.push(target as never);
      }
    },
    []
  );

  // Push: karşılama sonrası izin iste + FCM token'ı panele kaydet. Kullanıcı
  // giriş/çıkış yaptığında publicUserId değişir → token güncel kimlikle yenilenir.
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
  const appStateRef = useRef<AppStateStatus>(RNAppState.currentState);
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        showAppOpen(Date.now());
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  return null;
}
