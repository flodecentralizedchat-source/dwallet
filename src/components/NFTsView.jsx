import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { MOCK_NFTS } from "../data/chains";

export default function NFTsView() {
  const { activeChain } = useWallet();
  const [selected, setSelected] = useState(null);

  const nfts = MOCK_NFTS.filter(
    (nft) => nft.chain === activeChain || activeChain === "ethereum"
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 className="view-title">NFTs</h2>
        <span className="view-count">{nfts.length} items</span>
      </div>

      {nfts.length === 0 ? (
        <div className="empty-state-big">
          <p className="empty-icon">◇</p>
          <p>No NFTs found on {activeChain}</p>
        </div>
      ) : (
        <div className="nft-grid">
          {nfts.map((nft) => (
            <div key={nft.id} className="nft-card" onClick={() => setSelected(nft)}>
              <div className="nft-image">{nft.image}</div>
              <div className="nft-info">
                <p className="nft-name">{nft.name}</p>
                <p className="nft-collection">{nft.collection}</p>
                <p className="nft-floor">Floor: {nft.floor}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NFT Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selected.name}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body center">
              <div className="nft-detail-image">{selected.image}</div>
              <p className="nft-detail-collection">{selected.collection}</p>
              <div className="nft-detail-attrs">
                <div className="nft-attr">
                  <span className="attr-label">Chain</span>
                  <span className="attr-value">{selected.chain}</span>
                </div>
                <div className="nft-attr">
                  <span className="attr-label">Floor Price</span>
                  <span className="attr-value">{selected.floor}</span>
                </div>
                <div className="nft-attr">
                  <span className="attr-label">Standard</span>
                  <span className="attr-value">ERC-721</span>
                </div>
              </div>
              <div className="btn-row">
                <button className="btn-secondary">Transfer</button>
                <button className="btn-primary">View on OpenSea ↗</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
