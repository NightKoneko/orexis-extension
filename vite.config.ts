import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

const entryPoint = process.env.ENTRY || 'content'

const entryFiles: Record<string, string> = {
  content: resolve(__dirname, 'src/content.tsx'),
  background: resolve(__dirname, 'src/background.ts'),
  injector: resolve(__dirname, 'src/injector.ts'),
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        if (entryPoint === 'content') {
          const distDir = resolve(__dirname, 'dist')
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true })
          }
          copyFileSync(
            resolve(__dirname, 'manifest.json'),
            resolve(distDir, 'manifest.json')
          )
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: entryPoint === 'content',
    rollupOptions: {
      input: entryFiles[entryPoint],
      output: {
        entryFileNames: `${entryPoint}.js`,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'iife',
        name: `Orexis${entryPoint.charAt(0).toUpperCase() + entryPoint.slice(1)}`,
      },
    },
    minify: false,
    sourcemap: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
