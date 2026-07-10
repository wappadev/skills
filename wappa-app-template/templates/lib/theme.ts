// JS tarafı tasarım token'ları.
//
// Görsel dilin ASIL kaynağı Tailwind'dir (tailwind.config.js) ve ekranlar renkleri
// `className` ile kullanır (ör. `bg-brand-600`, `text-slate-500`). Bu dosya yalnızca
// className kabul ETMEYEN yerler için gerekir: StatusBar rengi, NavigationContainer
// teması, bazı native prop'lar (ör. RefreshControl tintColor). Tailwind'deki
// `brand` paletiyle senkron tut.

export const colors = {
  brand: '#4f46e5', // brand-600
  brandDark: '#818cf8', // brand-400 (koyu tema vurgusu)
  bgLight: '#ffffff',
  bgDark: '#0b1120',
  textLight: '#0f172a', // slate-900
  textDark: '#e2e8f0', // slate-200
} as const;

export type ColorScheme = 'light' | 'dark';

/** Aktif şemaya göre StatusBar/arka plan gibi JS-taraflı renkleri seç. */
export function palette(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  return {
    accent: dark ? colors.brandDark : colors.brand,
    bg: dark ? colors.bgDark : colors.bgLight,
    text: dark ? colors.textDark : colors.textLight,
    statusBarStyle: dark ? ('light' as const) : ('dark' as const),
  };
}
