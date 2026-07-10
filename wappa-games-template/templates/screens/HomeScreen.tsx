import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Theme } from '../game/theme';
import AdBanner from '../components/AdBanner';

interface HomeScreenProps {
  theme: Theme;
  onPlay: () => void;
  onOpenCompete: () => void; // [YARIŞMA]
  onOpenSettings: () => void;
}

export default function HomeScreen({
  theme,
  onPlay,
  onOpenCompete,
  onOpenSettings,
}: HomeScreenProps) {
  const T = theme;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.screenBg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: T.titleText }]}>{'{{APP_NAME}}'}</Text>
        <Text style={[styles.tagline, { color: T.subText }]}>Oynamaya hazır mısın?</Text>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: T.accent }]}
          activeOpacity={0.85}
          onPress={onPlay}
        >
          <MaterialCommunityIcons name="play" size={28} color={T.textLight} />
          <Text style={[styles.playLabel, { color: T.textLight }]}>Oyna</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          {/* [YARIŞMA] Yarışma yoksa bu butonu kaldır. */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: T.boardBg }]}
            onPress={onOpenCompete}
          >
            <MaterialCommunityIcons name="podium-gold" size={26} color="#fff" />
            <Text style={styles.actionLabel}>Yarışma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: T.boardBg }]}
            onPress={onOpenSettings}
          >
            <MaterialCommunityIcons name="cog" size={26} color="#fff" />
            <Text style={styles.actionLabel}>Ayarlar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alt banner — sadece ana ekranda (oyun ekranında banner yok) */}
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 44, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  tagline: { fontSize: 15, marginTop: 6, marginBottom: 40 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    marginBottom: 24,
  },
  playLabel: { fontSize: 20, fontWeight: '900', marginLeft: 8 },
  actionRow: { flexDirection: 'row', width: '100%' },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionLabel: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 4 },
});
