const fs = require('fs');
const path = require('path');

// Windows: Metro can exhaust OS file handles (EMFILE) while bundling.
// graceful-fs protects callback-based filesystem operations used by the watcher.
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  require('graceful-fs').gracefulify(fs);
} catch {
  // optional dependency
}

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { limitCacheStores } = require('./scripts/metro-cache.cjs');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Keep watching scoped to this app only (sibling folders like admin/backend stay out).
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Windows EMFILE: fewer Metro workers + narrower watch surface.
config.maxWorkers = Math.min(2, require('os').cpus().length || 2);
if (process.platform === 'win32') {
  // Expo SDK 57's BinaryFileStore uses fs.promises, which graceful-fs does not
  // patch. Metro's dependency graph can otherwise issue thousands of cache opens.
  config.cacheStores = limitCacheStores(config.cacheStores);
}
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList) ? existingBlockList : existingBlockList ? [existingBlockList] : []),
  // Exported bundles/assets are generated artifacts, not application source.
  /(?:^|[\\/])\.expo[\\/](?:location-picker(?:-android)?-verification|location-ui-check|smoke-android)(?:[\\/]|$)/,
];
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
  },
  additionalExts: config.watcher?.additionalExts,
};

module.exports = withNativeWind(config, { input: './global.css' });
