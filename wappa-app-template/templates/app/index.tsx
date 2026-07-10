import React from 'react';
import { View, Text } from 'react-native';
import { Redirect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWappaAuth } from '@appaflytech/wappa-auth';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ListItem from '@/components/ui/ListItem';
import { useAppState } from '@/lib/app-state';
// [OPSIYONEL] Reklam bannerı — wappa-ads kuruluysa. İstemiyorsan bu satırı ve
// aşağıdaki <AdBanner /> kullanımını sil.
import AdBanner from '@/components/AdBanner';

export default function Home() {
  const { welcomeDone } = useAppState();
  const { isAuthenticated, user } = useWappaAuth();

  // Karşılama bayrağı henüz okunmadı — splash sonrası kısa an; flash'ı önle.
  if (welcomeDone === null) return <Screen>{null}</Screen>;
  // İlk açılış: karşılama ekranına yönlendir.
  if (!welcomeDone) return <Redirect href="/welcome" />;

  const name = user?.firstname || user?.email?.split('@')[0];

  return (
    <Screen scroll>
      {/* Başlık */}
      <View className="pt-4">
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {isAuthenticated ? `Merhaba, ${name} 👋` : 'Hoş geldin 👋'}
        </Text>
        <Text className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
          {'{{APP_NAME}}'}
        </Text>
      </View>

      {/* Örnek hero kartı — component kit'ini gösterir. Kendi içeriğinle değiştir. */}
      <Card className="mt-5 border-0 bg-brand-600">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="rocket-launch-outline" size={28} color="#fff" />
          <Text className="ml-2 text-lg font-bold text-white">Başlangıç noktası</Text>
        </View>
        <Text className="mt-2 text-sm text-brand-100">
          Bu ekran bir örnektir. app/index.tsx içine kendi uygulamanı kur; hazır bileşenler
          components/ui altında.
        </Text>
        <View className="mt-4 flex-row">
          <Button
            label="Dokümanlar"
            variant="secondary"
            size="sm"
            icon="book-open-variant"
            onPress={() => {}}
          />
        </View>
      </Card>

      {/* Örnek gezinme listesi */}
      <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
        Keşfet
      </Text>
      <ListItem
        icon="trophy-outline"
        title="Yarışma"
        subtitle="Sıralama / liderlik tablosu (opsiyonel)"
        onPress={() => router.push('/compete')}
      />
      <ListItem
        icon="cog-outline"
        title="Ayarlar"
        subtitle="Hesap ve uygulama bilgisi"
        onPress={() => router.push('/settings')}
      />
      {!isAuthenticated && (
        <ListItem
          icon="login"
          title="Giriş yap"
          subtitle="Google veya Apple ile"
          onPress={() => router.push('/login')}
        />
      )}

      {/* [OPSIYONEL] Alt reklam bannerı */}
      <View className="mt-6">
        <AdBanner />
      </View>
    </Screen>
  );
}
