# Fastlane `supply` — Android mağaza metadata düzeni

Bu klasör Google Play Store listelemesini KOD olarak tutar. `fastlane supply`
(EAS iOS metadata'nın Android karşılığı) bu ağacı okuyup Play Console'a push eder.
iOS tarafı `store.config.json` (EAS Metadata) ile yönetilir — Play burada.

## Klasör ağacı

```
fastlane/metadata/android/
  en-US/                         # locale dizini (Play locale kodu: en-US, tr-TR, de-DE ...)
    title.txt                    # uygulama adı        — max 30 karakter
    short_description.txt        # kısa açıklama        — max 80 karakter
    full_description.txt         # tam açıklama         — max 4000 karakter
    images/
      icon.png                   # 512×512, 32-bit PNG (alpha'lı)
      featureGraphic.png         # 1024×500 (öne çıkan görsel — ZORUNLU)
      phoneScreenshots/          # 1080×1920 (dikey), min 2 max 8 dosya
        1_hero.png
        2_modes.png
        ...
      sevenInchScreenshots/      # 7" tablet görselleri (tablet hedefliyorsan)
      tenInchScreenshots/        # 10" tablet görselleri (tablet hedefliyorsan)
  tr-TR/
    title.txt
    short_description.txt
    full_description.txt
    images/
      ...
```

## Kurallar

- **Locale dizin adı** Play Console locale koduyla birebir aynı olmalı: `en-US`,
  `tr-TR`, `de-DE`, `fr-FR` ... (iOS'taki `en-US`/`tr` kısaltmasından FARKLI — Android
  her zaman bölge ekli tam kodu ister.)
- `.txt` dosyaları düz UTF-8, tek başlıksız metin. Karakter limitleri Play tarafından
  serttir; aşarsan `supply` reddeder.
- `images/` alt klasör adları Fastlane tarafından tanınan SABİT isimlerdir; değiştirme:
  `icon.png`, `featureGraphic.png`, `phoneScreenshots/`, `sevenInchScreenshots/`,
  `tenInchScreenshots/`, ayrıca opsiyonel `tvScreenshots/`, `wearScreenshots/`.
- Ekran görüntüsü dosya adları alfabetik sıralanır → `1_...`, `2_...` ön ekiyle sırayı
  garantiye al.
- Görsel yüklemek istemiyorsan `supply` çağrısında `skip_upload_images: true` ve
  `skip_upload_screenshots: true` ver; yalnızca metin push edilir.

## Bu şablonda görsel YOK

Binary PNG'ler bilinçli olarak eklenmedi (repo şişmesin). Yukarıdaki boyutlarda kendi
görsellerini üret ve doğru klasöre koy. Üretim adımları için SKILL.md → "Görseller"
bölümüne bak.

## Push

Bu ağacı Play'e göndermek bu skill'in işi DEĞİL — `store-deploy` skill'inin
`metadata_android` CI job'u (Mod D) `fastlane supply` ile push eder.
