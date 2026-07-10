import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Theme } from '../game/theme';

interface WelcomeScreenProps {
  theme: Theme;
  /** Kullanıcı "Başla"ya bastığında; ATT izni burada istenir, sonra ana ekrana geçilir. */
  onStart: () => void;
  busy?: boolean;
}

const FEATURES: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  desc: string;
}[] = [
  { icon: 'gamepad-variant', title: 'Oyna', desc: 'Basit ve keyifli oynanış' },
  { icon: 'podium-gold', title: 'Yarışma', desc: 'Sıralamada yerini al' },
  { icon: 'trophy', title: 'Rekorlar', desc: 'En yüksek skoru kovala' },
];

export default function WelcomeScreen({ theme, onStart, busy = false }: WelcomeScreenProps) {
  const T = theme;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.screenBg }]}>
      <View style={styles.content}>
        <View style={[styles.logo, { backgroundColor: T.boardBg }]}>
          <MaterialCommunityIcons name="gamepad-variant" size={44} color={T.textLight} />
        </View>

        <Text style={[styles.title, { color: T.titleText }]}>{'{{APP_NAME}}'}</Text>
        <Text style={[styles.tagline, { color: T.subText }]}>Hadi başlayalım!</Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.featureRow, { backgroundColor: T.boardBg }]}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={f.icon} size={22} color="#fff" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: T.accent }, busy && styles.startBtnBusy]}
          activeOpacity={0.85}
          onPress={onStart}
          disabled={busy}
        >
          <Text style={[styles.startLabel, { color: T.textLight }]}>
            {busy ? 'Hazırlanıyor…' : 'Hadi Başla'}
          </Text>
          {!busy && <MaterialCommunityIcons name="arrow-right" size={22} color={T.textLight} />}
        </TouchableOpacity>
        <Text style={[styles.consentNote, { color: T.subText }]}>
          Devam ederek reklam kişiselleştirme izni sorulabilir; reddetsen de oyun tam çalışır.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  tagline: { fontSize: 16, marginTop: 6, marginBottom: 34 },
  features: { width: '100%' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  featureText: { flex: 1, marginLeft: 14 },
  featureTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  featureDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
  },
  startBtnBusy: { opacity: 0.7 },
  startLabel: { fontSize: 18, fontWeight: '900', marginRight: 6 },
  consentNote: { fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
});
