/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
