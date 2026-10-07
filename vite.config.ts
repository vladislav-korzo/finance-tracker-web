import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed dev port and its own logs left intact.
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
