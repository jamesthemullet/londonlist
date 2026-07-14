/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.module\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '^leaflet/dist/leaflet\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '^leaflet$': '<rootDir>/__mocks__/leaflet.js',
    '^react-leaflet$': '<rootDir>/__mocks__/react-leaflet.js',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: ['components/**/*.{ts,tsx}', 'hooks/**/*.ts', 'context/**/*.tsx'],
};

export default config;
