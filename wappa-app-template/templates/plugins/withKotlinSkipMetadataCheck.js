const { withProjectBuildGradle } = require("expo/config-plugins");

// play-services-ads 25.4.0 (pulled by react-native-google-mobile-ads) is compiled
// with Kotlin 2.3 metadata, but the RN/Expo toolchain's Kotlin compiler is 2.1.x.
// Bumping `android.kotlinVersion` does NOT change the compiler in this toolchain, so
// instead we let the 2.1 compiler read the newer metadata. android/ is regenerated on
// every prebuild, so this must be applied as a config plugin (editing build.gradle by
// hand gets wiped).
const SNIPPET = `
// [withKotlinSkipMetadataCheck] Allow the Kotlin compiler to consume dependencies built
// with a newer Kotlin metadata version (e.g. play-services-ads 25.4.0 -> Kotlin 2.3).
allprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += ["-Xskip-metadata-version-check"]
    }
  }
}
`;

module.exports = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        "withKotlinSkipMetadataCheck: android/build.gradle is not groovy"
      );
    }
    if (!cfg.modResults.contents.includes("-Xskip-metadata-version-check")) {
      cfg.modResults.contents += SNIPPET; // idempotent
    }
    return cfg;
  });
