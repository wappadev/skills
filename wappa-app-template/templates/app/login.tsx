import React, { useState, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import Screen from '@/components/ui/Screen';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';

// Kullanıcı akışı iptal ettiğinde hata gösterme (sessiz geç).
// expo-apple-authentication: 'ERR_REQUEST_CANCELED'
// @react-native-google-signin: 'SIGN_IN_CANCELLED' / '-5' (iOS) / '12501' (Android)
function isCancel(err: unknown): boolean {
  const msg = String((err as Error)?.message || '').toLowerCase();
  const code = String((err as { code?: string })?.code || '').toLowerCase();
  return (
    code.includes('cancel') ||
    code === '-5' ||
    code === '12501' ||
    msg.includes('cancel') ||
    msg.includes('iptal')
  );
}

export default function Login() {
  const { loginWithGoogle, loginWithApple, loading } = useWappaAuth();
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (provider: 'google' | 'apple', fn: () => Promise<unknown>) => {
      if (busy) return;
      setError(null);
      setBusy(provider);
      try {
        const result = await fn();
        // controller null ise fn() sessizce undefined döner → modal hiç açılmaz.
        if (result === undefined) {
          setError(`Oturum hazır değil (controller=null, loading=${loading}). Provider init olmadı.`);
          return;
        }
        router.back();
      } catch (err) {
        if (!isCancel(err)) {
          const code = String((err as { code?: string })?.code ?? '');
          const msg = String((err as Error)?.message ?? '');
          setError(`Giriş hatası [${provider}] ${code || '?'}: ${msg || 'bilinmeyen'}`);
        }
      } finally {
        setBusy(null);
      }
    },
    [busy, loading]
  );

  return (
    <Screen contentClassName="px-6">
      <Header title="" />
      <View className="flex-1 items-center justify-center">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-brand-600">
          <MaterialCommunityIcons name="account-circle-outline" size={40} color="#fff" />
        </View>
        <Text className="text-3xl font-black text-slate-900 dark:text-white">Giriş yap</Text>
        <Text className="mb-9 mt-2 text-center text-base text-slate-500 dark:text-slate-400">
          Hesabını bağla, cihazlar arası senkron kal.
        </Text>

        <View className="w-full max-w-sm">
          <Button
            label="Google ile devam et"
            icon="google"
            variant="secondary"
            size="lg"
            fullWidth
            loading={busy === 'google'}
            disabled={!!busy}
            onPress={() => run('google', loginWithGoogle)}
            className="mb-3"
          />
          {Platform.OS === 'ios' && (
            <Button
              label="Apple ile devam et"
              icon="apple"
              variant="danger"
              size="lg"
              fullWidth
              loading={busy === 'apple'}
              disabled={!!busy}
              onPress={() => run('apple', loginWithApple)}
              className="bg-black active:bg-black/80"
            />
          )}
        </View>

        {error && (
          <Text className="mt-4 text-center text-sm font-semibold text-red-500">{error}</Text>
        )}
      </View>

      <Text className="pb-4 text-center text-xs text-slate-400">
        Giriş yaparak Kullanım Şartları ve Gizlilik Politikasını kabul edersin.
      </Text>
    </Screen>
  );
}
