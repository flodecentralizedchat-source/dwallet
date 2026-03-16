import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { formatAddress } from "../utils/crypto";
import { TOKEN_PRICES } from "../data/chains";

export default function TransactionHistory() {
  const { transactions, currentAddress } = useWallet();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.type === filter;
  });

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 className="view-title">Activity</h2>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {["all", "send", "receive", "swap"].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "filter-tab--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="tx-list">
        {filtered.length === 0 ? (
          <div className="empty-state-big">
            <p>No transactions found</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const price = TOKEN_PRICES[tx.token] || 1;
            const usd = (parseFloat(tx.amount) * price).toFixed(2);
            const isSelected = selected?.hash === tx.hash;
            return (
              <div key={tx.hash} className="tx-item">
                <div className="tx-row" onClick={() => setSelected(isSelected ? null : tx)}>
                  <div className={`tx-icon tx-icon--${tx.type}`}>
                    {tx.type === "send" ? "↑" : tx.type === "receive" ? "↓" : "⇄"}
                  </div>
                  <div className="tx-details">
                    <span className="tx-type">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                    <span className="tx-date">{formatDate(tx.timestamp)}</span>
                  </div>
                  <div className="tx-amounts">
                    <span className={`tx-amount ${tx.type === "receive" ? "positive" : ""}`}>
                      {tx.type === "receive" ? "+" : "-"}{tx.amount} {tx.token}
                    </span>
                    <span className="tx-usd">${usd}</span>
                  </div>
                  <span className={`tx-status-badge tx-status-badge--${tx.status}`}>{tx.status}</span>
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <div className="tx-expanded">
                    <div className="tx-exp-row">
                      <span>Hash</span>
                      <span className="mono small">{tx.hash.slice(0, 18)}...</span>
                    </div>
                    <div className="tx-exp-row">
                      <span>From</span>
                      <span className="mono small">{formatAddress(tx.from)}</span>
                    </div>
                    <div className="tx-exp-row">
                      <span>To</span>
                      <span className="mono small">{formatAddress(tx.to)}</span>
                    </div>
                    <div className="tx-exp-row">
                      <span>Gas used</span>
                      <span>{tx.gasUsed} ETH</span>
                    </div>
                    <div className="tx-exp-row">
                      <span>Network</span>
                      <span>{tx.chain}</span>
                    </div>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="view-explorer"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
