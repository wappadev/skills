import React from 'react';
import { Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import Screen from '@/components/ui/Screen';
import Header from '@/components/ui/Header';
import ListItem from '@/components/ui/ListItem';
import { stopPush } from '@/lib/notifications';

// WappaUser → görünen ad (ad soyad, yoksa e-posta ön eki).
function displayName(
  u: { firstname?: string; lastname?: string; email?: string } | null | undefined
): string {
  if (!u) return 'Kullanıcı';
  const full = [u.firstname, u.lastname].filter(Boolean).join(' ').trim();
  if (full) return full;
  return u.email ? u.email.split('@')[0] : 'Kullanıcı';
}

export default function Settings() {
  const { isAuthenticated, user, logout } = useWappaAuth();

  const handleLogout = async () => {
    // Çıkışta cihaz token'ını panelden sil, sonra oturumu kapat.
    await stopPush().catch(() => {});
    await logout();
  };

  return (
    <Screen scroll>
      <Header title="Ayarlar" />

      <Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        Hesap
      </Text>
      {isAuthenticated && user ? (
        <ListItem
          icon="account-circle"
          title={displayName(user)}
          subtitle={user.email}
          right={
            <Pressable onPress={handleLogout} hitSlop={8}>
              <Text className="font-bold text-red-500">Çıkış</Text>
            </Pressable>
          }
        />
      ) : (
        <ListItem
          icon="login"
          title="Giriş yap"
          subtitle="Google veya Apple ile"
          onPress={() => router.push('/login')}
        />
      )}

      <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
        Hakkında
      </Text>
      <ListItem icon="information-outline" title={'{{APP_NAME}}'} subtitle="Sürüm 1.0.0" />
    </Screen>
  );
}
