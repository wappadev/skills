import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import type { Theme } from '../game/theme';

interface LoginScreenProps {
  theme: Theme;
  /** Geri / kapat. */
  onBack: () => void;
  /** Giriş başarılı olduğunda çağrılır. */
  onDone: () => void;
}

// Kullanıcı akışı iptal ettiğinde hata gösterme (sessiz geç).
// expo-apple-authentication: code 'ERR_REQUEST_CANCELED'
// @react-native-google-signin: code 'SIGN_IN_CANCELLED' / '-5' (iOS) / '12501' (Android)
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

export default function LoginScreen({ theme, onBack, onDone }: LoginScreenProps) {
  const T = theme;
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
        // Bunu yakalayıp görünür kıl (yoksa "hiçbir şey olmuyor" gibi görünür).
        if (result === undefined) {
          setError(
            `Oturum hazır değil (controller=null, loading=${loading}). Provider init olmadı.`
          );
          return;
        }
        onDone();
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
    [busy, onDone, loading]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.screenBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} disabled={!!busy}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={T.titleText} />
          <Text style={[styles.backText, { color: T.titleText }]}>Geri</Text>
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.logo, { backgroundColor: T.boardBg }]}>
          <MaterialCommunityIcons name="account-circle" size={44} color={T.textLight} />
        </View>

        <Text style={[styles.title, { color: T.titleText }]}>Giriş yap</Text>
        <Text style={[styles.subtitle, { color: T.subText }]}>
          Skorlarını kaydet, sıralamada yerini al.
        </Text>

        <View style={styles.buttons}>
          {/* Google */}
          <TouchableOpacity
            style={[styles.socialBtn, styles.googleBtn, busy && styles.btnDim]}
            activeOpacity={0.85}
            onPress={() => run('google', loginWithGoogle)}
            disabled={!!busy}
          >
            {busy === 'google' ? (
              <ActivityIndicator color="#3c4043" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={22} color="#4285F4" />
                <Text style={styles.googleLabel}>Google ile devam et</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple — yalnızca iOS */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn, busy && styles.btnDim]}
              activeOpacity={0.85}
              onPress={() => run('apple', loginWithApple)}
              disabled={!!busy}
            >
              {busy === 'apple' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="apple" size={24} color="#fff" />
                  <Text style={styles.appleLabel}>Apple ile devam et</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Text style={[styles.legal, { color: T.subText }]}>
        Giriş yaparak Kullanım Şartları ve Gizlilik Politikasını kabul edersin.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  backBtn: { padding: 6, width: 60, flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 34, fontWeight: '900' },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: 36, textAlign: 'center' },
  buttons: { width: '100%', maxWidth: 380 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
    minHeight: 54,
  },
  btnDim: { opacity: 0.7 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0' },
  googleLabel: { color: '#3c4043', fontSize: 16, fontWeight: '700', marginLeft: 10 },
  appleBtn: { backgroundColor: '#000' },
  appleLabel: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  error: { color: '#e5484d', fontSize: 14, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
    lineHeight: 17,
  },
});
