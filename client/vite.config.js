import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Set jsdom as the test environment
    globals: true,        // Enable global test functions like describe, it, expect
    setupFiles: './src/setupTests.js', // Optional: Add a setup file for global configurations
  },
});
