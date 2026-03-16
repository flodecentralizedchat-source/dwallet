import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { DEFAULT_TOKENS, TOKEN_PRICES } from "../data/chains";
import { isValidAddress } from "../utils/crypto";

export default function SendModal({ onClose }) {
  const { sendTransaction, chainBalances, activeChain } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(DEFAULT_TOKENS[activeChain]?.[0] || "ETH");
  const [step, setStep] = useState("form"); // form | confirm | success
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const tokens = DEFAULT_TOKENS[activeChain] || [];
  const balance = chainBalances[token] || 0;
  const price = TOKEN_PRICES[token] || 1;
  const usdValue = parseFloat(amount || 0) * price;
  const gasEstimate = 0.0021;

  const validate = () => {
    if (!isValidAddress(recipient) && recipient.length !== 44) {
      setError("Invalid recipient address");
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return false;
    }
    if (parseFloat(amount) > balance) {
      setError("Insufficient balance");
      return false;
    }
    return true;
  };

  const handleReview = () => {
    setError("");
    if (validate()) setStep("confirm");
  };

  const handleSend = () => {
    const tx = sendTransaction(recipient, amount, token);
    setTxHash(tx.hash);
    setStep("success");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Send</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === "form" && (
          <div className="modal-body">
            {/* Token selector */}
            <div className="form-group">
              <label className="form-label">Token</label>
              <select className="field" value={token} onChange={(e) => setToken(e.target.value)}>
                {tokens.map((t) => (
                  <option key={t} value={t}>{t} — Balance: {(chainBalances[t] || 0).toFixed(4)}</option>
                ))}
              </select>
            </div>

            {/* Recipient */}
            <div className="form-group">
              <label className="form-label">Recipient Address</label>
              <input
                className="field"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount</label>
              <div className="amount-input-row">
                <input
                  className="field"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                />
                <button className="max-btn" onClick={() => setAmount(balance.toFixed(6))}>MAX</button>
              </div>
              <p className="field-hint">≈ ${usdValue.toFixed(2)} · Balance: {balance.toFixed(4)} {token}</p>
            </div>

            {/* Gas estimate */}
            <div className="gas-row">
              <span className="gas-label">⛽ Estimated gas</span>
              <span className="gas-value">~{gasEstimate} ETH (${(gasEstimate * 3200).toFixed(2)})</span>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary full-width" onClick={handleReview}>
              Review Transaction →
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="modal-body">
            <div className="confirm-card">
              <p className="confirm-label">Sending</p>
              <p className="confirm-amount">{amount} {token}</p>
              <p className="confirm-usd">≈ ${usdValue.toFixed(2)}</p>
            </div>
            <div className="confirm-detail">
              <div className="confirm-row">
                <span>To</span>
                <span className="mono">{recipient.slice(0, 10)}...{recipient.slice(-6)}</span>
              </div>
              <div className="confirm-row">
                <span>Network</span>
                <span>{activeChain}</span>
              </div>
              <div className="confirm-row">
                <span>Gas fee</span>
                <span>~{gasEstimate} ETH</span>
              </div>
            </div>
            <div className="confirm-warning">
              ⚠️ Transactions are irreversible. Double-check the address.
            </div>
            <div className="btn-row">
              <button className="btn-secondary" onClick={() => setStep("form")}>Edit</button>
              <button className="btn-primary" onClick={handleSend}>Confirm Send</button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="modal-body center">
            <div className="success-icon">✓</div>
            <h3 className="success-title">Transaction Sent!</h3>
            <p className="success-sub">Your transaction is being processed</p>
            <div className="tx-hash-box">
              <span className="tx-hash-label">Tx Hash</span>
              <span className="tx-hash-value mono">{txHash.slice(0, 20)}...</span>
            </div>
            <button className="btn-primary full-width" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
