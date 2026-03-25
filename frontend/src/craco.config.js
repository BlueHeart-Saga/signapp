module.exports = {
  webpack: {
    configure: (config) => {
      config.module.rules = config.module.rules.filter(
        rule => !rule.loader?.includes('source-map-loader')
      );
      return config;
    },
  },
};
