import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'service/merge-update-tool.ts',
    target: 'node22',
    outDir: 'dist-tool-bundle',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: 'merge-update-tool.cjs',
        format: 'cjs',
        inlineDynamicImports: true,
      },
    },
  },
})
