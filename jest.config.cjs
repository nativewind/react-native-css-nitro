// eslint-disable-next-line no-undef
module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-reanimated|react-native-worklets|react-native-nitro-modules)/)",
  ],
  testPathIgnorePatterns: ["lib/", "example/", ".*/_[a-zA-Z]"],
};
