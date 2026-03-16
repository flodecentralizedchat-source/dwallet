import { useWallet } from "../context/WalletContext";
import { TOKEN_PRICES, TOKEN_ICONS, DEFAULT_TOKENS } from "../data/chains";

export default function Dashboard({ onSend, onReceive, onSwap }) {
  const { chainBalances, totalUSDValue, activeChain, currentAddress, transactions } = useWallet();
  const tokens = DEFAULT_TOKENS[activeChain] || [];

  const recentTxs = transactions.slice(0, 4);

  return (
    <div className="dashboard">
      {/* Balance Card */}
      <div className="balance-card">
        <p className="balance-label">Total Balance</p>
        <h2 className="balance-amount">${totalUSDValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        <p className="balance-sub">Across all networks</p>
        <div className="balance-change positive">▲ 2.34% today</div>
      </div>

      {/* Action Buttons */}
      <div className="action-row">
        <button className="action-btn" onClick={onSend}>
          <span className="action-icon">↑</span>
          <span>Send</span>
        </button>
        <button className="action-btn" onClick={onReceive}>
          <span className="action-icon">↓</span>
          <span>Receive</span>
        </button>
        <button className="action-btn" onClick={onSwap}>
          <span className="action-icon">⇄</span>
          <span>Swap</span>
        </button>
        <button className="action-btn">
          <span className="action-icon">⊕</span>
          <span>Buy</span>
        </button>
      </div>

      {/* Token List */}
      <section className="section">
        <h3 className="section-title">Assets</h3>
        <div className="token-list">
          {tokens.map((token) => {
            const balance = chainBalances[token] || 0;
            const price = TOKEN_PRICES[token] || 1;
            const usdValue = balance * price;
            const icon = TOKEN_ICONS[token] || token[0];
            return (
              <div key={token} className="token-row">
                <div className="token-icon-wrap">{icon}</div>
                <div className="token-info">
                  <span className="token-name">{token}</span>
                  <span className="token-network">{activeChain}</span>
                </div>
                <div className="token-balance">
                  <span className="token-amount">{balance.toFixed(4)} {token}</span>
                  <span className="token-usd">${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="section">
        <h3 className="section-title">Recent Activity</h3>
        {recentTxs.length === 0 ? (
          <p className="empty-state">No transactions yet</p>
        ) : (
          <div className="tx-mini-list">
            {recentTxs.map((tx) => (
              <div key={tx.hash} className="tx-mini-row">
                <div className={`tx-type-badge tx-type--${tx.type}`}>
                  {tx.type === "send" ? "↑" : tx.type === "receive" ? "↓" : "⇄"}
                </div>
                <div className="tx-mini-info">
                  <span className="tx-mini-label">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.token}</span>
                  <span className="tx-mini-date">{new Date(tx.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="tx-mini-amount">
                  <span className={tx.type === "receive" ? "positive" : ""}>{tx.type === "receive" ? "+" : "-"}{tx.amount} {tx.token}</span>
                  <span className={`tx-status tx-status--${tx.status}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
