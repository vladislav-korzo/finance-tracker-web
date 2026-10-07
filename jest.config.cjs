/** @type {import('jest').Config} */
module.exports = {
  watchman: false,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.app.json',
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
};
