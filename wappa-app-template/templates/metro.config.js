// Metro + NativeWind. `global.css` Tailwind katmanlarını içerir; withNativeWind
// bunu derleme hattına bağlar. Expo Router için ek yapılandırma gerekmez.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
