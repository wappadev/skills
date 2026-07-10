import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

/** Etiketli metin girişi — formlar için hazır (light/dark uyumlu). */
export default function Field({ label, error, className = '', ...input }: FieldProps) {
  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#94a3b8"
        className={`h-12 rounded-2xl border bg-white px-4 text-base text-slate-900 dark:bg-slate-900 dark:text-slate-100 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        {...input}
      />
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
