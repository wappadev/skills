---
name: expo-icons
description: >-
  Generate every icon and splash asset an Expo / React Native app needs from a
  single source logo, and wire the matching fields + expo-splash-screen plugin
  into app.json. Use when setting up a new Expo game's assets/ folder (icon.png,
  icon-512.png, adaptive-icon.png, splash-icon.png, splash-icon-dark.png,
  favicon.png, logo-mark.png), when the app icon shows a black box on iOS
  (transparency in icon.png), when the Android adaptive icon is cropped/too big
  (safe-zone padding), when adding a light/dark splash screen, or when the
  app.json icon / android.adaptiveIcon / web.favicon / splash config is missing
  or wrong. Bundles a self-bootstrapping Node script (templates/generate-icons.js)
  that auto-installs sharp (no project dependency needed), produces correctly
  sized OPAQUE icons and TRANSPARENT adaptive/splash images, and can patch
  app.json in place. Triggers: expo icon, app icon, adaptive icon, splash screen,
  favicon, icon.png black square, assets klasörü, ikon üret, generate icons,
  app.json icon/splash. Sibling of wappa-games-template.
---

# expo-icons — Tek logodan tüm Expo ikonlarını üret + app.json'a bağla

Bir Expo / React Native uygulamasının `assets/` klasöründe **gereken tüm ikon ve
açılış görsellerini** tek bir kaynak logodan üretir ve `app.json`'a gerekli alanları
(icon, adaptive icon, favicon) ve `expo-splash-screen` plugin'ini ekler.

Betik: `templates/generate-icons.js`. **Proje bağımlılığı gerekmez** — `sharp` yoksa
`~/.cache/wappa-icons` altına tek seferlik `--no-save` kurar, oradan yükler. Yalnızca
`node` yeterli.

## 1) Üretilen dosyalar

| Dosya | Boyut | Alpha | Ne için |
|---|---|---|---|
| `icon.png` | 1024×1024 | **OPAK** | Ana uygulama ikonu (iOS + Android). iOS şeffaflığı siyaha çevirir → opak olmalı. Logo %78 marjinli. |
| `icon-512.png` | 512×512 | opak | Mağaza / bildirim ikonu |
| `adaptive-icon.png` | 1024×1024 | **ŞEFFAF** | Android adaptive **foreground**. Logo merkezde %66 (güvenli alan) — kenarlar maskeleneceği için taşma olmasın. Arka plan `app.json`'daki `backgroundColor`'dan gelir. |
| `splash-icon.png` | 1024×1024 | şeffaf | Açılış ekranı (açık tema), logo %60 |
| `splash-icon-dark.png` | 1024×1024 | şeffaf | Açılış ekranı (koyu tema) |
| `favicon.png` | 48×48 | opak | Web favicon |
| `logo-mark.png` | 1024×1024 | şeffaf | Kaynağın temiz kopyası (yeniden üretim için) |

## 2) Kaynak görsel

- **Kare**, yüksek çözünürlük (≥1024×1024), tercihen **şeffaf arka planlı PNG** (yalnız logo/marka).
- Şeffaf kaynak → adaptive & splash düzgün çıkar; arka planı skript ekler.
- Belirtmezsen sırayla şunları arar: `./assets/logo-mark.png` → `./assets/icon.png` → `./logo.png`.

## 3) Kullanım

Proje kökünde çalıştır (yolları oradan çözer):

```bash
# Sadece ikonları üret (app.json'a dokunma):
node <skill>/templates/generate-icons.js --source ./assets/logo-mark.png --out ./assets --bg "#faf8ef" --adaptive-bg "#bbada0" --splash-dark-bg "#1c1c1e"

# İkonları üret VE app.json'ı yamala:
node <skill>/templates/generate-icons.js --source ./brand.png --out ./assets \
  --bg "#faf8ef" --adaptive-bg "#bbada0" --splash-dark-bg "#1c1c1e" --app-json ./app.json
```

`<skill>` = bu skill klasörü (global kurulumda `~/.claude/skills/expo-icons`).

### Bayraklar

| Bayrak | Varsayılan | Açıklama |
|---|---|---|
| `--source <yol>` | otomatik bul | Kaynak logo |
| `--source-dark <yol>` | `--source` ile aynı | Koyu splash için ayrı logo (opsiyonel) |
| `--out <dizin>` | `./assets` | Çıktı klasörü |
| `--bg <hex>` | `#ffffff` | `icon.png` / `favicon` arka plan rengi (OPAK) |
| `--adaptive-bg <hex>` | `--bg` | Android adaptive arka planı → `app.json`'a yazılır |
| `--splash-dark-bg <hex>` | `#000000` | Koyu splash arka planı → `app.json`'a yazılır |
| `--app-json <yol>` | (yok) | Verilirse `app.json` yamalanır; verilmezse dokunulmaz |

## 4) app.json'a eklenen/güncellenen alanlar (`--app-json` ile)

- `expo.icon` = `./assets/icon.png`
- `expo.android.adaptiveIcon` = `{ foregroundImage: ./assets/adaptive-icon.png, backgroundColor: <adaptive-bg> }`
- `expo.web.favicon` = `./assets/favicon.png`
- `expo.plugins` içine `expo-splash-screen` (yoksa eklenir, varsa güncellenir):
  ```json
  ["expo-splash-screen", {
    "image": "./assets/splash-icon.png", "imageWidth": 300, "resizeMode": "contain",
    "backgroundColor": "#ffffff",
    "dark": { "image": "./assets/splash-icon-dark.png", "backgroundColor": "<splash-dark-bg>" }
  }]
  ```

Yamalama **birleştiricidir**: mevcut plugin listesini ve diğer alanları korur; yalnızca
ikon/splash ile ilgili anahtarları günceller. `app.json` 2-boşluk girintiyle yeniden yazılır.

> `expo-splash-screen`'in çalışması için pakete ihtiyaç var:
> `npx expo install expo-splash-screen`.

## 5) Sık hatalar

- **iOS ikonunda siyah kutu / kare** → `icon.png`'de alpha var. Bu skript `icon.png`'i
  daima **flatten** edip opak yazar; sorun sürüyorsa kaynağı yeniden ver ve üret.
- **Android ikonu kırpılmış / çok büyük** → adaptive foreground güvenli alanı taşıyor.
  Skript logoyu %66'da tutar; kaynak zaten kenara dayalıysa daha küçük bir kaynak kullan.
- **Splash bulanık** → kaynak küçük. En az 1024×1024 şeffaf kaynak ver.
- **`sharp` kurulmuyor** → ağ/registry sorunu. Elle: `npm i -D sharp` sonra tekrar çalıştır
  (skript proje `node_modules`'ından da yükleyebilir).

## 6) Doğrulama

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/icon.png          # 1024, hasAlpha: no
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/adaptive-icon.png # 1024, hasAlpha: yes
```

`wappa-games-template` yeni oyun kurarken bu skill'i `assets/` üretmek için çağırır.
