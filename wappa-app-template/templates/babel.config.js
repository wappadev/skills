module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54+) react-native-worklets/reanimated eklentisini
    // otomatik dahil eder. NativeWind için jsxImportSource + nativewind/babel gerekir.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
