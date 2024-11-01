import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Shared server configuration
const serverConfig = {
  port: 8082,
  strictPort: true,
  host: '0.0.0.0',
  fs: {
    strict: false,
    allow: ['..']
  },
  cors: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  },
  watch: {
    usePolling: true,
    interval: 100
  }
};

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  server: {
    ...serverConfig,
    hmr: {
      protocol: 'ws',
      host: '0.0.0.0',
      port: 8082,
      clientPort: 8082,
      timeout: 120000,
      overlay: false
    }
  },
  preview: {
    ...serverConfig
  },
  build: {
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ]
  }
});
