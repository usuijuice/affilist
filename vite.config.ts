import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html in dist folder
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],

          // Admin chunks (lazy loaded)
          admin: [
            './src/components/AdminDashboard.tsx',
            './src/components/AdminLayout.tsx',
            './src/components/LinkForm.tsx',
            './src/components/LinkManagementTable.tsx',
          ],

          // Analytics chunks (lazy loaded)
          analytics: [
            './src/components/AnalyticsDashboard.tsx',
            './src/components/AnalyticsChart.tsx',
            './src/components/MetricsSummary.tsx',
            './src/components/PerformanceTable.tsx',
          ],

          // Auth chunks
          auth: [
            './src/components/Login.tsx',
            './src/components/ProtectedRoute.tsx',
            './src/components/AdminRoute.tsx',
          ],
        },

        // Optimize asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];

          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }

          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },

        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Optimize chunks
    chunkSizeWarningLimit: 1000,

    // Enable source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'development',

    // Minification options
    minify: 'terser',

    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },

  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },

  // Server configuration for development
  server: {
    // Preload modules
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/HomePage.tsx',
      ],
    },
  },
});
