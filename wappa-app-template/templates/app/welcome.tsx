import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '@/components/ui/Screen';
import Button from '@/components/ui/Button';
import { useAppState } from '@/lib/app-state';
import { requestTracking } from '@/lib/tracking';

const welcomeKey = '@{{APP_SLUG}}:welcome_seen';

const FEATURES: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  desc: string;
}[] = [
  { icon: 'flash', title: 'Hızlı ve modern', desc: 'NativeWind ile akıcı arayüz' },
  { icon: 'account-check', title: 'Güvenli giriş', desc: 'Google & Apple ile tek dokunuş' },
  { icon: 'bell-ring', title: 'Bildirimler', desc: 'Önemli güncellemeleri kaçırma' },
];

export default function Welcome() {
  const { markWelcomeDone } = useAppState();
  const [busy, setBusy] = useState(false);

  // "Başla": iOS'ta ATT izni iste, bayrağı kaydet, ana ekrana geç.
  const handleStart = useCallback(async () => {
    setBusy(true);
    try {
      await requestTracking();
    } finally {
      await AsyncStorage.setItem(welcomeKey, '1');
      markWelcomeDone();
      router.replace('/');
    }
  }, [markWelcomeDone]);

  return (
    <Screen contentClassName="px-6">
      <View className="flex-1 items-center justify-center">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-brand-600">
          <MaterialCommunityIcons name="rocket-launch" size={44} color="#fff" />
        </View>
        <Text className="text-center text-4xl font-black text-slate-900 dark:text-white">
          {'{{APP_NAME}}'}
        </Text>
        <Text className="mb-8 mt-2 text-base text-slate-500 dark:text-slate-400">
          Hadi başlayalım!
        </Text>

        <View className="w-full">
          {FEATURES.map((f) => (
            <View
              key={f.title}
              className="mb-3 flex-row items-center rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-700">
                <MaterialCommunityIcons name={f.icon} size={22} color="#4f46e5" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {f.title}
                </Text>
                <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="pb-2">
        <Button
          label={busy ? 'Hazırlanıyor…' : 'Hadi Başla'}
          icon={busy ? undefined : 'arrow-right'}
          size="lg"
          fullWidth
          loading={busy}
          onPress={handleStart}
        />
        <Text className="mt-3 text-center text-xs text-slate-400">
          Devam ederek reklam kişiselleştirme izni sorulabilir; reddetsen de uygulama tam çalışır.
        </Text>
      </View>
    </Screen>
  );
}
