import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Theme } from '../game/theme';

interface GameScreenProps {
  theme: Theme;
  /** Oyun bittiğinde nihai skorla çağrılır (yarışmaya bu skor gönderilir). */
  onGameEnd: (score: number) => void;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// OYUN MANTIĞI PLACEHOLDER'I
//
// Bu şablon KASITLI olarak boştur — oyunun asıl içeriği (tahta, kurallar, skor
// mantığı, animasyonlar) buraya senin tarafından yazılır. Kabuk (auth, push,
// reklam, yarışma) hazır; sen sadece oyunu doldur.
//
// Sözleşme: oyun bittiğinde `onGameEnd(finalScore)` çağır → giriş yapmış kullanıcı
// için yeni bir kişisel rekorsa skor otomatik yarışmaya (leaderboard) gönderilir.
// ─────────────────────────────────────────────────────────────────────────────

export default function GameScreen({ theme, onGameEnd, onBack }: GameScreenProps) {
  const T = theme;
  const [score, setScore] = useState(0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.screenBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={T.titleText} />
          <Text style={[styles.backText, { color: T.titleText }]}>Menü</Text>
        </TouchableOpacity>
        <Text style={[styles.score, { color: T.titleText }]}>Skor: {score}</Text>
      </View>

      <View style={styles.body}>
        <MaterialCommunityIcons name="gamepad-variant" size={64} color={T.boardBg} />
        <Text style={[styles.title, { color: T.titleText }]}>Oyun buraya gelecek</Text>
        <Text style={[styles.hint, { color: T.subText }]}>
          screens/GameScreen.tsx içine oyun mantığını ekle. Aşağıdaki butonlar
          yalnızca kabuğun çalıştığını göstermek için örnek.
        </Text>

        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: T.accent }]}
          onPress={() => setScore((s) => s + 100)}
        >
          <Text style={[styles.demoLabel, { color: T.textLight }]}>+100 puan (demo)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: T.boardBg }]}
          onPress={() => onGameEnd(score)}
        >
          <Text style={[styles.demoLabel, { color: T.textLight }]}>Oyunu bitir (demo)</Text>
        </TouchableOpacity>
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
  backBtn: { padding: 6, flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 18, fontWeight: '700' },
  score: { fontSize: 18, fontWeight: '900' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 16 },
  hint: { fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 20 },
  demoBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 12, minWidth: 220, alignItems: 'center' },
  demoLabel: { fontSize: 16, fontWeight: '800' },
});
