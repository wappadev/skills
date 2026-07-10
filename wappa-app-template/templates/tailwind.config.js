/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind bu dosyaları className için tarar. Yeni klasör eklersen buraya ekle.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // 'media' → `dark:` sınıfları cihazın sistem temasını otomatik takip eder
  // (app.json userInterfaceStyle: "automatic" ile uyumlu). Manuel geçiş isteyip
  // colorScheme.set(...) kullanacaksan 'class' yap.
  darkMode: 'media',
  theme: {
    extend: {
      // Marka renk paleti — uygulamana göre değiştir. Ekranlar `bg-brand-500`,
      // `text-brand-600` gibi sınıflarla bunları kullanır. Aynı değerler JS
      // tarafı için lib/theme.ts'te tekrarlanır (StatusBar, className olmayan proplar).
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
};
