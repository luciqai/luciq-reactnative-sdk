module.exports = {
  dependency: {
    platforms: {
      ios: {
        scriptPhases: [
          {
            name: '[@luciq/react-native] Upload Sourcemap',
            path: './ios/sourcemaps.sh',
            execution_position: 'after_compile',
          },
        ],
      },
      android: {},
    },
  },
};
