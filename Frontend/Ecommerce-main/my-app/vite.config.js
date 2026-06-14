import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    const normalizedId = id.replaceAll('\\', '/');

    if (!/\/src\/.*\.js$/.test(normalizedId)) {
      return null;
    }

    return transformWithOxc(code, id, {
      lang: 'jsx',
    });
  },
});

export default defineConfig({
  plugins: [transformJsxInJs(), react()],
  envPrefix: 'REACT_APP_',
  build: {
    outDir: 'build',
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react';
          }

          if (/[\\/]node_modules[\\/](@mui|@emotion|styled-components)[\\/]/.test(id)) {
            return 'vendor-ui';
          }

          if (/[\\/]node_modules[\\/]@fortawesome[\\/]/.test(id)) {
            return 'vendor-icons';
          }

          return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
