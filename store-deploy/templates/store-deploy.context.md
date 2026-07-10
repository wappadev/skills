# Store Deploy — Proje Context (store-deploy skill override)

Bu dosya `store-deploy` skill'i tarafından okunur. Bu repoya özgü değerleri içerir; skill
başka projeye kopyalansa bile bu dosya bu repoda kaldığı için değerler karışmaz.
Uygulama **repo kökünde** (alt klasör YOK). Bu dosyayı yeni projeye kopyalayıp `<...>`
alanlarını doldur; skill klasörünün İÇİNDE DEĞİL, repo kökünde `.claude/` altında dursun.

| Anahtar | Değer |
|---|---|
| `<CI_FILE>` | `.gitlab-ci.yml` (repo kökü) |
| `<APP_DIR>` | `./` (Expo uygulaması kökte) |
| `<BUNDLE_ID>` | `{{BUNDLE_ID}}` (iOS + Android aynı) |
| `<TEAM_ID>` | **TODO** — Apple Team ID (eas.json submit → `appleTeamId`) |
| `ascAppId` | `{{ASC_APP_ID}}` (App Store Connect'te uygulama oluşturulunca; eas.json submit) |
| `<RUNNER>` | **TODO** — self-hosted macOS runner tag'i (`.gitlab-ci.yml` → `tags:`, `resource_group: macos_runner`) |
| Sürüm şeması | `vX.Y.Z` (ilk sürüm `v1.0.0`) |
| EAS profilleri | `eas.json` → production: `credentialsSource: remote`, `appVersionSource=remote`, `autoIncrement=true` |
| Mağaza metni | iOS `store.config.json` (EAS Metadata). Android Fastlane `fastlane/metadata/android/`. Bkz. store-assets skill'i. |
| GitLab remote | **TODO** — `git@gitlab.com:.../<proje>.git` |

## Kurulum durumu
Altyapı yeni kuruldu, henüz canlı değilse şunları kullanıcı tamamlamalı:
1. **EAS/Expo hesabı** → `npx eas-cli init` (app.json'a `extra.eas.projectId` + `owner`).
2. **App Store Connect'te uygulama oluştur** → `ascAppId`'yi eas.json submit.ios'a yaz.
3. **ASC API Key** (.p8, Issuer ID, Key ID) → CI değişkenleri `ASC_KEY_BASE64`, `ASC_KEY_ID`, `ASC_ISSUER_ID`.
4. **Apple Team ID** → eas.json submit.ios.appleTeamId + bu context.
5. **Google Play** (Android) → service account JSON → CI değişkeni `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
6. **CI değişkenleri**: `EXPO_TOKEN` + yukarıdakiler (Masked+Protected).
7. **macOS runner** tag'ini `.gitlab-ci.yml` `default.tags`'e yaz.

## CI job haritası
- `build_ios` / `build_android` — tag'de otomatik, EAS **local** build. iOS'ta keychain temizlik adımı var.
- `submit_ios` / `submit_android` — **manuel**, build artifact'ını App Store / Play'e gönderir.
- `metadata_ios` / `metadata_android` — **manuel**, `needs: []`; listeleme metnini push eder.

## Notlar
- Bundle ID son segment rakamla başlayamaz (Android) → `2048` yerine `oyun2048` gibi kullan.
- Reklam SDK'sı varsa App Privacy'de reklam/izleme verisi beyan et; AD_ID izni app.json'da.
- store.config.json URL'leri gerçek destek/gizlilik sayfalarıyla değiştir.
