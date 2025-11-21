import { defineConfig } from 'vitest/config';

// GitHub Pagesではリポジトリ名のサブパスで配信されるためbaseを差し替える。
// TypeScriptコンパイラを丸ごと抱えるため、チャンクサイズ警告の閾値も広げている。
export default defineConfig({
  base: process.env.TYPEDOJO_BASE ?? '/',
  build: {
    chunkSizeWarningLimit: 9000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
