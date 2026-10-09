import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');
  const isDev = command === 'serve';
  const isVercel = Boolean(process.env.VERCEL);
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    base: isDev || isVercel ? '/' : '/elbuenservir/',
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
