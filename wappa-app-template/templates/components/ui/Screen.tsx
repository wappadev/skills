import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  /** İçeriği dikey kaydırılabilir yap (uzun sayfalar için). */
  scroll?: boolean;
  /** Kök kapsayıcıya ek Tailwind sınıfları. */
  className?: string;
  /** İçerik kapsayıcısına ek Tailwind sınıfları (varsayılan: yatay padding). */
  contentClassName?: string;
  /** Güvenli alan kenarları (varsayılan üst+alt). */
  edges?: Edge[];
}

/**
 * Tüm ekranların temel kabuğu: güvenli alan (insets) + tema arka planı (light/dark).
 * `bg-white dark:bg-slate-950` NativeWind ile otomatik tema değişimini sağlar.
 *
 * Not: NativeWind `className`'i çekirdek RN bileşenlerinde çalışır; bu yüzden
 * safe-area `SafeAreaView` yerine `useSafeAreaInsets` + `View` kullanıyoruz.
 */
export default function Screen({
  children,
  scroll = false,
  className = '',
  contentClassName = 'px-5',
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const top = edges.includes('top') ? insets.top : 0;
  const bottom = edges.includes('bottom') ? insets.bottom : 0;

  if (scroll) {
    return (
      <View className={`flex-1 bg-white dark:bg-slate-950 ${className}`} style={{ paddingTop: top }}>
        <ScrollView
          contentContainerClassName={`grow ${contentClassName}`}
          contentContainerStyle={{ paddingBottom: bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      className={`flex-1 bg-white dark:bg-slate-950 ${contentClassName} ${className}`}
      style={{ paddingTop: top, paddingBottom: bottom }}
    >
      {children}
    </View>
  );
}
