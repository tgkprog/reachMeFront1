module.exports = {
  // Keep metro preset for native apps; for web we rely on webpack aliases.
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    // Removed module-resolver to simplify web build; path aliases handled by webpack.
  ],
};
