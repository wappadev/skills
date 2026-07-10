// [YARIŞMA] Bu ekran yalnızca yarışma (leaderboard) özelliği açıksa gerekir.
// Backend modelleri (Score entity + score-leaderboard/submit-score query'leri)
// wappa-mcp-backend skill'i ile açılır; client tarafı wappa-leaderboard skill'i.
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import { fetchLeaderboard, userDisplayName } from '../game/leaderboard';
import type { LeaderboardRow, ScoreUser } from '../game/leaderboard';
import type { Theme } from '../game/theme';

type TabId = 'daily' | 'all';
const TABS: { id: TabId; label: string }[] = [
  { id: 'daily', label: 'Günlük' },
  { id: 'all', label: 'Tüm Zamanlar' },
];

interface CompeteScreenProps {
  theme: Theme;
  onBack: () => void;
  /** Giriş ekranını aç (opsiyonel Google/Apple girişi). */
  onOpenLogin: () => void;
}

export default function CompeteScreen({ theme, onBack, onOpenLogin }: CompeteScreenProps) {
  const T = theme;
  const { isAuthenticated, loading: authLoading, user } = useWappaAuth();
  const [tab, setTab] = useState<TabId>('daily');
  const [daily, setDaily] = useState<LeaderboardRow[] | null>(null);
  const [all, setAll] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const me: ScoreUser | undefined =
      isAuthenticated && user
        ? { userId: user.id, name: userDisplayName(user), avatar: '🙂' }
        : undefined;

    Promise.all([fetchLeaderboard('daily', me), fetchLeaderboard('all', me)]).then(([d, a]) => {
      if (cancelled) return;
      setDaily(d);
      setAll(a);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const MEDAL: Record<number, string> = { 1: '#f6c945', 2: '#c8ccd0', 3: '#cd8a54' };

  const renderRows = (rows: LeaderboardRow[] | null) => {
    if (!rows) return <ActivityIndicator color={T.titleText} style={{ marginTop: 30 }} />;
    if (rows.length === 0) {
      return (
        <Text style={[styles.note, { color: T.subText, marginTop: 24 }]}>
          Henüz skor yok — ilk sen ol!
        </Text>
      );
    }
    return rows.map((r) => (
      <View key={r.rank} style={[styles.row, { backgroundColor: T.boardBg }, r.me && styles.rowMe]}>
        <View style={styles.rankBox}>
          {MEDAL[r.rank] ? (
            <MaterialCommunityIcons name="medal" size={22} color={MEDAL[r.rank]} />
          ) : (
            <Text style={styles.rank}>{r.rank}</Text>
          )}
        </View>
        <Text style={styles.avatar}>{r.avatar}</Text>
        <Text style={styles.name}>{r.name}</Text>
        <Text style={styles.score}>{r.score.toLocaleString('tr-TR')}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.screenBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={T.titleText} />
          <Text style={[styles.backText, { color: T.titleText }]}>Menü</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: T.titleText }]}>Yarışma</Text>
        <View style={{ width: 60 }} />
      </View>

      {!authLoading && !isAuthenticated && (
        <TouchableOpacity
          style={[styles.loginBanner, { backgroundColor: T.boardBg }]}
          activeOpacity={0.85}
          onPress={onOpenLogin}
        >
          <MaterialCommunityIcons name="account-arrow-right" size={22} color="#fff" />
          <Text style={styles.loginBannerText}>Sıralamada yer almak için giriş yap</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && { backgroundColor: T.boardBg }]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, { color: tab === t.id ? '#fff' : T.subText }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'daily' ? renderRows(daily) : renderRows(all)}
      </ScrollView>
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
  loginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  loginBannerText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 10 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabText: { fontWeight: '800', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 40 },
  note: { fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowMe: { borderWidth: 2, borderColor: '#f65e3b' },
  rankBox: { width: 34, alignItems: 'center' },
  rank: { fontSize: 16, fontWeight: '900', color: '#fff' },
  avatar: { fontSize: 24, marginRight: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  score: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
