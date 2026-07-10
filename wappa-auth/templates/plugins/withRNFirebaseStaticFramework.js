const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// With `ios.useFrameworks: "static"` every pod is built as a framework module.
// react-native-firebase/messaging exposes React types (RCTPromiseRejectBlock, ...)
// in its *category headers* (RNFBMessaging+AppDelegate.h), and clang then refuses to
// compile the pod as a framework module:
//
//   declaration of 'RCTPromiseRejectBlock' must be imported from module
//     'RNFBApp.RNFBAppModule' before it is required
//   unknown type name 'RCT_EXTERN'  (React-Core headers parsed without their module)
//
// The react-native-firebase-supported fix under use_frameworks! is to build the RNFB
// pods as static *libraries* (not frameworks) by setting the global `$RNFirebaseAsStaticFramework`
// before the podspecs are evaluated. Combined with ./withFirebaseNonModularHeaders this
// lets app/auth/messaging all compile. ios/ is regenerated on every prebuild, so this
// must live in a config plugin — mirrors ./withFirebaseNonModularHeaders.
const MARKER = "[withRNFirebaseStaticFramework]";
const SNIPPET = `# ${MARKER} Build react-native-firebase pods as static libraries so their\n# category headers don't require modular React imports under static frameworks.\n$RNFirebaseAsStaticFramework = true\n`;

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

      // Define the global before any target/podspec is evaluated.
      contents = SNIPPET + contents;
      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
