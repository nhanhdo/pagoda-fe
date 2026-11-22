import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from './vercel.json';

const productionHeaders = Object.fromEntries(
  vercel.headers[0].headers.map(({ key, value }) => [key, value]),
);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: productionHeaders,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd':   ['antd', '@ant-design/icons', '@ant-design/cssinjs'],
          'vendor-utils':  ['dayjs', 'axios'],
        },
      },
    },
  },
});
