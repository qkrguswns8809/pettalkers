// babel.config.js (또는 babel 설정 파일)
module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        ['module:react-native-dotenv', {
          "moduleName": "@env",
          "path": ".env",
        }]
      ]
    };
  };