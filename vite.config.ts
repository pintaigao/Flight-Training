import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, './src/styles')],
        additionalData: (content: string, filename: string) => {
          if (filename.endsWith('/src/styles/token.scss')) return content;
          return `@use "token" as *;\n\n${content}`;
        },
      },
    },
  },
  server: {
    port: 5173,
    // proxy: {
    //   // Frontend used to talk to `/api/v1/*` through the Vite proxy.
    //   '/api/v1': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //     rewrite: (p) => p.replace(/^\/api\/v1/, ''),
    //   },
    //   '/graphql': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   },
    // },
  },
});
