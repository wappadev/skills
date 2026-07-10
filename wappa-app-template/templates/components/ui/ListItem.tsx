import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  /** Sağ tarafta özel içerik (verilmezse onPress varsa chevron gösterilir). */
  right?: React.ReactNode;
}

/** Ayarlar/menü satırı — ikon + başlık + alt başlık + sağ aksiyon. */
export default function ListItem({ title, subtitle, icon, onPress, right }: ListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mb-2 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
    >
      {icon && (
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-slate-800">
          <MaterialCommunityIcons name={icon} size={22} color="#4f46e5" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
        {subtitle && (
          <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text>
        )}
      </View>
      {right ?? (onPress && <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />)}
    </Pressable>
  );
}
