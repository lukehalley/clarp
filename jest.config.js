/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        moduleResolution: 'bundler',
        module: 'ESNext',
        target: 'ES2020',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        jsx: 'react-jsx',
        baseUrl: '.',
        paths: {
          '@/*': ['./*'],
        },
      },
    }],
  },
};

module.exports = config;
