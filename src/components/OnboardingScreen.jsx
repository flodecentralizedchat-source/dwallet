import { useState } from "react";
import { useWallet } from "../context/WalletContext";

export default function OnboardingScreen() {
  const { createWallet, importWallet, unlockWallet, isLocked } = useWallet();
  const [step, setStep] = useState(isLocked ? "unlock" : "welcome");
  const [mnemonic, setMnemonic] = useState("");
  const [newMnemonic, setNewMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importInput, setImportInput] = useState("");

  const handleCreate = async () => {
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    setError("");
    try {
      const phrase = await createWallet(password);
      setNewMnemonic(phrase);
      setStep("backup");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    setError("");
    try {
      await importWallet(importInput, password);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleUnlock = async () => {
    setLoading(true);
    setError("");
    try {
      unlockWallet(password);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {/* Logo */}
        <div className="logo-area">
          <div className="logo-icon">◈</div>
          <h1 className="logo-title">dWallet</h1>
          <p className="logo-sub">Your keys. Your crypto. Your freedom.</p>
        </div>

        {/* Welcome */}
        {step === "welcome" && (
          <div className="step-content">
            <button className="btn-primary" onClick={() => setStep("create")}>
              Create New Wallet
            </button>
            <button className="btn-secondary" onClick={() => setStep("import")}>
              Import Existing Wallet
            </button>
          </div>
        )}

        {/* Unlock */}
        {step === "unlock" && (
          <div className="step-content">
            <h2 className="step-title">Welcome back</h2>
            <p className="step-sub">Enter your password to unlock</p>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              className="field"
            />
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" onClick={handleUnlock} disabled={loading}>
              {loading ? "Unlocking..." : "Unlock Wallet"}
            </button>
          </div>
        )}

        {/* Create */}
        {step === "create" && (
          <div className="step-content">
            <h2 className="step-title">Create Wallet</h2>
            <p className="step-sub">Set a strong password to protect your wallet</p>
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
            />
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Wallet"}
            </button>
            <button className="btn-link" onClick={() => setStep("welcome")}>← Back</button>
          </div>
        )}

        {/* Backup seed phrase */}
        {step === "backup" && (
          <div className="step-content">
            <h2 className="step-title">Back up your seed phrase</h2>
            <p className="step-sub warning-text">
              ⚠️ Write these 12 words down and store them safely. Anyone with this phrase can access your wallet.
            </p>
            <div className="seed-grid">
              {newMnemonic.split(" ").map((word, i) => (
                <div key={i} className="seed-word">
                  <span className="seed-num">{i + 1}</span>
                  <span className="seed-text">{word}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setStep("verify")}>
              I've written it down →
            </button>
          </div>
        )}

        {/* Verify */}
        {step === "verify" && (
          <div className="step-content">
            <h2 className="step-title">Verify seed phrase</h2>
            <p className="step-sub">Enter your seed phrase to confirm you've saved it</p>
            <textarea
              className="field textarea"
              placeholder="Enter all 12 words separated by spaces..."
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              rows={3}
            />
            {error && <p className="error-msg">{error}</p>}
            <button
              className="btn-primary"
              onClick={() => {
                if (mnemonic.trim() === newMnemonic) {
                  setError("");
                  // Wallet is already created, just close onboarding
                  window.location.reload();
                } else {
                  setError("Seed phrase doesn't match. Please try again.");
                }
              }}
            >
              Confirm & Enter Wallet
            </button>
            <button className="btn-link" onClick={() => setStep("backup")}>← Back</button>
          </div>
        )}

        {/* Import */}
        {step === "import" && (
          <div className="step-content">
            <h2 className="step-title">Import Wallet</h2>
            <p className="step-sub">Enter your 12 or 24 word seed phrase</p>
            <textarea
              className="field textarea"
              placeholder="word1 word2 word3 ... word12"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              rows={3}
            />
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
            />
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" onClick={handleImport} disabled={loading}>
              {loading ? "Importing..." : "Import Wallet"}
            </button>
            <button className="btn-link" onClick={() => setStep("welcome")}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
