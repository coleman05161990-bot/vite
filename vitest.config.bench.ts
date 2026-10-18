import codspeedPlugin from '@codspeed/vitest-plugin'
import { defineConfig, mergeConfig } from 'vitest/config'
import config from './vitest.config'

export default mergeConfig(
  config,
  defineConfig({
    plugins: [codspeedPlugin()],
    test: {
      benchmark: {
        include: ['packages/**/__tests__/benchmarks/**/*.bench.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
      },
    },
  }),
)
