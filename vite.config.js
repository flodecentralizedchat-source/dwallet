import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      // Polyfill Node built-ins that WalletConnect needs in the browser
      stream: 'node:stream',
      util:   'node:util',
      buffer: 'node:buffer',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom'],
          'vendor-ethers':  ['ethers'],
          'vendor-scure':   ['@scure/bip39', '@scure/bip32', '@noble/hashes'],
          'vendor-uniswap': ['@uniswap/v3-sdk', '@uniswap/sdk-core'],
          'vendor-wc':      ['@walletconnect/web3wallet', '@walletconnect/core', '@walletconnect/utils'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
})
