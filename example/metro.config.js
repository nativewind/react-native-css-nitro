const path = require("path");
const { getDefaultConfig } = require("@react-native/metro-config");
const { withMetroConfig } = require("react-native-monorepo-config");
const { withReactNativeCSS } = require("../lib/commonjs/metro");

const root = path.resolve(__dirname, "..");

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = withMetroConfig(
  withReactNativeCSS(getDefaultConfig(__dirname)),
  {
    root,
    dirname: __dirname,
  },
);
