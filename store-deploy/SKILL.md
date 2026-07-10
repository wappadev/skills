---
name: store-deploy
description: >-
  Diagnose and fix GitLab CI iOS/Android builds that use EAS local build on a self-hosted
  macOS runner, and cut releases by git-tagging. Portable across projects: it auto-detects
  project specifics (CI file path, bundle ids, Apple Team ID, runner) at runtime by searching
  the project directly from the repo root — it does NOT assume a nested `app-template/`
  subfolder. Use when a pipeline job fails, when a CI build log is shared or opened
  (e.g. gitlab-ios.log), when an iOS code-signing / "ARCHIVE FAILED" / provisioning-profile
  error appears, when releasing a new version, or when pushing/diagnosing app store listing
  metadata (EAS Metadata `store.config.json` or Fastlane `supply`). Reply in the user's language.
---

# Store Deploy — iOS/Android (EAS Local Build) Asistanı

EAS local build + self-hosted macOS runner kullanan Expo projelerinin GitLab CI/CD
pipeline'ını yönetir ve mağaza (App Store / Play) dağıtımını yürütür (teşhis · düzeltme ·
sürüm çıkarma). **Projeye özgü hiçbir değer hardcode DEĞİLDİR** — her çalıştırmada aşağıdaki
"Adım 0" ile **doğrudan repo kökünden** keşfedilir; `app-template/` gibi bir alt klasör
VARSAYILMAZ. Kullanıcının diliyle yanıt ver.

---

## Adım 0 — Proje Keşfi (önce bunu yap, değerleri doldur)

Aşağıdakileri çalıştır/oku ve bul. Bulunan değerleri sonraki adımlarda `<...>`
yerine kullan. Bir değer net bulunamazsa **kullanıcıya sor**, varsayma.

> **Arama kuralı:** Uygulama **doğrudan repo kökünde** aranır (`App.tsx`/`app.json`/`eas.json`
> kökte). `app-template/` gibi sabit bir alt klasör VARSAYMA. `find` bir alt klasörde
> pipeline bulursa (monorepo), kökten en yakın/gerçek olanı seç; belirsizse kullanıcıya sor.

