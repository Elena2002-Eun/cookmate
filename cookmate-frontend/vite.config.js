// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Force Vite to always use port 5173
    strictPort: true, // don't auto-bump to 5174
  },
});