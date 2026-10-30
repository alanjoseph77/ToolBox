const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// pdf-lib depends on tslib. With package "exports" enabled, tslib's wrapper module breaks under Metro
// ("Cannot destructure property '__extends'"), so point it at the plain ES module build instead.
const resolveWithDefaults = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return { type: "sourceFile", filePath: path.resolve(__dirname, "node_modules/tslib/tslib.es6.js") };
  }
  return (resolveWithDefaults ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