1. **CI dosyası** `<CI_FILE>` ve include zinciri:
   ```bash
   find . -name '.gitlab-ci.yml' -not -path '*/node_modules/*'
   ```
   (Genelde kökte tek `.gitlab-ci.yml`. Monorepo'da kök dosyası bir alt klasördeki asıl
   pipeline'ı `include` edebilir — o zaman ikisini de izle.)

2. **EAS profilleri** — CI dosyasının yanındaki (genelde kökteki) `eas.json`: build/submit
   profilleri, `credentialsSource`, `appVersionSource`, `autoIncrement`, `ascAppId`.

3. **Bundle id(ler)** `<BUNDLE_ID>` (widget/extension hedefleri dahil):
   ```bash
   grep -rEn "bundleIdentifier|\"package\"" app.json app.config.* 2>/dev/null
   ```

4. **Apple Team ID** `<TEAM_ID>` — repoda nadiren yazar. Şu sırayla bul:
   build log'undaki `Apple Team ... (XXXXXXXXXX)` satırı → yoksa kullanıcının
   terminal çıktısı (`security find-identity -v -p codesigning` → `(TEAMID)`) →
   yoksa `eas credentials`. **Bash aracıyla `security` çalıştırıp sonuç çıkarma**
   (aşağıdaki kritik nota bak).

5. **Runner** `<RUNNER>` — `<CI_FILE>` içindeki `tags:` ve log'daki "Running on ..." satırı.

6. **Derin doküman** — varsa `**/docs/gitlab-ci-pipeline.md`'i referans al
   (`find . -name 'gitlab-ci-pipeline.md' -not -path '*/node_modules/*'`); yoksa atla.

7. **Mağaza metni yönetimi (varsa)** — listeleme metni kod olarak yönetiliyor mu:
   iOS `store.config.json` (EAS Metadata), Android `fastlane/` (Appfile/Fastfile) +
   `fastlane/metadata/android/<locale>/`. Varsa **Mod D** devreye girer.
   ```bash
   ls store.config.json fastlane/Fastfile 2>/dev/null; find . -path '*/fastlane/metadata/android' -not -path '*/node_modules/*'
   ```

> Opsiyonel kalıcı override: repo kökünde `.claude/store-deploy.context.md` varsa onu
> oku ve değerleri oradan al (auto-detect yerine). Bu dosya **skill klasörünün İÇİNDE
> değildir** — böylece skill başka projeye/makineye kopyalanınca yanlış değerler taşınmaz;
> her proje kendi context dosyasını taşır. Context yoksa (bu proje henüz kurulmamış olabilir)
> her şey kökten auto-detect edilir.

---

## Hızlı Gerçekler (EAS local + tag-tabanlı pipeline'larda genelde geçerli)

- Pipeline genelde **yalnızca git tag** push'unda çalışır (`workflow.rules` / `only: tags`).
  Bunu `<CI_FILE>`'dan doğrula. Sürüm çıkarmak = **yeni tag atmak**.
- Build/submit kendi **macOS runner**'da **EAS local** ile çalışır.
- iOS imza: `eas.json` `credentialsSource: remote` ise sertifika + provisioning profile
  **EAS'ta** yönetilir. `appVersionSource=remote` + `autoIncrement=true` ise build numarası
  otomatik artar → **manuel version bump yok**.
- Mağaza **listeleme metni** (başlık/açıklama/keywords) uygulama binary'sinden AYRIDIR; varsa
  kod olarak yönetilir → bkz. **Mod D**. EAS Metadata yalnızca **Apple**'ı yönetir; Google Play
  için Fastlane `supply` gerekir. CI'de genelde ayrı **manuel** `metadata_*` job'larıdır (`needs: []`).

> ⚠️ **Kritik araç notu:** Yerel `security`/keychain komutlarını **Bash aracıyla
> çalıştırma** — bu ortam sandbox'lı/anlık bir kopya görür ve runner'ın gerçek
> keychain'ini YANSITMAZ (yanlış sertifika hash'i verdirtebilir). Keychain durumu için
> **her zaman kullanıcının kendi terminal çıktısını** doğru kaynak kabul et.

---

## Mod A — Başarısız Build'i Teşhis Et

1. Log'u edin (yapıştırılmış ya da açık `gitlab-*.log`). Dosya büyük + satırlar uzun
   olabilir → tümünü okuma; hata kalıplarını ara:
   ```bash
   grep -niE "error|fail|❌|ARCHIVE FAILED|exit status|doesn't include|Timeout waiting|No such file" <log>
   ```
