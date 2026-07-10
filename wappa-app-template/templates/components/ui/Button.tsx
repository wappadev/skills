import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  fullWidth?: boolean;
  className?: string;
}

// Tailwind sınıf haritaları — cva benzeri, ek bağımlılık olmadan.
const CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand-600 active:bg-brand-700',
  secondary: 'bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700',
  ghost: 'bg-transparent active:bg-slate-100 dark:active:bg-slate-800',
  danger: 'bg-red-600 active:bg-red-700',
};
const TEXT: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-slate-900 dark:text-slate-100',
  ghost: 'text-brand-600 dark:text-brand-400',
  danger: 'text-white',
};
// İkon rengi className kabul etmez → variant başına düz renk.
const ICON: Record<Variant, string> = {
  primary: '#ffffff',
  secondary: '#0f172a',
  ghost: '#4f46e5',
  danger: '#ffffff',
};
const SIZE: Record<Size, string> = {
  sm: 'h-10 px-4 rounded-xl',
  md: 'h-12 px-5 rounded-2xl',
  lg: 'h-14 px-6 rounded-2xl',
};
const TEXT_SIZE: Record<Size, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      className={`flex-row items-center justify-center ${SIZE[size]} ${CONTAINER[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={ICON[variant]} />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={size === 'lg' ? 22 : 18}
              color={ICON[variant]}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`font-bold ${TEXT_SIZE[size]} ${TEXT[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
