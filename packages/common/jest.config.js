/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strictNullChecks: true,
        target: 'ES2019',
        module: 'commonjs',
        types: ['node', 'jest', 'reflect-metadata'],
      },
    }],
  },
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^@lunafw/core$': '<rootDir>/../core/src/index.ts',
    '^@lunafw/common$': '<rootDir>/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
}

