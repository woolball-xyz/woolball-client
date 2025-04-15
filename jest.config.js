module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],  // 
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e-tests/', '<rootDir>/src/__tests__/mocks/worker-mock.ts', '<rootDir>/dist/__tests__/mocks/worker-mock.d.ts'],
};