import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Yuvarlatılmış, kenarlıklı içerik kutusu (light/dark uyumlu). */
export default function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </View>
  );
}