2. **Hangi job/stage** patladı ve **gerçek kök satır** ne (genelde en sonda; "Job failed:
   exit status 1" sebep değil sonuçtur).
3. Tabloya eşle, kök neden + çözümü kısaca anlat (değerleri Adım 0'dan kişiselleştir).

### Bilinen Kök Nedenler → Çözüm

| Belirti (log'da) | Kök neden | Çözüm |
|---|---|---|
| `doesn't include signing certificate ... ARCHIVE FAILED (exit 65)` | Runner'ın login keychain'inde, EAS'inkiyle **aynı adlı stale dağıtım sertifikası** (`...Distribution: ... (<TEAM_ID>)`); xcodebuild yanlışını seçiyor | Mod B → imza temizliği |
| `eas: No such file or directory` | Paralel job'lar global `eas`'i eziyor | `resource_group` ile job'ları sıraya sok |
| `Cannot find module './ios'` | Bozuk npx cache | `rm -rf ~/.npm/_npx` |
| `Timeout waiting to lock jars-9` | Stale Gradle lock | `~/.gradle/caches/*.lock` temizliği + daemon kill |
| Gradle JVM başlamıyor / jenv shim hatası | Bozuk `jenv` shim PATH'te | `JAVA_HOME`'u gerçek JDK'ya sabitle, bin'ini PATH başına al |
| `:expo:lintVitalAnalyzeRelease FAILED` + `Unexpected failure during lint analysis ... this is a bug in lint` (genelde `ExpoModulesPackageList.kt`, K2) | AGP/Kotlin **K2 lint'inin İÇ çökmesi** — gerçek kod hatası değil, toolchain bug'ı. `abortOnError` yetmez (task exception fırlatır) | Mod B → release lint-vital'i config plugin ile kapat |
| `:expo-modules-core:compileReleaseKotlin FAILED` + `Compose Compiler (1.5.15) requires Kotlin version 1.9.25 but you appear to be using Kotlin version 1.9.24` | **Expo SDK 52**'de Compose Compiler ↔ Kotlin sürüm uyuşmazlığı (compileSdk 35'e çıkınca tetiklenir; SDK 52 varsayılanı Kotlin 1.9.24) | Mod B → `expo-build-properties` ile `android.kotlinVersion: "1.9.25"` |
| `:expo-modules-core:compileReleaseKotlin FAILED` + `PermissionsService.kt:...: Only safe (?.) or non-null asserted (!!.) calls are allowed on a nullable receiver of type Array<(out) String!>?` | **Expo SDK 51**'de compileSdk 35'e çıkınca **Kotlin 2.0 (K2)** çekiliyor; K2'nin katı null kuralı SDK 51'in `expo-modules-core` koduyla uyumsuz (SDK 51 Kotlin 1.9.24 ile yazıldı) | Mod B → `expo-build-properties` ile `android.kotlinVersion: "1.9.24"` (K1'e sabitle) |
| `submit` aşamasında `Google Api Error: Invalid request - Target SDK of artifact is too low: N` | AAB'nin targetSdk'si Play'in güncel şartından (API **35**, Ağu 2025+) düşük; eski Expo SDK (51/52) varsayılan 34 ya da altını hedefliyor | Mod B → `expo-build-properties` ile `targetSdkVersion: 35` (+ compileSdk/buildTools 35) |
| `Failed to authenticate ... Apple Team ID:` | EAS'taki ASC API key'de Team ID yok | **Non-fatal**; build'i bloke etmez. `eas credentials` ile Team ID gir |
| Bir script adımı anında "exit status 1", `eas build`'e gelmeden | `grep`/komut `pipefail`+`set -e` altında no-match'te exit 1 | Çıktıyı `|| true` ile değişkene al, sonra işle |
| Pipeline hiç oluşmadı | Tag yerine branch push | Mod C → tag at |
| `eas metadata:push` / `fastlane supply` hatası | Mağaza listeleme metni job'u patladı (build değil) | Mod D → mağaza metni |

---

## Mod B — Bilinen Düzeltmeleri Uygula

### iOS kod imzalama (en sık) — kalıcı + tek seferlik

**Kalıcı (CI):** `build_ios` job'una, `eas build`'den ÖNCE çalışan idempotent bir adım
ekle: login keychain'deki tüm dağıtım sertifikalarını sil (EAS kendi sertifikasını geçici
keychain'e getirdiğinden login keychain'de gerekmez). `<TEAM_ID>`'yi Adım 0'dan al; eşleşme
ortak ad üzerinden yapılır.
```bash
LOGIN_KC="$HOME/Library/Keychains/login.keychain-db"
# grep no-match'te exit 1 döner; pipefail+set -e altında job'u düşürür → || true ile koru
HASHES="$(security find-certificate -a -c "Distribution" -Z "$LOGIN_KC" 2>/dev/null | grep -oE '[0-9A-F]{40}' || true)"
if [ -n "$HASHES" ]; then
  for H in $HASHES; do security delete-certificate -Z "$H" "$LOGIN_KC" >/dev/null 2>&1 && echo "🗑️  $H"; done
else
  echo "ℹ️  Temizlenecek dağıtım sertifikası yok"
fi
```

**Tek seferlik (kullanıcı kendi terminalinde, sadece gerekirse):** Doğru hash'i
kullanıcının çıktısından al (Bash aracından DEĞİL):
```bash
security find-identity -v -p codesigning                                   # HASH'i buradan al
security delete-certificate -Z <HASH> ~/Library/Keychains/login.keychain-db
security find-identity -v -p codesigning                                   # dağıtım sertifikası kalmamalı
```

### Android release lint çöküyor (`lintVitalAnalyzeRelease` crash) — config plugin ile kapat

Belirti: `:expo:lintVitalAnalyzeRelease FAILED` → `Unexpected failure during lint analysis
of ExpoModulesPackageList.kt (this is a bug in lint…)` + `KotlinIllegalArgumentExceptionWithAttachments`.
Kök neden: AGP + Kotlin **K2** lint'inin generate edilen dosyada iç çökmesi (kod hatası
DEĞİL). `lint { abortOnError false }` tek başına **yetmez** — task hata raporlamıyor,
exception fırlatıyor → `checkReleaseBuilds false` ile task'ı hiç çalıştırma.

Managed/CNG projede `android/` her prebuild'de yeniden üretilir → `android/app/build.gradle`'ı
**elle düzenleme** (ezilir). Düzeltme bir **config plugin** ile yapılır: `withAppBuildGradle`
ile `android {}` bloğunun içine lint bloğunu enjekte et. Varsa mevcut bir Android config
plugin'ine (ör. `plugins/withAndroidBuildStability.js`) ekle; yoksa yeni `plugins/<ad>.js`
yazıp `app.json` → `expo.plugins`'e `"./plugins/<ad>"` olarak kaydet.

```js
const { withAppBuildGradle } = require("expo/config-plugins");
module.exports = (config) => withAppBuildGradle(config, (cfg) => {
  if (cfg.modResults.language !== "groovy") throw new Error("build.gradle Groovy değil");
  const c = cfg.modResults.contents;
  if (!c.includes("checkReleaseBuilds")) {          // idempotent
    cfg.modResults.contents = c.replace(/\nandroid\s*\{/,
      (m) => `${m}\n    lint {\n        checkReleaseBuilds false\n        abortOnError false\n    }\n`);
  }
  return cfg;
});
```

Doğrula: `node -c plugins/<ad>.js` + enjeksiyonu mevcut `android/app/build.gradle`'a karşı
test et (regex `\nandroid {` eşleşmeli, ikinci uygulama değiştirmemeli). Sonra Mod C → yeni
tag ile build'i tekrar tetikle (eski tag fix'i içermez). İlgili not: aynı task daha önce
**OOM (Metaspace)** de verebilir → o ayrı sorun, `gradle.properties` belleğini artır.

