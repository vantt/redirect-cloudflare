import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use default node environment since we're importing Miniflare directly in tests
  },
})
