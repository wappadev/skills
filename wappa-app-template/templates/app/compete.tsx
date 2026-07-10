// [YARIŞMA] Opsiyonel liderlik tablosu örneği. Backend (Score entity + query'ler)
// wappa-mcp-backend ile, client (lib/leaderboard.ts) wappa-leaderboard ile kurulur.
// Yarışma istemiyorsan bu dosyayı ve app/index.tsx'teki "Yarışma" satırını sil.
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import Screen from '@/components/ui/Screen';
import Header from '@/components/ui/Header';
import { fetchLeaderboard, userDisplayName } from '@/lib/leaderboard';
import type { LeaderboardRow, ScoreUser } from '@/lib/leaderboard';

type TabId = 'daily' | 'all';
const TABS: { id: TabId; label: string }[] = [
  { id: 'daily', label: 'Günlük' },
  { id: 'all', label: 'Tüm Zamanlar' },
];
const MEDAL: Record<number, string> = { 1: '#f6c945', 2: '#c8ccd0', 3: '#cd8a54' };

export default function Compete() {
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

  const rows = tab === 'daily' ? daily : all;

  return (
    <Screen>
      <Header title="Yarışma" />

      {!authLoading && !isAuthenticated && (
        <Pressable
          onPress={() => router.push('/login')}
          className="mt-3 flex-row items-center rounded-2xl bg-brand-600 p-3.5 active:bg-brand-700"
        >
          <MaterialCommunityIcons name="account-arrow-right" size={22} color="#fff" />
          <Text className="ml-2.5 flex-1 font-bold text-white">Sıralamada yer almak için giriş yap</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
        </Pressable>
      )}

      {/* Sekmeler */}
      <View className="mt-3 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            className={`flex-1 items-center rounded-xl py-2 ${
              tab === t.id ? 'bg-white dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                tab === t.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {!rows ? (
          <ActivityIndicator color="#4f46e5" className="mt-8" />
        ) : rows.length === 0 ? (
          <Text className="mt-8 text-center text-sm text-slate-400">
            Henüz skor yok — ilk sen ol!
          </Text>
        ) : (
          rows.map((r) => (
            <View
              key={r.rank}
              className={`mb-2 flex-row items-center rounded-2xl border p-3 ${
                r.me
                  ? 'border-brand-500 bg-brand-50 dark:bg-slate-800'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <View className="w-8 items-center">
                {MEDAL[r.rank] ? (
                  <MaterialCommunityIcons name="medal" size={22} color={MEDAL[r.rank]} />
                ) : (
                  <Text className="font-black text-slate-400">{r.rank}</Text>
                )}
              </View>
              <Text className="mx-2 text-2xl">{r.avatar}</Text>
              <Text className="flex-1 font-bold text-slate-900 dark:text-white">{r.name}</Text>
              <Text className="font-black text-slate-900 dark:text-white">
                {r.score.toLocaleString('tr-TR')}
              </Text>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
