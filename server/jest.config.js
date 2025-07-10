module.exports = {
  testEnvironment: 'node',        // Node.js environment for backend
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], 
  testMatch: ['<rootDir>/tests/**/*.test.js'], // Test file pattern
  collectCoverage: true,          // Enable coverage collection
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage', // Output dir
  verbose: true,                  // Detailed test results
};
