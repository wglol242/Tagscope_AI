module.exports = {
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(axios)/)', // Include Axios for transformation
    ],
    testEnvironment: 'jsdom', // For React testing
  };
  