import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build works whether it's served from the
  // domain root (public_html) or a subfolder on Hostinger.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
