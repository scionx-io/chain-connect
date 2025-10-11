import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'global': {},
  },
  assetsInclude: ['**/*.svg'],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'ChainConnect',
      fileName: (format) => `chain-connect.${format}.js`,
    },
    rollupOptions: {
      external: [
        '@hotwired/stimulus',
        'mipd',
        '@solana/web3.js',
        '@tronweb3/tronwallet-adapters',
        'ethers'
      ],
      output: {
        globals: {
          '@hotwired/stimulus': 'Stimulus',
          'mipd': 'mipd',
          '@solana/web3.js': 'web3',
          '@tronweb3/tronwallet-adapters': 'tronwalletAdapters',
          'ethers': 'ethers'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'chain-connect.css';
          }
          return assetInfo.name;
        }
      },
    },
    cssCodeSplit: false,  // Prevents CSS from being split into separate chunks
  },
});
