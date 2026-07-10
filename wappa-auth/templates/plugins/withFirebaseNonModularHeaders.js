const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// react-native-firebase's ObjC headers (RCTConvert+FIRApp.h, RNFBAppModule.h, ...)
// import React headers non-modularly (`#import <React/RCTConvert.h>`). With
// `ios.useFrameworks: "static"`, every pod is built as a framework module and clang
// promotes -Wnon-modular-include-in-framework-module to an error, breaking the build:
//
//   include of non-modular header inside framework module 'RNFBApp.*'
//     [-Werror,-Wnon-modular-include-in-framework-module]
//
// Allowing non-modular includes for the Pods project is the standard fix. ios/ is
// regenerated on every prebuild, so this must be a config plugin (a hand-edited Podfile
// gets wiped) — mirrors ./withKotlinSkipMetadataCheck for Android.
const MARKER = "[withFirebaseNonModularHeaders]";
const SNIPPET = `
    # ${MARKER} Allow react-native-firebase's non-modular React header imports under
    # static frameworks (avoids -Wnon-modular-include-in-framework-module -Werror).
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        # @react-native-firebase/messaging exposes React types (RCTPromiseRejectBlock)
        # in its public category header (RNFBMessaging+AppDelegate.h). Built as a clang
        # module under static frameworks this errors:
        #   "RCTPromiseRejectBlock must be imported from module 'RNFBApp.RNFBAppModule'"
        #   "unknown type name 'RCT_EXTERN'"
        # RNFB uses no @import (only textual #import <React/...>), so compiling its own
        # pods with modules OFF is safe and fixes messaging. DEFINES_MODULE stays YES so
        # consumers can still @import the pod.
        if target.name.start_with?('RNFB')
          bc.build_settings['CLANG_ENABLE_MODULES'] = 'NO'
        end
      end
    end
`;

module.exports = (config) =>
  withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      if (contents.includes(MARKER)) {
        return cfg; // idempotent
      }

      const anchor = "post_install do |installer|\n";
      if (!contents.includes(anchor)) {
        throw new Error(
          "withFirebaseNonModularHeaders: could not find post_install block in Podfile"
        );
      }
      contents = contents.replace(anchor, anchor + SNIPPET);
      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
