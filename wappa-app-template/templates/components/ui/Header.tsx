import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  /** Geri aksiyonu (varsayılan: router.back()). */
  onBack?: () => void;
  /** Geri butonunu gizle (kök ekranlar için). */
  hideBack?: boolean;
  /** Sağ tarafta aksiyon (ikon butonu vb.). */
  right?: React.ReactNode;
}

/** Basit geri-butonlu başlık — route ekranlarında ortak kullanım. */
export default function Header({ title, onBack, hideBack, right }: HeaderProps) {
  return (
    <View className="flex-row items-center pt-2">
      {!hideBack && (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          className="mr-1 h-9 w-9 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="#64748b" />
        </Pressable>
      )}
      <Text className="flex-1 text-2xl font-black text-slate-900 dark:text-white">{title}</Text>
      {right}
    </View>
  );
}
