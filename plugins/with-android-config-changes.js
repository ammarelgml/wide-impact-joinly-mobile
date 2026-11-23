// Keeps the Android activity alive when the user changes font size, display size or language.
//
// Expo's default MainActivity handles orientation and dark mode itself, but not these. Android then
// destroys and recreates the activity, and after that expo-router's imperative router never becomes
// ready, so the next navigation crashed the app ("The imperative router is unavailable before the
// first render has finished"). Handling the changes in place avoids the recreation; React Native
// still receives the new configuration and re-lays out text at the new scale.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const EXTRA = ['fontScale', 'density', 'locale', 'layoutDirection', 'smallestScreenSize'];

module.exports = function withAndroidConfigChanges(config) {
  return withAndroidManifest(config, (mod) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(mod.modResults);
    const current = (activity.$['android:configChanges'] ?? '').split('|').filter(Boolean);
    activity.$['android:configChanges'] = [...new Set([...current, ...EXTRA])].join('|');
    return mod;
  });
};
