# {{APP_NAME}} — React Native (Expo)

`wappa-app-template` ile üretilmiş **modern genel amaçlı** uygulama. Stack: **Expo Router**
(dosya tabanlı navigasyon) + **NativeWind** (Tailwind CSS) + Wappa altyapısı: sosyal giriş
(Google/Apple), push bildirimleri, reklamlar (AdMob + ATT) ve opsiyonel yarışma (leaderboard).

## Çalıştırma
```bash
bun install       # bir kez (npm/yarn de olur; CI bun.lock kullanır)
bun run start     # Expo geliştirici sunucusu
bun run typecheck # TypeScript tür denetimi (tsc --noEmit)
```
Native modüller (Firebase, AdMob, wappa-auth/notifications) için **dev build** gerekir —
Expo Go yetmez:
```bash
npx expo run:ios      # veya run:android
```

## Yapı
- `app/` — **Expo Router** route'ları (dosya = ekran). `_layout.tsx` kök: sağlayıcılar +
  Tailwind (`global.css`) + push/reklam/ATT kabloları. `index.tsx` (ana), `welcome.tsx`,
  `settings.tsx`, `login.tsx`, `compete.tsx`.
- `components/ui/` — **NativeWind** bileşen kiti: `Screen`, `Button`, `Card`, `Field`,
  `ListItem`, `Header`. Kendi ekranlarını bunlarla kur.
- `lib/` — Wappa modülleri + tema: `auth.ts`, `notifications.ts`, `ads.ts`, `tracking.ts`,
  `leaderboard.ts`, `theme.ts`, `app-state.tsx`.
- `plugins/` — iOS/Android build düzeltmeleri (config plugin'ler).
- `tailwind.config.js` / `global.css` / `metro.config.js` — NativeWind yapılandırması.

## Stil (NativeWind / Tailwind)
Bileşenlere `className` ile yaz: `<View className="flex-1 items-center bg-white dark:bg-slate-950">`.
Marka renkleri `tailwind.config.js` → `colors.brand`; koyu tema `dark:` önekiyle otomatik.
className kabul etmeyen yerler (StatusBar vb.) için `lib/theme.ts`.

## `@/` yol kısayolu
Importlar proje kökünden: `@/components/ui/Button`, `@/lib/auth` (bkz. `tsconfig.json` paths).

## Sonraki adımlar
1. **Uygulamanı kur:** `app/index.tsx`'i kendi içeriğinle değiştir; yeni ekran = `app/` altına
   yeni dosya (ör. `app/detail.tsx` → `/detail`).
2. **Firebase:** `google-services.json` + `GoogleService-Info.plist` dosyalarını köke koy. Bkz. `wappa-auth`.
3. **AdMob:** `lib/ads.ts` ad unit ID'leri + `app.json` app ID'leri. Bkz. `wappa-ads`.
4. **Backend (yarışma):** Score entity + query'lerini MCP ile aç. Bkz. `wappa-mcp-backend` + `wappa-leaderboard`.
5. **Mağaza:** listeleme için `store-assets`/`store-screenshots`, CI/CD + yayın için `store-deploy`.
