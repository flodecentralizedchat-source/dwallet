// Browser polyfills required by WalletConnect and ethers.js
import { Buffer } from 'buffer'

if (typeof window !== 'undefined') {
  window.global = window.global ?? window
  window.Buffer = window.Buffer ?? Buffer
  window.process = window.process ?? { env: {}, version: '', browser: true }
}
