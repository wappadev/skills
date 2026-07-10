import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import type { Theme } from '../game/theme';
import { stopPush } from '../game/notifications';

interface SettingsScreenProps {
  theme: Theme;
  onBack: () => void;
  /** Giriş ekranını aç. */
  onOpenLogin: () => void;
}

// WappaUser → görünen ad (ad soyad, yoksa e-posta ön eki).
function displayName(
  u: { firstname?: string; lastname?: string; email?: string } | null | undefined
): string {
  if (!u) return 'Oyuncu';
  const full = [u.firstname, u.lastname].filter(Boolean).join(' ').trim();
  if (full) return full;
  return u.email ? u.email.split('@')[0] : 'Oyuncu';
}

export default function SettingsScreen({ theme, onBack, onOpenLogin }: SettingsScreenProps) {
  const T = theme;
  const { isAuthenticated, user, logout } = useWappaAuth();

  const handleLogout = async () => {
    // Çıkışta cihaz token'ını panelden sil, sonra oturumu kapat.
    await stopPush().catch(() => {});
    await logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.screenBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={T.titleText} />
          <Text style={[styles.backText, { color: T.titleText }]}>Menü</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: T.titleText }]}>Ayarlar</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Hesap */}
        <Text style={[styles.section, { color: T.subText }]}>HESAP</Text>
        {isAuthenticated && user ? (
          <View style={[styles.card, { backgroundColor: T.boardBg }]}>
            <MaterialCommunityIcons name="account-circle" size={40} color="#fff" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{displayName(user)}</Text>
              <Text style={styles.cardSub}>{user.email}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logout}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: T.boardBg }]}
            activeOpacity={0.85}
            onPress={onOpenLogin}
          >
            <MaterialCommunityIcons name="account-arrow-right" size={30} color="#fff" />
            <Text style={[styles.cardTitle, { flex: 1, marginLeft: 12 }]}>Giriş yap</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Hakkında */}
        <Text style={[styles.section, { color: T.subText, marginTop: 24 }]}>HAKKINDA</Text>
        <View style={[styles.card, { backgroundColor: T.boardBg }]}>
          <MaterialCommunityIcons name="information" size={28} color="#fff" />
          <Text style={[styles.cardTitle, { flex: 1, marginLeft: 12 }]}>{'{{APP_NAME}}'}</Text>
          <Text style={styles.cardSub}>v1.0.0</Text>
        </View>
      </View>
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
  title: { fontSize: 24, fontWeight: '900' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  logout: { color: '#ffd7d0', fontSize: 15, fontWeight: '800' },
});
