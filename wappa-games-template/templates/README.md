# {{APP_NAME}} — React Native (Expo)

`wappa-games-template` ile üretilmiş oyun uygulaması. Wappa altyapısı hazır: sosyal giriş
(Google/Apple), push bildirimleri, reklamlar (AdMob + ATT) ve yarışma (leaderboard).

## Çalıştırma
```bash
bun install       # bir kez (npm/yarn de olur; CI bun.lock kullanır)
bun run start     # Expo geliştirici sunucusu
bun run typecheck # TypeScript tür denetimi (tsc --noEmit)
```
Sonra: iOS simülatör `i`, Android emülatör `a`, Web `w`. Native modüller (Firebase,
AdMob, wappa-auth/notifications) için **dev build** gerekir — Expo Go yetmez:
```bash
npx expo run:ios      # veya run:android
```

## Yapı
- `game/` — oyuna özel mantık (senin dolduracağın kısım) + wappa modülleri:
  `auth.ts`, `notifications.ts`, `ads.ts`, `tracking.ts`, `leaderboard.ts`, `theme.ts`
- `screens/` — Welcome, Home, Game (placeholder), Settings, Login, Compete
- `components/` — AdBanner
- `plugins/` — iOS/Android build düzeltmeleri (config plugin'ler)
- `App.tsx` — gezinme + wappa entegrasyon kablolaması
- `index.js` — kök; WappaAuthProvider ile sarılı

## Sonraki adımlar
1. **Oyun mantığını yaz:** `screens/GameScreen.tsx` içindeki placeholder'ı gerçek oyunla değiştir; bittiğinde `onGameEnd(score)` çağır.
2. **Firebase:** `google-services.json` + `GoogleService-Info.plist` dosyalarını proje köküne koy, panele yükle. Bkz. `wappa-auth` skill'i.
3. **AdMob:** `game/ads.ts` içindeki ad unit ID'lerini + `app.json` app ID'lerini gir. Bkz. `wappa-ads`.
4. **Backend (yarışma):** Score entity + query'lerini MCP ile aç. Bkz. `wappa-mcp-backend` + `wappa-leaderboard`.
5. **Mağaza:** listeleme metni/görselleri için `store-assets`, CI/CD + yayın için `store-deploy` skill'leri.
