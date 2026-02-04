import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TypeScript error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env so the existing code works without changes
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.TURSO_DB_URL': JSON.stringify(env.TURSO_DB_URL),
      'process.env.TURSO_AUTH_TOKEN': JSON.stringify(env.TURSO_AUTH_TOKEN),
    },
  };
});