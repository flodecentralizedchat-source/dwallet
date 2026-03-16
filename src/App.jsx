import { WalletProvider, useWallet } from "./context/WalletContext";
import { WalletConnectProvider } from "./context/WalletConnectContext";
import { SessionProposalModal, SessionRequestModal } from "./components/WalletConnectModal";
import OnboardingScreen from "./components/OnboardingScreen";
import MainWallet from "./components/MainWallet";
import "./index.css";

// Inner component has access to wallet context
function AppContent() {
  const { wallet } = useWallet();
  return (
    <>
      {wallet ? <MainWallet /> : <OnboardingScreen />}
      {/* Global WalletConnect modals — rendered on top of everything */}
      <SessionProposalModal />
      <SessionRequestModal />
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <WalletConnectProvider>
        <AppContent />
      </WalletConnectProvider>
    </WalletProvider>
  );
}
