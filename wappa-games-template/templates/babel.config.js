module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54+) artık react-native-worklets/reanimated
    // eklentisini otomatik olarak dahil ediyor; ayrıca eklemeye gerek yok.
    presets: ['babel-preset-expo'],
  };
};
