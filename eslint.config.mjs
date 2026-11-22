// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  expoConfig,
  {
    ignores: ['node_modules/*', '.expo/*', 'dist/*', 'android/*', 'ios/*', 'src/api/schema.gen.ts'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/no-cycle': 'error',
    },
  },
]);
