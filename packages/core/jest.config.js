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
      },
    }],
  },
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^@luna/core$': '<rootDir>/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
}
