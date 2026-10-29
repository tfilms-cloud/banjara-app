// Resolve aliases through the same TypeScript compiler used by the app. The
// default resolver fails on this Windows workspace's parenthesized directory.
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const cache = ts.createModuleResolutionCache(root, (name) => name, parsed.options);
module.exports = {
  interfaceVersion: 2,
  resolve(source, file) {
    const result = ts.resolveModuleName(source, file, parsed.options, ts.sys, cache).resolvedModule;
    return result ? { found: true, path: result.resolvedFileName } : { found: false };
  },
};
