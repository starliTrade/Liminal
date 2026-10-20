import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4000,
    // The preview is looked at through a tunnel, whose hostname is generated per
    // session and cannot be known in advance. Vite refuses unknown hosts by
    // default, which turned a working tunnel into a 403.
    allowedHosts: true,
  },
  test: {
    environment: 'node',
    include: ['rig/**/*.test.{ts,tsx}', 'engine/**/*.test.ts'],
  },
});
