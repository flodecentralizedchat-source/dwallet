import { createContext, useContext, useState, useEffect } from "react";
import { generateMnemonic, mnemonicToSeedSync } from "../utils/bip39";
import { deriveWalletFromSeed, encryptData, decryptData } from "../utils/crypto";
import { ethers } from "ethers";
import { CHAINS, DEFAULT_TOKENS, TOKEN_PRICES } from "../data/chains";

const WalletContext = createContext(null);

// ── RPC providers (replace YOUR_KEY with real Infura/Alchemy keys) ──────────
const RPC_URLS = {
  ethereum: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_KEY}`,
  bnb:      "https://bsc-dataseed.binance.org/",
  polygon:  "https://polygon-rpc.com/",
  solana:   null, // Solana uses a different SDK — mocked here
};

// ERC-20 minimal ABI for balanceOf
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Known ERC-20 token addresses on mainnet
const TOKEN_ADDRESSES = {
  ethereum: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI:  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    UNI:  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  },
  polygon: {
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  },
};

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [activeChain, setActiveChain] = useState("ethereum");
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dwallet_encrypted_v2");
    if (stored) setIsLocked(true);
  }, []);

  // ── Wallet Creation ────────────────────────────────────────────────────────
  const createWallet = async (pwd) => {
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    const derived = deriveWalletFromSeed(seed, 0);
    const walletData = {
      mnemonic,
      accounts: [{ name: "Account 1", address: derived.address, privateKey: derived.privateKey, index: 0 }],
      activeAccount: 0,
      createdAt: Date.now(),
    };
    const encrypted = await encryptData(JSON.stringify(walletData), pwd);
    localStorage.setItem("dwallet_encrypted_v2", encrypted);
    setPassword(pwd);
    setWallet(walletData);
    setIsLocked(false);
    fetchBalances(derived.address, "ethereum");
    generateMockTransactions(derived.address);
    return mnemonic;
  };

  // ── Import Wallet ──────────────────────────────────────────────────────────
  const importWallet = async (mnemonic, pwd) => {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      throw new Error("Invalid seed phrase. Must be 12 or 24 words.");
    }
    const seed = mnemonicToSeedSync(mnemonic.trim());
    const derived = deriveWalletFromSeed(seed, 0);
    const walletData = {
      mnemonic: mnemonic.trim(),
      accounts: [{ name: "Account 1", address: derived.address, privateKey: derived.privateKey, index: 0 }],
      activeAccount: 0,
      createdAt: Date.now(),
    };
    const encrypted = await encryptData(JSON.stringify(walletData), pwd);
    localStorage.setItem("dwallet_encrypted_v2", encrypted);
    setPassword(pwd);
    setWallet(walletData);
    setIsLocked(false);
    fetchBalances(derived.address, "ethereum");
    generateMockTransactions(derived.address);
  };

  // ── Unlock ─────────────────────────────────────────────────────────────────
  const unlockWallet = async (pwd) => {
    const stored = localStorage.getItem("dwallet_encrypted_v2");
    if (!stored) throw new Error("No wallet found");
    try {
      const decrypted = await decryptData(stored, pwd);
      const walletData = JSON.parse(decrypted);
      setPassword(pwd);
      setWallet(walletData);
      setIsLocked(false);
      const addr = walletData.accounts[walletData.activeAccount].address;
      fetchBalances(addr, "ethereum");
      generateMockTransactions(addr);
    } catch {
      throw new Error("Incorrect password");
    }
  };

  const lockWallet = () => {
    setWallet(null);
    setIsLocked(true);
    setPassword(null);
    setBalances({});
    setTransactions([]);
  };

  const resetWallet = () => {
    localStorage.removeItem("dwallet_encrypted_v2");
    setWallet(null);
    setIsLocked(false);
    setPassword(null);
    setBalances({});
    setTransactions([]);
  };

  // ── Real Balance Fetching via ethers.js + Infura ───────────────────────────
  const fetchBalances = async (address, chain) => {
    setLoadingBalances(true);
    const rpcUrl = RPC_URLS[chain];

    // If no RPC key configured or Solana, fall back to mock
    if (!rpcUrl || !import.meta.env.VITE_INFURA_KEY) {
      generateMockBalances(address);
      setLoadingBalances(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Native token balance
      const nativeBal = await provider.getBalance(address);
      const symbol = CHAINS[chain].symbol;
      const newBalances = {
        [`${chain}_${symbol}`]: parseFloat(ethers.formatEther(nativeBal)),
      };

      // ERC-20 token balances
      const tokenAddrs = TOKEN_ADDRESSES[chain] || {};
      await Promise.all(
        Object.entries(tokenAddrs).map(async ([token, tokenAddr]) => {
          try {
            const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
            const [bal, decimals] = await Promise.all([
              contract.balanceOf(address),
              contract.decimals(),
            ]);
            newBalances[`${chain}_${token}`] = parseFloat(
              ethers.formatUnits(bal, decimals)
            );
          } catch {
            newBalances[`${chain}_${token}`] = 0;
          }
        })
      );

      setBalances((prev) => ({ ...prev, ...newBalances }));
    } catch (err) {
      console.warn("RPC fetch failed, using mock balances:", err.message);
      generateMockBalances(address);
    } finally {
      setLoadingBalances(false);
    }
  };

  // ── Add / Switch Accounts ──────────────────────────────────────────────────
  const addAccount = async () => {
    if (!wallet || !password) return;
    const seed = mnemonicToSeedSync(wallet.mnemonic);
    const newIndex = wallet.accounts.length;
    const derived = deriveWalletFromSeed(seed, newIndex);
    const newAccount = { name: `Account ${newIndex + 1}`, address: derived.address, privateKey: derived.privateKey, index: newIndex };
    const updated = { ...wallet, accounts: [...wallet.accounts, newAccount], activeAccount: newIndex };
    const encrypted = await encryptData(JSON.stringify(updated), password);
    localStorage.setItem("dwallet_encrypted_v2", encrypted);
    setWallet(updated);
    fetchBalances(newAccount.address, activeChain);
  };

  const switchAccount = async (index) => {
    if (!wallet) return;
    const updated = { ...wallet, activeAccount: index };
    setWallet(updated);
    if (password) {
      const encrypted = await encryptData(JSON.stringify(updated), password);
      localStorage.setItem("dwallet_encrypted_v2", encrypted);
    }
    fetchBalances(wallet.accounts[index].address, activeChain);
    generateMockTransactions(wallet.accounts[index].address);
  };

  // ── Switch Chain → refresh balances ───────────────────────────────────────
  const handleSetActiveChain = (chain) => {
    setActiveChain(chain);
    if (wallet) {
      const addr = wallet.accounts[wallet.activeAccount].address;
      fetchBalances(addr, chain);
    }
  };

  // ── Send Transaction ───────────────────────────────────────────────────────
  const sendTransaction = (to, amount, token) => {
    const activeAcc = wallet.accounts[wallet.activeAccount];
    const newTx = {
      hash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,"0")).join(""),
      from: activeAcc.address,
      to,
      amount,
      token,
      chain: activeChain,
      type: "send",
      status: "pending",
      timestamp: Date.now(),
      gasUsed: (Math.random() * 0.005 + 0.001).toFixed(6),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) => tx.hash === newTx.hash ? { ...tx, status: "confirmed" } : tx)
      );
      setBalances((prev) => {
        const key = `${activeChain}_${token}`;
        return { ...prev, [key]: Math.max(0, (prev[key] || 0) - parseFloat(amount)) };
      });
    }, 3000);
    return newTx;
  };

  // ── Mock fallback (used when no Infura key is set) ─────────────────────────
  const generateMockBalances = (address) => {
    const seed = parseInt(address.slice(2, 10), 16);
    const rand = (min, max, s) => {
      const x = Math.sin(seed + s) * 10000;
      return parseFloat((min + (x - Math.floor(x)) * (max - min)).toFixed(4));
    };
    setBalances({
      ethereum_ETH:   rand(0.1, 5, 1),
      ethereum_USDC:  rand(50, 2000, 2),
      ethereum_USDT:  rand(20, 1500, 3),
      ethereum_DAI:   rand(10, 800, 4),
      bnb_BNB:        rand(0.5, 20, 5),
      bnb_CAKE:       rand(5, 200, 6),
      polygon_MATIC:  rand(10, 500, 7),
      polygon_USDC:   rand(10, 400, 8),
      solana_SOL:     rand(0.2, 15, 9),
    });
  };

  const generateMockTransactions = (address) => {
    const tokens = ["ETH", "USDC", "BNB", "MATIC", "SOL"];
    const types = ["send", "receive", "swap"];
    setTransactions(
      Array.from({ length: 12 }, (_, i) => ({
        hash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join(""),
        from: i % 2 === 0 ? address : "0x" + Math.random().toString(16).slice(2, 42),
        to:   i % 2 !== 0 ? address : "0x" + Math.random().toString(16).slice(2, 42),
        amount: (Math.random() * 10 + 0.01).toFixed(4),
        token: tokens[i % tokens.length],
        chain: ["ethereum", "bnb", "polygon"][i % 3],
        type: types[i % 3],
        status: i < 2 ? "pending" : "confirmed",
        timestamp: Date.now() - i * 86400000 * (Math.random() + 0.5),
        gasUsed: (Math.random() * 0.005 + 0.001).toFixed(6),
      }))
    );
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentAddress = wallet?.accounts?.[wallet?.activeAccount]?.address;
  const currentChain = CHAINS[activeChain];
  const chainBalances = Object.entries(balances)
    .filter(([key]) => key.startsWith(activeChain + "_"))
    .reduce((acc, [key, val]) => { acc[key.replace(activeChain + "_", "")] = val; return acc; }, {});

  const totalUSDValue = Object.entries(balances).reduce((sum, [key, amount]) => {
    const token = key.split("_")[1];
    return sum + (amount * (TOKEN_PRICES[token] || 1));
  }, 0);

  return (
    <WalletContext.Provider value={{
      wallet, isLocked, activeChain,
      setActiveChain: handleSetActiveChain,
      balances, chainBalances, transactions,
      currentAddress, currentChain, totalUSDValue,
      loadingBalances,
      createWallet, importWallet, unlockWallet,
      lockWallet, resetWallet, sendTransaction,
      addAccount, switchAccount, fetchBalances,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
