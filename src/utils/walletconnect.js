export async function initWalletConnect() { return null; }
export function getWeb3Wallet() { return null; }
export function isWCInitialized() { return false; }
export async function pairWithDapp() { throw new Error("WalletConnect not installed"); }
export async function approveSession() { throw new Error("WalletConnect not installed"); }
export async function rejectSession() {}
export async function disconnectSession() {}
export async function respondToRequest() {}
export async function signMessage(message, privateKey) {
  const { ethers } = await import("ethers");
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signMessage(message.startsWith("0x") ? ethers.getBytes(message) : message);
}
export async function signTransaction(txParams, privateKey, provider) {
  const { ethers } = await import("ethers");
  return new ethers.Wallet(privateKey, provider).signTransaction(txParams);
}
export function toCaip10(chainId, address) { return `eip155:${chainId}:${address}`; }
export const CHAIN_IDS = { ethereum: 1, bnb: 56, polygon: 137 };
export function getActiveSessions() { return {}; }
