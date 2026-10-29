// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", ".expo/**"],
  },
  {
    // Windows paths are case-insensitive; avoid walking protected parent folders.
    rules: { 'import/no-unresolved': ['error', { caseSensitive: false }] },
    settings: {
      'import/resolver': {
        [require.resolve('./scripts/eslint-resolver.cjs')]: {},
      },
    },
  }
]);
