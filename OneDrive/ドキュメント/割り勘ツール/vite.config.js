import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
import { loadEnv } from 'vite'

// NOTE: If hosting under a sub-path on CloudFront/S3, set VITE_BASE_PATH accordingly in the environment.
// e.g. VITE_BASE_PATH=/subpath  ←★ AWSの配下パス未定の場合はここを決めて環境変数で指定してください
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      allowedHosts: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  }
})