### Android targetSdk/Kotlin sürümlerini `expo-build-properties` ile sabitle

**Kök sorun:** Play artık targetSdk **35** ister (31 Ağu 2025+) ama eski Expo SDK'ları (51/52)
varsayılan 34 hedefler. Bu yüzden `expo-build-properties` ile compileSdk/targetSdk 35'e çıkarılır.
Ancak **compileSdk'yı 35'e çıkarmak Android toolchain'inde yeni bir Kotlin çektirir** ve o Kotlin,
o Expo SDK'nın `expo-modules-core` koduyla uyumsuz olursa `compileReleaseKotlin` patlar. Çözüm:
`kotlinVersion`'ı **o Expo SDK'nın beklediği sürüme** sabitlemek. `android/` her prebuild'de
yeniden üretildiği için değerler `gradle.properties`'e plugin'den enjekte edilir; `build.gradle`
elle düzenlenmez.

Üç bağımsız belirti, hepsi bu tek plugin bloğuyla çözülür:
1. **`Target SDK ... too low`** — `submit_android` / `fastlane supply` aşamasında (build'de değil).
   → `targetSdkVersion: 35`.
2. **`Compose Compiler (1.5.15) requires Kotlin 1.9.25 but ... 1.9.24`** (SDK 52) → Kotlin uyuşmazlığı.
3. **`PermissionsService.kt: Only safe (?.) ... calls allowed on nullable receiver`** (SDK 51) →
   Kotlin 2.0 (K2) SDK 51'in koduyla uyumsuz.

**Expo SDK → `kotlinVersion` / `expo-build-properties` sürümü** (compileSdk 35 pinlerken kullan;
sabit varsayma, yeni SDK'da değişir — şüphedeysen o SDK'nın android varsayılanını kontrol et):

| Expo SDK | React Native | `kotlinVersion` | `expo-build-properties` |
|---|---|---|---|
| 51 | 0.74 | `1.9.24` | `~0.12.5` |
| 52 | 0.76 | `1.9.25` | `~0.13.3` |
| 56 | 0.85 | `2.3.20` | `~56.0.21` |

`app.json` → `expo.plugins` (örnek SDK 52; `kotlinVersion`'ı yukarıdaki tablodan seç):

```json
[
  "expo-build-properties",
  {
    "android": {
      "compileSdkVersion": 35,
      "targetSdkVersion": 35,
      "buildToolsVersion": "35.0.0",
      "kotlinVersion": "1.9.25"
    }
  }
]
```

Doğrula: `npx expo prebuild --platform android --no-install` sonra
`grep -E "targetSdkVersion|kotlinVersion" android/gradle.properties` → `35` ve pinlediğin Kotlin'i
görmeli, ardından `rm -rf android`. Sonra Mod C → yeni tag ile build'i tekrar tetikle.

> **Not:** Bu SDK 51/52'de compileSdk 35'i zorlamanın bedeli. Kalıcı/temiz çözüm Expo SDK'yı
> güncellemektir (56+ zaten targetSdk 35 + uyumlu Kotlin ile gelir → hiçbir pin gerekmez).

### Genel
Çoğu düzeltme zaten `<CI_FILE>`'da olabilir; regresyon varsa ilgili bloğu geri ekle.
Değişiklikten sonra YAML'ı doğrula:
```bash
ruby -ryaml -e "YAML.load_file('<CI_FILE>'); puts 'OK'"   # ruby yoksa: python3 -c "import yaml,sys;yaml.safe_load(open('<CI_FILE>'))"
```

---

## Mod C — Sürüm Yayınla (Release)

Pipeline yalnızca tag'de çalışır. **Push/tag/submit geri-dönüşsüz → ÖNCE kullanıcıya
onaylat** (sürüm no, branch).

```bash
git tag --sort=-v:refname | head -5     # son tag'ler → bir sonrakini öner (tag tekrar atılamaz)
# (gerekiyorsa) git add ... && git commit && git push
git tag vX.Y.Z && git push origin vX.Y.Z
```
`build_ios` + `build_android` otomatik başlar. App Store/Play'e göndermek için pipeline'da
`submit_*` job'ları **manuel** tetiklenir.

> Commit mesajı sonuna: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

### Submit job'ları — kimlik enjeksiyonu (KRİTİK desen)

`eas-cli submit` ASC/Play kimliklerini **yalnızca `eas.json` submit profilinden** okur —
`EXPO_ASC_*` gibi env değişkenleri **desteklenmez**. Bu yüzden gizli anahtarlar repoda/eas.json'da
tutulmaz; CI değişkeninden `private/`'a açılıp **runtime'da `node -e` ile eas.json'a enjekte** edilir
(job bitince artifact'a girmez). Şablonda hazır olan desen:

- **`submit_ios`** (`needs: [build_ios]`) — `ASC_KEY_BASE64` → `private/asc-api-key.p8`; sonra
  `ascApiKeyPath` + `ascApiKeyId` (`ASC_KEY_ID`) + `ascApiKeyIssuerId` (`ASC_ISSUER_ID`) eas.json
  `submit.production.ios`'a yazılır → `eas-cli submit --platform ios --path build-ios.ipa`.
- **`submit_android`** (`needs: [build_android]`) — `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
  `private/play-service-account.json`'a açılır (**base64 mı düz JSON mu** ilk karakter `{` testiyle
  ayrılır), `serviceAccountKeyPath` + `track: internal` eas.json'a yazılır →
  `eas-cli submit --platform android --path build-android.aab`.

> **Play ilk yayın sırası:** Uygulama Play Console'da **elle** oluşturulmalı ve **en az bir build**
> yüklenmiş olmalı (API app yaratamaz). Sıra: Console'da app oluştur → `submit_android` →
> `metadata_android`. `track: internal` başlangıç için uygundur.

---

## Mod D — Mağaza Metni (Store Listing) Güncelle / Teşhis

Proje listeleme metnini **kod olarak** yönetiyorsa (Adım 0/7), bu binary'den AYRI güncellenir.
Hangi aracın kurulu olduğunu Adım 0'dan al. **Push dışa dönük + canlı listelemeyi değiştirir →
ÖNCE kullanıcıya onaylat**; mümkünse önce doğrula / `git diff`'le.

İki yol vardır: **CI job'ları** (`metadata_ios` / `metadata_android`, tag'de manuel) veya
**yerel elle** çalıştırma. Job'lar da aşağıdaki komutları kimlik enjeksiyonuyla sarar.

### iOS — EAS Metadata (`store.config.json`)
- Yalnızca **Apple App Store**'u yönetir (Google Play'i DEĞİL).
- **CI job (`metadata_ios`, `needs: []`)**: `ASC_KEY_BASE64` → `private/asc-api-key.p8`; `node -e`
  ile `ascApiKeyPath`/`ascApiKeyId`/`ascApiKeyIssuerId` eas.json `submit.production.ios`'a enjekte
  edilir (submit ile **aynı** desen; `EXPO_ASC_*` desteklenmez) → `eas-cli metadata:push --profile
  production --non-interactive`.
- Yerel gönder: `eas metadata:push --profile <submit_profile>` (kimlik + uygulama kimliğini
  `eas.json` submit profilinden okur: ASC API key + `ascAppId`).
- Canlıyı indir/yedekle: `eas metadata:pull` → **dosyanın üstüne yazar**; push edilmemiş yerel
  dilleri kaybetmemek için önce push et ya da ayrı yedeğe çek.
- Geçerli İngilizce yereller: `en-US`, `en-GB`, `en-AU`, `en-CA` (**`en-UK` GEÇERSİZ** → `en-GB`).
- Alan limitleri: title 30, subtitle 30, promoText 170, description 4000, keywords (virgülle birleşik) 100.

### Android — Fastlane supply (`fastlane/metadata/android/<locale>/`)
- Dosyalar: `title.txt` (30) / `short_description.txt` (80) / `full_description.txt` (4000).
- **CI job (`metadata_android`, `needs: []`)**: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` →
  `private/play-service-account.json` (base64/düz-JSON ilk-karakter `{` testiyle ayrılır); fastlane
  yoksa `gem install fastlane`; sonra:
  ```bash
  fastlane supply --json_key private/play-service-account.json --package_name <BUNDLE_ID> \
    --track internal --metadata_path fastlane/metadata/android \
    --skip_upload_apk true --skip_upload_aab true --skip_upload_changelogs true \
    --skip_upload_images false --skip_upload_screenshots false
  ```
  Yani metin + görseller (icon, feature graphic) + ekran görüntüleri gider; build ve changelog atlanır.
  **ÖN KOŞUL:** app Play Console'da elle oluşturulmuş + en az bir build yüklenmiş olmalı (bkz. Mod C
  submit notu). Appfile tabanlı `Fastfile` kullanıyorsan `upload_to_play_store` de aynı işi yapar.
- Yetki: Play service account'a Play Console'da **"Edit store listing"** verilmiş olmalı.
- Anahtar CI'da `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` değişkeninden gelir; yerelde Appfile
  `json_key_file` (genelde `ENV["SUPPLY_JSON_KEY"]`). Anahtarı **repoya KOYMA** (`.gitignore`/`private/`).
- Önce doğrula (yazmaz) → sonra metin-only gönder:
  `upload_to_play_store(validate_only:true, skip_upload_apk/aab/images/screenshots/changelogs:true)`.
- Canlıyı indir: `fastlane supply init -j <key.json> -p <package>`.

### Bilinen metadata hataları → çözüm
| Belirti | Kök neden | Çözüm |
|---|---|---|
| `Cannot create localization after the app version has been submitted for review` | iOS: sürüm review'da → yeni dilin version-level alanları (description/keywords) oluşturulamaz | Sürümü incelemeden çıkar ya da onay/red bekle, sonra tekrar `eas metadata:push` |
| `You must provide a value for the attribute 'description'/'keywords'/'supportUrl'` | Yeni iOS dilinde zorunlu alan eksik (ör. `pull` boş getirmiş) | İlgili dile description/keywords/supportUrl ekle, tekrar push |
| Fastlane supply `403 / does not have permission` | Service account'ta "Edit store listing" yetkisi yok | Play Console → Users & permissions → yetki ver |
| Yeni Play dili yayınlanmıyor / görsel istiyor | Play, yeni dil listelemesi için görsel/ekran görüntüsü ister | O dile görsel ekle ya da yalnızca mevcut dilleri güncelle |

YAML/job değişince Mod B sonundaki `ruby -ryaml ...` ile doğrula. Değerleri (profil adı, paket,
sır adları) Adım 0 + `.claude/store-deploy.context.md`'den al, hardcode varsayma.

---

## Mod E — Sıfırdan CI/CD Kur (yeni proje)

Projede henüz pipeline yoksa bu skill'in `templates/` klasöründen kur:
- `templates/.gitlab-ci.yml` → repo köküne `.gitlab-ci.yml` (içindeki `{{BUNDLE_ID}}` ve
  `{{APP_NAME}}`'i doldur, `default.tags`'i macOS runner tag'inle değiştir).
- `templates/store-deploy.context.md` → repo kökünde `.claude/store-deploy.context.md`
  (skill klasörünün İÇİNDE değil; `<...>`/`{{...}}` alanlarını doldur).

Ardından **CI/CD değişkenlerini** ekle (GitLab → Settings → CI/CD → Variables, "Masked" +
"Protected"). Submit/metadata job'ları bunları `private/`'a açıp runtime'da eas.json'a enjekte eder
(bkz. Mod C/D):

| Değişken | Ne | Nereden |
|---|---|---|
| `EXPO_TOKEN` | EAS erişim token'ı (build) | expo.dev → Account → Access tokens |
| `ASC_KEY_BASE64` | App Store Connect `.p8` anahtarı, **base64** | ASC → Users and Access → Integrations → Keys |
| `ASC_KEY_ID` | ASC API Key ID (10 karakter) | aynı sayfa |
| `ASC_ISSUER_ID` | ASC API Issuer ID (UUID) | aynı sayfa |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play service account JSON (**base64 ya da düz JSON**) | Google Cloud → service account key |

> `ASC_KEY_BASE64` daima base64'tür; `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` her iki biçimde de olabilir
> (job ilk karakter `{` testiyle ayırır). `.p8`/JSON gizli anahtarları **repoya koyma** — yalnızca CI
> değişkeni. `EXPO_ASC_*` env eas-cli submit tarafından **okunmaz**; kimlik mutlaka eas.json'a enjekte
> edilmeli.

Bu yapı `wappa-games-template` orkestratörünün Adım 7'siyle uyumludur; mağaza listeleme
metni/görselleri için **store-assets** skill'ine bak.

---

## Davranış Kuralları

- Kullanıcının diliyle yanıt ver. Projeye özgü her değeri **Adım 0**'dan al, hardcode varsayma.
- `git push`, `git tag`, `eas submit`, `eas metadata:push`, `fastlane supply` gibi dışa
  dönük/canlıyı değiştiren işlemleri onaysız yapma.
- Keychain durumu için kullanıcının terminal çıktısına güven; Bash ile `security` çalıştırıp sonuç çıkarma.
- Düzeltmeden sonra CI YAML'ını doğrula ve tag atma adımını hatırlat.
