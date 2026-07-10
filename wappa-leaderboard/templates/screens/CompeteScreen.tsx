import React, { useState, useEffect, useRef } from 'react';
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
import { fetchLeaderboard, submitScore, userDisplayName } from '../game/leaderboard';
import type { LeaderboardRow, ScoreUser } from '../game/leaderboard';
import { ACHIEVEMENTS } from '../game/achievements';
import type { UnlockedMap } from '../game/achievements';
import type { Theme } from '../game/themes';

type TabId = 'daily' | 'all' | 'achievements';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'daily', label: 'Günlük' },
  { id: 'all', label: 'Tüm Zamanlar' },
  { id: 'achievements', label: 'Başarımlar' },
];

interface CompeteScreenProps {
  theme: Theme;
  totalBest: number;
  unlocked: UnlockedMap;
  onBack: () => void;
  /** Giriş ekranını aç (opsiyonel Google/Apple girişi). */
  onOpenLogin: () => void;
}

export default function CompeteScreen({
  theme,
  totalBest,
  unlocked,
  onBack,
  onOpenLogin,
}: CompeteScreenProps) {
  const T = theme;
  const { isAuthenticated, loading: authLoading, user } = useWappaAuth();
  const [tab, setTab] = useState<TabId>('daily');
  const [daily, setDaily] = useState<LeaderboardRow[] | null>(null);
  const [all, setAll] = useState<LeaderboardRow[] | null>(null);
  // Bu ekran açılışında en fazla bir kez skor gönder (yalnızca kişisel rekor gelişince).
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const me: ScoreUser | undefined =
      isAuthenticated && user
        ? { userId: user.id, name: userDisplayName(user), avatar: '🙂' }
        : undefined;

    async function load() {
      const [d, a] = await Promise.all([
        fetchLeaderboard('daily', me),
        fetchLeaderboard('all', me),
      ]);
      if (cancelled) return;
      setDaily(d);
      setAll(a);

      // Giriş yapılmışsa ve skor mevcut en iyisini geçtiyse kaydet, sonra tazele.
      if (me && totalBest > 0 && !submittedRef.current) {
        const myBest = a.find((r) => r.me)?.score ?? 0;
        if (totalBest > myBest) {
          submittedRef.current = true;
          const ok = await submitScore({
            userId: me.userId,
            name: me.name,
            score: totalBest,
            avatar: me.avatar,
          });
          if (ok && !cancelled) {
            const [d2, a2] = await Promise.all([
              fetchLeaderboard('daily', me),
              fetchLeaderboard('all', me),
            ]);
            if (cancelled) return;
            setDaily(d2);
            setAll(a2);
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [totalBest, isAuthenticated, user?.id]);

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
      <View
        key={r.rank}
        style={[styles.row, { backgroundColor: T.boardBg }, r.me && styles.rowMe]}
      >
        <View style={styles.rankBox}>
          {MEDAL[r.rank] ? (
            <MaterialCommunityIcons name="medal" size={22} color={MEDAL[r.rank]} />
          ) : (
            <Text style={styles.rank}>{r.rank}</Text>
          )}
        </View>
        <Text style={styles.avatar}>{r.avatar}</Text>
        <View style={styles.nameRow}>
          {r.online !== undefined && (
            <View
              style={[styles.dot, { backgroundColor: r.online ? '#7ef542' : '#888' }]}
            />
          )}
          <Text style={styles.name}>{r.name}</Text>
        </View>
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
          <Text style={styles.loginBannerText}>
            Sıralamada yer almak için giriş yap
          </Text>
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
        {tab === 'daily' && (
          <>
            <View style={styles.noteRow}>
              <MaterialCommunityIcons name="calendar-refresh" size={14} color={T.subText} />
              <Text style={[styles.note, { color: T.subText }]}>
                Günlük skor tablosu — her gün sıfırlanır
              </Text>
            </View>
            {renderRows(daily)}
          </>
        )}
        {tab === 'all' && (
          <>
            <View style={styles.noteRow}>
              <MaterialCommunityIcons name="trophy-outline" size={14} color={T.subText} />
              <Text style={[styles.note, { color: T.subText }]}>
                Tüm zamanların en yüksek skorları
              </Text>
            </View>
            {renderRows(all)}
          </>
        )}
        {tab === 'achievements' && (
          <>
            <Text style={[styles.note, { color: T.subText }]}>
              {Object.values(unlocked).filter(Boolean).length}/{ACHIEVEMENTS.length} açıldı
            </Text>
            {ACHIEVEMENTS.map((a) => {
              const done = !!unlocked[a.id];
              return (
                <View
                  key={a.id}
                  style={[styles.ach, { backgroundColor: T.boardBg }, !done && styles.achLocked]}
                >
                  <MaterialCommunityIcons
                    name={done ? a.icon : 'lock'}
                    size={30}
                    color={done ? '#f6c945' : '#fff'}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.achTitle}>{a.title}</Text>
                    <Text style={styles.achDesc}>{a.desc}</Text>
                  </View>
                  {done && <MaterialCommunityIcons name="check-bold" size={20} color="#7ef542" />}
                </View>
              );
            })}
          </>
        )}
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
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  note: { fontSize: 13, textAlign: 'center', marginLeft: 5 },
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
  nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  score: { fontSize: 16, fontWeight: '900', color: '#fff' },
  ach: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  achLocked: { opacity: 0.5 },
  achIcon: { fontSize: 30 },
  achTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  achDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  achDone: { fontSize: 20, fontWeight: '900', color: '#7ef542' },
});
