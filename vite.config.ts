/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site from /<repo>/. Set BASE_PATH=/ when a custom domain is used.
const base = process.env.BASE_PATH ?? '/called/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'react-vendor';
          if (id.includes('/src/data/careers/')) return 'career-data';
          if (id.includes('/src/data/simulations/')) return 'simulation-data';
          if (id.includes('/src/data/research')) return 'research-data';
          if (id.includes('/src/data/scripture/') || id.includes('/src/data/purpose-')) return 'purpose-data';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.js'],
  },
});
