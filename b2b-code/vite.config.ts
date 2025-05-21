import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.API_URL || 'http://localhost:3001';

  return {
    root: process.cwd(),
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        input: path.resolve(process.cwd(), 'index.html'),
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'utils-vendor': ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
    resolve: {
      alias: {
        'node-fetch': 'isomorphic-fetch',
      },
    },
    base: '/',
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    preview: {
      port: 3000
    },
  };
});
