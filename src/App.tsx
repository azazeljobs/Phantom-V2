/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Grid, 
  ArrowLeftRight, 
  Clock, 
  Globe, 
  Plus, 
  X,
  Copy,
  Share2,
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Settings,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  CheckCircle2,
  ArrowDown,
  History,
  List,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Tab = 'wallet' | 'nfts' | 'swap' | 'activity' | 'browser';

interface Token {
  id: string;
  name: string;
  symbol: string;
  initialBalance: number; // The "hardcoded" starting point
  price: number;
  change24h: number;
  icon: string;
}

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  description?: string;
  mintAddress?: string;
  tokenAddress?: string;
  attributes?: { trait_type: string; value: string | number }[];
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  amount: number;
  tokenSymbol: string;
  usdValue: number;
  status: 'confirmed' | 'pending';
  timestamp: number;
  address: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info';
}

// --- Constants ---

const INITIAL_TOKENS: Token[] = [
  { id: 'sol', name: 'Solana', symbol: 'SOL', initialBalance: 12.45, price: 145.20, change24h: 5.2, icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', initialBalance: 0.85, price: 3240.50, change24h: -1.4, icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', initialBalance: 0.042, price: 64200.00, change24h: 0.8, icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' },
  { id: 'usdc', name: 'USDC', symbol: 'USDC', initialBalance: 450.00, price: 1.00, change24h: 0.01, icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
];

const INITIAL_NFTS: NFT[] = [
  { 
    id: '1', 
    name: 'Mad Lad #420', 
    collection: 'Mad Lads', 
    image: 'https://picsum.photos/seed/madlad/800/800',
    description: 'The Mad Lads are a collection of 10,000 recursive NFTs on Solana.',
    mintAddress: 'MadL...420x',
    tokenAddress: 'Token...7y2z',
    attributes: [
      { trait_type: 'Background', value: 'Blue' },
      { trait_type: 'Clothing', value: 'Streetwear' },
      { trait_type: 'Eyes', value: 'Laser' },
    ]
  },
  { 
    id: '2', 
    name: 'Fox #1337', 
    collection: 'Famous Fox Federation', 
    image: 'https://picsum.photos/seed/fox/800/800',
    description: 'The Famous Fox Federation is a collection of 7,777 randomly generated Foxes.',
    mintAddress: 'Fox...1337',
    tokenAddress: 'Token...9vL4',
    attributes: [
      { trait_type: 'Fur', value: 'Red' },
      { trait_type: 'Hat', value: 'Cap' },
    ]
  },
  { 
    id: '3', 
    name: 'Claynosaur #88', 
    collection: 'Claynosaurz', 
    image: 'https://picsum.photos/seed/clay/800/800',
    description: 'Claynosaurz are 3D animated NFTs that represent various dinosaur species.',
    mintAddress: 'Clay...88pk',
    tokenAddress: 'Token...x9z0',
    attributes: [
      { trait_type: 'Species', value: 'Rex' },
      { trait_type: 'Skin', value: 'Green' },
    ]
  },
  { 
    id: '4', 
    name: 'Degenerate Ape #99', 
    collection: 'Degen Ape Academy', 
    image: 'https://picsum.photos/seed/ape/800/800',
    description: 'The Degen Ape Academy is a collection of 10,000 degenerate apes.',
    mintAddress: 'Ape...99xx',
    tokenAddress: 'Token...m7n8',
    attributes: [
      { trait_type: 'Head', value: 'Halo' },
      { trait_type: 'Mouth', value: 'Pizza' },
    ]
  },
];

const FAVORITE_DAPPS = [
  { name: 'Raydium', url: 'raydium.io', icon: 'https://picsum.photos/seed/ray/100/100' },
  { name: 'Magic Eden', url: 'magiceden.io', icon: 'https://picsum.photos/seed/me/100/100' },
  { name: 'Jupiter', url: 'jup.ag', icon: 'https://picsum.photos/seed/jup/100/100' },
  { name: 'Tensor', url: 'tensor.trade', icon: 'https://picsum.photos/seed/tensor/100/100' },
];

// --- Components ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('wallet');
  const [tokens, setTokens] = useState<Token[]>(() => {
    const saved = localStorage.getItem('phantom_tokens_v2');
    return saved ? JSON.parse(saved) : INITIAL_TOKENS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('phantom_transactions_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isTestnet, setIsTestnet] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('phantom_is_connected') === 'true';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('phantom_username') || 'Wallet 1';
  });
  const [isVerified, setIsVerified] = useState(() => {
    return localStorage.getItem('phantom_is_verified') === 'true';
  });
  const [tempUsername, setTempUsername] = useState(username);

  // New states for dynamic logic
  const [receivingAddress, setReceivingAddress] = useState(() => {
    return localStorage.getItem('phantom_receiving_address') || '7xKX...j9vL';
  });
  const [sendAmount, setSendAmount] = useState('1.5');
  const [sendRecipient, setSendRecipient] = useState('8vLp...3n9z');

  // Persist data
  useEffect(() => {
    localStorage.setItem('phantom_tokens_v2', JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('phantom_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('phantom_receiving_address', receivingAddress);
  }, [receivingAddress]);

  const touchStartRef = React.useRef<number | null>(null);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    triggerHaptic();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomly update a price slightly
    setTokens(prev => prev.map(t => ({
      ...t,
      price: t.price * (1 + (Math.random() * 0.04 - 0.02))
    })));
    
    setIsRefreshing(false);
    addToast('Data Refreshed');
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null && !isRefreshing) {
      const diff = e.touches[0].clientY - touchStartRef.current;
      if (diff > 0) {
        setPullProgress(Math.min(diff / 120, 1.2));
      }
    }
  };

  const onTouchEnd = () => {
    if (pullProgress > 0.8) {
      handleManualRefresh();
    }
    setPullProgress(0);
    touchStartRef.current = null;
  };

  const updateIdentity = (newUsername: string) => {
    let formatted = newUsername.trim();
    if (formatted && !formatted.startsWith('@') && formatted !== 'Wallet 1') {
      formatted = `@${formatted}`;
    }
    const finalUsername = formatted || 'Wallet 1';
    setUsername(finalUsername);
    localStorage.setItem('phantom_username', finalUsername);
    localStorage.setItem('phantom_is_verified', String(isVerified));
    addToast('Identity Updated');
  };

  const handleConnect = () => {
    setIsProcessing(true);
    triggerHaptic();
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      localStorage.setItem('phantom_is_connected', 'true');
      setIsProcessing(false);
      addToast('Wallet Connected');
    }, 1200);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    localStorage.setItem('phantom_is_connected', 'false');
    addToast('Wallet Disconnected', 'info');
  };

  // Reconciliation Rule: Dynamic Balance Calculation
  const tokenBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    tokens.forEach(token => {
      let balance = token.initialBalance;
      transactions.forEach(tx => {
        if (tx.tokenSymbol === token.symbol) {
          if (tx.type === 'receive') balance += tx.amount;
          if (tx.type === 'send') balance -= tx.amount;
        }
      });
      balances[token.symbol] = balance;
    });
    return balances;
  }, [tokens, transactions]);

  const totalBalance = useMemo(() => {
    return tokens.reduce((acc, t) => acc + (tokenBalances[t.symbol] || 0) * t.price, 0);
  }, [tokens, tokenBalances]);

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const generateMockTransaction = (type: 'send' | 'receive' | 'swap', amount: number, tokenSymbol: string, address: string) => {
    const token = tokens.find(t => t.symbol === tokenSymbol);
    const usdValue = amount * (token?.price || 0);
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      tokenSymbol,
      usdValue,
      status: 'confirmed',
      timestamp: Date.now(),
      address
    };

    setTransactions(prev => [newTx, ...prev]);
    triggerHaptic();
    return newTx;
  };

  const handleSend = async () => {
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('Invalid amount', 'info');
      return;
    }

    setIsProcessing(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    generateMockTransaction('send', amount, 'SOL', sendRecipient);
    
    setIsProcessing(false);
    setShowSendModal(false);
    addToast('Transaction Submitted');
  };

  const handleCloseReceive = () => {
    setShowReceiveModal(false);
    // Simulate incoming transaction after a short delay
    setTimeout(() => {
      const randomAmount = parseFloat((Math.random() * (5.0 - 0.1) + 0.1).toFixed(2));
      generateMockTransaction('receive', randomAmount, 'SOL', 'External Wallet');
      addToast(`Received ${randomAmount} SOL`);
    }, 500);
  };

  const handleBalanceTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 500) {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 3) {
        setShowSecretMenu(true);
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  const setTargetBalance = (target: number) => {
    const gap = target - totalBalance;
    if (Math.abs(gap) < 0.01) return;

    const usdc = tokens.find(t => t.symbol === 'USDC');
    if (usdc) {
      const amount = Math.abs(gap / usdc.price);
      const type = gap > 0 ? 'receive' : 'send';
      generateMockTransaction(type, amount, 'USDC', 'System Override');
      addToast(`${type === 'receive' ? 'Added' : 'Removed'} $${Math.abs(gap).toLocaleString()} to sync balance`);
    }
  };

  const tabVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0
    })
  };

  const getTabDirection = (newTab: Tab) => {
    const tabs: Tab[] = ['wallet', 'nfts', 'swap', 'activity', 'browser'];
    return tabs.indexOf(newTab) > tabs.indexOf(activeTab) ? 1 : -1;
  };

  const handleTabChange = (newTab: Tab) => {
    if (newTab === activeTab) return;
    triggerHaptic();
    setActiveTab(newTab);
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto overflow-hidden relative bg-phantom-bg text-white font-sans">
      {/* Header */}
      <header className="glass fixed top-0 w-full max-w-md z-30 safe-top flex items-center justify-between px-6 h-20">
        <div 
          className="flex items-center gap-3 cursor-pointer active:bg-white/5 p-2 -ml-2 rounded-2xl transition-colors"
          onClick={() => setShowSecretMenu(true)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-phantom-purple to-blue-400 flex items-center justify-center shadow-lg shadow-phantom-purple/20">
            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm" />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm tracking-[-0.02em] text-white">
                {username}
              </span>
              {isVerified && (
                <CheckCircle2 className="w-3 h-3 text-phantom-purple fill-phantom-purple/20" />
              )}
              <ChevronRight className="w-3 h-3 text-phantom-text-dim rotate-90 mt-0.5" />
            </div>
            {isConnected ? (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[9px] text-phantom-text-dim font-bold uppercase tracking-wider">
                  {receivingAddress.slice(0, 4)}...{receivingAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <span className="text-[9px] text-red-400/60 font-bold uppercase tracking-wider">
                Not Connected
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-phantom-text-dim" />
          <Settings className="w-5 h-5 text-phantom-text-dim" />
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto pt-20 pb-24 px-4 overscroll-contain scroll-smooth relative"
      >
        {/* Refresh Indicator */}
        <div 
          className="absolute top-2 left-0 w-full flex justify-center pointer-events-none z-50"
          style={{ 
            opacity: isRefreshing ? 1 : pullProgress,
            transform: `translateY(${(isRefreshing ? 60 : pullProgress * 60) - 20}px)` 
          }}
        >
          <div className="bg-phantom-card p-3 rounded-full shadow-xl border border-white/10">
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 text-phantom-purple animate-spin" />
            ) : (
              <ArrowDown 
                className="w-5 h-5 text-phantom-purple transition-transform duration-200" 
                style={{ transform: `rotate(${pullProgress * 180}deg)` }}
              />
            )}
          </div>
        </div>
        <AnimatePresence mode="popLayout" custom={getTabDirection(activeTab)}>
          {activeTab === 'wallet' && (
            <motion.div 
              key="wallet"
              custom={getTabDirection('wallet')}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="space-y-8 pt-4"
            >
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center space-y-10 py-16">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-phantom-purple/20 to-blue-400/20 flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-phantom-purple/5 animate-pulse" />
                    <Wallet className="w-12 h-12 text-phantom-purple relative z-10" />
                  </motion.div>
                  
                  <div className="text-center space-y-3 px-4">
                    <h2 className="text-3xl font-bold tracking-tight">Your Portal to Web3</h2>
                    <p className="text-phantom-text-dim text-sm leading-relaxed max-w-[260px] mx-auto">
                      Connect your wallet to manage your tokens, collect NFTs, and explore the decentralized web.
                    </p>
                  </div>

                  <button 
                    onClick={handleConnect}
                    disabled={isProcessing}
                    className="w-full py-5 bg-phantom-purple text-phantom-bg font-bold rounded-2xl text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-phantom-purple/20 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </button>
                  
                  <div className="pt-4 flex items-center gap-4 text-[10px] font-bold text-phantom-text-dim uppercase tracking-widest opacity-40">
                    <span>Secure</span>
                    <div className="w-1 h-1 rounded-full bg-current" />
                    <span>Private</span>
                    <div className="w-1 h-1 rounded-full bg-current" />
                    <span>Solana</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Balance Section */}
                  <div 
                    className="text-center space-y-1 cursor-pointer active:scale-95 transition-transform"
                    onClick={handleBalanceTap}
                  >
                    <p className="text-phantom-text-dim text-sm font-medium">Total Balance</p>
                    <h1 className="text-5xl font-bold tracking-tighter">
                      ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                    <p className="text-green-400 text-sm font-medium">+$124.50 (2.4%)</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-4">
                    <ActionButton icon={<ArrowUpRight />} label="Send" onClick={() => setShowSendModal(true)} />
                    <ActionButton icon={<ArrowDownLeft />} label="Receive" onClick={() => setShowReceiveModal(true)} />
                    <ActionButton icon={<ArrowLeftRight />} label="Swap" onClick={() => setShowSwapModal(true)} />
                  </div>

                  {/* Token List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-phantom-text-dim">Tokens</h2>
                      <Plus className="w-4 h-4 text-phantom-purple" />
                    </div>
                    
                    <div className="relative px-2">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-phantom-text-dim" />
                      <input 
                        type="text" 
                        placeholder="Search tokens" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-phantom-card py-3 pl-12 pr-4 rounded-2xl text-sm font-medium border border-white/5 focus:border-phantom-purple/30 transition-colors"
                      />
                    </div>

                    <div className="bg-phantom-card rounded-3xl overflow-hidden">
                      {tokens
                        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((token, idx) => (
                        <TokenRow 
                          key={token.id} 
                          token={token} 
                          balance={tokenBalances[token.symbol] || 0}
                          isLast={idx === tokens.length - 1} 
                        />
                      ))}
                    </div>
                    <button className="w-full py-4 text-sm font-medium text-phantom-purple bg-phantom-purple/10 rounded-2xl">
                      Manage Token List
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'nfts' && (
            <motion.div 
              key="nfts"
              custom={getTabDirection('nfts')}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="space-y-6 pt-4"
            >
              <h1 className="text-2xl font-bold px-2">Collectibles</h1>
              <div className="grid grid-cols-2 gap-4 pb-10">
                {INITIAL_NFTS.map(nft => (
                  <div 
                    key={nft.id} 
                    onClick={() => {
                      triggerHaptic();
                      setSelectedNFT(nft);
                    }}
                    className="bg-phantom-card rounded-3xl overflow-hidden group cursor-pointer active:scale-95 transition-transform duration-200 border border-white/5"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={nft.image} 
                        alt={nft.name} 
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-phantom-text-dim font-bold uppercase tracking-wider">{nft.collection}</p>
                      <p className="text-sm font-bold truncate">{nft.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div 
              key="activity"
              custom={getTabDirection('activity')}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="space-y-6 pt-4 h-full"
            >
              <h1 className="text-2xl font-bold px-2">Activity</h1>
              <div className="bg-phantom-card rounded-3xl overflow-hidden overscroll-contain">
                {transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <ActivityRow 
                      key={tx.id} 
                      tx={tx} 
                      tokenIcon={tokens.find(t => t.symbol === tx.tokenSymbol)?.icon || ''}
                      isLast={idx === transactions.length - 1} 
                    />
                  ))
                ) : (
                  <div className="p-12 text-center space-y-2">
                    <Clock className="w-12 h-12 text-phantom-text-dim mx-auto opacity-20" />
                    <p className="text-phantom-text-dim font-medium">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'browser' && (
            <motion.div 
              key="browser"
              custom={getTabDirection('browser')}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="space-y-8 pt-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-phantom-text-dim" />
                <input 
                  type="text" 
                  placeholder="Search or type URL" 
                  className="w-full bg-phantom-card py-4 pl-12 pr-4 rounded-2xl text-sm font-medium"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-phantom-text-dim px-2">Favorites</h2>
                <div className="grid grid-cols-4 gap-4">
                  {FAVORITE_DAPPS.map(dapp => (
                    <div key={dapp.name} className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-2xl bg-phantom-card overflow-hidden p-3">
                        <img src={dapp.icon} alt={dapp.name} className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[10px] font-semibold text-phantom-text-dim">{dapp.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-phantom-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Explore Solana</h3>
                  <ChevronRight className="w-5 h-5 text-phantom-text-dim" />
                </div>
                <p className="text-sm text-phantom-text-dim leading-relaxed">
                  Discover the best decentralized applications on Solana. From DeFi to NFTs and Gaming.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-phantom-purple/20 text-phantom-purple text-[10px] font-bold rounded-full">DEFI</span>
                  <span className="px-3 py-1 bg-phantom-purple/20 text-phantom-purple text-[10px] font-bold rounded-full">NFTS</span>
                  <span className="px-3 py-1 bg-phantom-purple/20 text-phantom-purple text-[10px] font-bold rounded-full">GAMES</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass fixed bottom-0 w-full max-w-md z-30 safe-bottom flex items-center justify-around h-20 px-4">
        <NavButton active={activeTab === 'wallet'} onClick={() => handleTabChange('wallet')} icon={<Wallet />} />
        <NavButton active={activeTab === 'nfts'} onClick={() => handleTabChange('nfts')} icon={<Grid />} />
        <NavButton active={showSwapModal} onClick={() => setShowSwapModal(true)} icon={<ArrowLeftRight />} />
        <NavButton active={activeTab === 'activity'} onClick={() => handleTabChange('activity')} icon={<Clock />} />
        <NavButton active={activeTab === 'browser'} onClick={() => handleTabChange('browser')} icon={<Globe />} />
      </nav>

      {/* Toast Notifications */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full px-6 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-phantom-purple text-phantom-bg px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm pointer-events-auto"
            >
              <CheckCircle2 className="w-5 h-5" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-phantom-bg w-full max-w-md rounded-t-[40px] p-8 space-y-8 border-t border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="w-10" /> {/* Spacer */}
                <h2 className="text-xl font-bold">Send SOL</h2>
                <button 
                  onClick={() => setShowSendModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-phantom-text-dim" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-phantom-text-dim uppercase text-center block">Recipient Address</label>
                  <input 
                    type="text" 
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    className="w-full glass-input p-4 rounded-2xl font-mono text-sm"
                    placeholder="Enter address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-phantom-text-dim uppercase text-center block">Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full glass-input py-8 text-4xl rounded-3xl"
                      placeholder="0"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-phantom-purple bg-phantom-purple/10 px-3 py-1 rounded-lg text-sm">
                      SOL
                    </div>
                  </div>
                </div>
              </div>

              <button 
                disabled={isProcessing}
                onClick={handleSend}
                className="w-full py-5 bg-phantom-purple text-phantom-bg font-bold rounded-2xl text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm and Send'
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receive Modal */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-phantom-bg w-full max-w-md rounded-t-[40px] p-8 space-y-8 border-t border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="w-10" /> {/* Spacer */}
                <h2 className="text-xl font-bold">Receive</h2>
                <button 
                  onClick={handleCloseReceive} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-phantom-text-dim" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-8 py-4">
                <div className="bg-white p-6 rounded-[32px] shadow-2xl relative group">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${receivingAddress}&size=200x200&bgcolor=ffffff&color=000000`} 
                    alt="QR Code" 
                    className="w-48 h-48"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-phantom-purple/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] pointer-events-none" />
                </div>
                
                <div className="w-full space-y-4 text-center">
                  <p className="text-xs font-bold text-phantom-text-dim uppercase tracking-widest">Your Wallet Address</p>
                  <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <div className="flex-1 font-mono text-sm py-2 px-4 text-left truncate">
                      {receivingAddress.slice(0, 6)}...{receivingAddress.slice(-6)}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(receivingAddress);
                        addToast('Address Copied');
                      }}
                      className="p-3 bg-phantom-purple text-phantom-bg rounded-xl active:scale-90 transition-transform"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-phantom-text-dim">Only send SOL or Solana tokens to this address.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(receivingAddress);
                    addToast('Address Copied');
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-white/5 text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button 
                  className="flex items-center justify-center gap-2 py-4 bg-white/5 text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NFT Detail Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-phantom-bg w-full max-w-md h-[92vh] rounded-t-[40px] flex flex-col overflow-hidden border-t border-white/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 shrink-0 relative z-10 glass border-b border-white/5">
                <button 
                  onClick={() => setSelectedNFT(null)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronRight className="w-5 h-5 text-phantom-text-dim rotate-180" />
                </button>
                <h2 className="text-base font-bold truncate max-w-[200px]">Collectible</h2>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                    <Share2 className="w-4 h-4 text-phantom-text-dim" />
                  </button>
                  <button 
                    onClick={() => setSelectedNFT(null)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-4 h-4 text-phantom-text-dim" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain pb-12">
                {/* Hero Asset */}
                <div className="aspect-square w-full relative group">
                  <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-phantom-bg via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <p className="text-phantom-purple font-bold text-xs uppercase tracking-[0.2em] mb-1">{selectedNFT.collection}</p>
                    <h1 className="text-3xl font-bold tracking-tight">{selectedNFT.name}</h1>
                  </div>
                </div>

                <div className="px-8 mt-8 space-y-8">
                  {/* Action Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <button className="py-4 bg-phantom-purple text-phantom-bg font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                      Send
                    </button>
                    <button className="py-4 bg-white/5 text-white font-bold rounded-2xl flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98] transition-transform">
                      List
                    </button>
                  </div>

                  {/* Description */}
                  {selectedNFT.description && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-phantom-text-dim uppercase tracking-wider">Description</h3>
                      <p className="text-sm leading-relaxed text-phantom-text-dim">
                        {selectedNFT.description}
                      </p>
                    </div>
                  )}

                  {/* Attributes */}
                  {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-phantom-text-dim uppercase tracking-wider">Attributes</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedNFT.attributes.map((attr, idx) => (
                          <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                            <p className="text-[10px] text-phantom-text-dim uppercase font-bold">{attr.trait_type}</p>
                            <p className="text-sm font-bold truncate">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details List */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <h3 className="text-xs font-bold text-phantom-text-dim uppercase tracking-wider">Details</h3>
                    <div className="space-y-2">
                      <DetailRow icon={<Hash className="w-4 h-4" />} label="Mint Address" value={selectedNFT.mintAddress || 'Unknown'} />
                      <DetailRow icon={<List className="w-4 h-4" />} label="Token Address" value={selectedNFT.tokenAddress || 'Unknown'} />
                      <DetailRow icon={<History className="w-4 h-4" />} label="Owner" value={receivingAddress.slice(0, 4) + '...' + receivingAddress.slice(-4)} />
                      <DetailRow icon={<Globe className="w-4 h-4" />} label="Network" value="Solana" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Modal */}
      <AnimatePresence>
        {showSwapModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-phantom-bg w-full max-w-md rounded-t-[40px] p-8 space-y-8 border-t border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="w-10" />
                <h2 className="text-xl font-bold">Swap</h2>
                <button 
                  onClick={() => setShowSwapModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-phantom-text-dim" />
                </button>
              </div>

              <div className="space-y-2 relative">
                <SwapInput label="You Pay" amount="1" symbol="SOL" balance={(tokenBalances['SOL'] || 0).toString()} />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-12 h-12 rounded-full bg-phantom-card border-4 border-phantom-bg flex items-center justify-center text-phantom-purple shadow-xl">
                    <ArrowDownLeft className="w-6 h-6 rotate-45" />
                  </div>
                </div>
                <SwapInput label="You Receive" amount="145.20" symbol="USDC" balance={(tokenBalances['USDC'] || 0).toString()} isEstimate />
              </div>

              <div className="bg-white/5 p-6 rounded-3xl space-y-3 border border-white/5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-phantom-text-dim">Rate</span>
                  <span>1 SOL ≈ 145.20 USDC</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-phantom-text-dim">Slippage Tolerance</span>
                  <span>0.5%</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-phantom-text-dim">Estimated Fee</span>
                  <span className="text-phantom-purple">0.000005 SOL</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowSwapModal(false);
                  addToast('Swap Successful');
                }}
                className="w-full py-5 bg-phantom-purple text-phantom-bg font-bold rounded-2xl text-lg active:scale-[0.98] transition-transform"
              >
                Review Order
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSecretMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSecretMenu(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[4px] flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0e10] w-full max-w-md rounded-t-[40px] border-t border-white/10 shadow-2xl flex flex-col max-h-[90dvh]"
            >
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-8 border-b border-white/5">
                <div className="w-8" />
                <h2 className="text-lg font-bold text-phantom-purple uppercase tracking-widest">Developer Settings</h2>
                <button 
                  onClick={() => setShowSecretMenu(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-phantom-text-dim" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 overscroll-contain custom-scrollbar pb-12">
                <div className="space-y-4">
                  <label className="text-[10px] text-phantom-text-dim uppercase font-bold tracking-wider px-2 block">Identity Settings</label>
                  <div className="bg-white/5 p-6 rounded-3xl space-y-6 border border-white/5">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-white/80">Username</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value)}
                          className="flex-1 bg-white/5 p-4 rounded-2xl text-xs font-bold outline-none border border-white/5 focus:border-phantom-purple/50 transition-colors"
                          placeholder="Enter @username..."
                        />
                        <button 
                          onClick={() => updateIdentity(tempUsername)}
                          className="bg-phantom-purple text-phantom-bg px-6 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    <Toggle 
                      enabled={isVerified} 
                      onChange={(val) => {
                        setIsVerified(val);
                        localStorage.setItem('phantom_is_verified', String(val));
                      }} 
                      label="Verified Badge" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-phantom-text-dim uppercase font-bold tracking-wider px-2 block">Receiving Address</label>
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                    <input 
                      type="text" 
                      value={receivingAddress}
                      onChange={(e) => setReceivingAddress(e.target.value)}
                      className="w-full bg-transparent p-2 rounded-xl text-xs font-mono outline-none"
                      placeholder="Set custom address"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-phantom-text-dim uppercase font-bold tracking-wider px-2 block">Environment</label>
                  <div className="bg-white/5 p-6 rounded-3xl space-y-4 border border-white/5">
                    <Toggle enabled={isConnected} onChange={(val) => val ? handleConnect() : handleDisconnect()} label="Wallet Connected" />
                    <Toggle enabled={isTestnet} onChange={setIsTestnet} label="Testnet Mode" />
                    <Toggle enabled={true} onChange={() => {}} label="Haptic Feedback" />
                    <Toggle enabled={false} onChange={() => {}} label="Debug Logs" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-phantom-text-dim uppercase font-bold tracking-wider px-2 block">Quick Injection</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => generateMockTransaction('receive', 1000, 'USDC', 'System')}
                      className="bg-white/5 py-5 rounded-3xl text-xs font-bold active:bg-phantom-purple/20 transition-colors border border-white/5"
                    >
                      +$1,000 USDC
                    </button>
                    <button 
                      onClick={() => generateMockTransaction('receive', 10, 'SOL', 'System')}
                      className="bg-white/5 py-5 rounded-3xl text-xs font-bold active:bg-phantom-purple/20 transition-colors border border-white/5"
                    >
                      +10 SOL
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-phantom-text-dim uppercase font-bold tracking-wider px-2 block">Target Balance Sync</label>
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      placeholder="e.g. 1000000"
                      className="flex-1 glass-input p-5 rounded-3xl text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setTargetBalance(parseFloat((e.target as HTMLInputElement).value));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        setTargetBalance(parseFloat(input.value));
                        input.value = '';
                      }}
                      className="bg-phantom-purple text-phantom-bg px-8 rounded-3xl text-xs font-bold active:scale-95 transition-transform"
                    >
                      Set
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-phantom-text-dim uppercase font-bold tracking-wider px-2 block">Token Price Override</label>
                  <div className="space-y-3">
                    {tokens.map(token => (
                      <div key={token.id} className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <img src={token.icon} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold">{token.symbol}</span>
                        </div>
                        <input 
                          type="number" 
                          value={token.price} 
                          onChange={(e) => setTokens(prev => prev.map(t => t.id === token.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t))}
                          className="w-24 bg-transparent text-right text-xs font-bold text-phantom-purple outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 space-y-4">
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all data?')) {
                        localStorage.removeItem('phantom_tokens_v2');
                        localStorage.removeItem('phantom_transactions_v2');
                        window.location.reload();
                      }
                    }}
                    className="w-full py-5 bg-red-400/10 text-red-400 font-bold rounded-3xl text-sm active:scale-[0.98] transition-transform border border-red-400/20"
                  >
                    Reset to Defaults
                  </button>
                  <p className="text-[10px] text-phantom-text-dim text-center uppercase tracking-widest opacity-50">Phantom Clone v2.1.0</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function NavButton({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center p-4 rounded-2xl transition-all duration-300 ${active ? 'text-phantom-purple bg-phantom-purple/10' : 'text-phantom-text-dim hover:text-white'}`}
      aria-label="Navigation Button"
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
    </button>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-phantom-card rounded-3xl hover:bg-white/5 transition-colors"
    >
      <div className="text-phantom-purple">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (val: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-bold text-white/80">{label}</span>
      <button 
        onClick={() => onChange(!enabled)}
        className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-phantom-purple' : 'bg-white/10'}`}
      >
        <motion.div 
          animate={{ x: enabled ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

const TokenRow: React.FC<{ token: Token; balance: number; isLast: boolean }> = ({ token, balance, isLast }) => {
  return (
    <div className={`flex items-center justify-between p-4 gap-3 hover:bg-white/5 transition-colors cursor-pointer ${!isLast ? 'border-b border-white/5' : ''}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-black/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img src={token.icon} alt={token.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{token.name}</p>
          <p className="text-[10px] text-phantom-text-dim font-medium">
            ${token.price.toLocaleString()} 
            <span className={token.change24h >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h}%
            </span>
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm">{balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.symbol}</p>
        <p className="text-[10px] text-phantom-text-dim font-medium">
          ${(balance * token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};

function SwapInput({ label, amount, symbol, balance, isEstimate }: { label: string; amount: string; symbol: string; balance: string; isEstimate?: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] space-y-4 border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-phantom-text-dim uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-phantom-text-dim">Balance: {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
      </div>
      <div className="flex justify-between items-center gap-4">
        <input 
          type="number" 
          value={amount} 
          readOnly={isEstimate}
          className={`bg-transparent text-4xl font-bold w-1/2 outline-none text-center ${isEstimate ? 'text-phantom-text-dim' : 'text-white'}`}
          placeholder="0"
        />
        <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-2xl cursor-pointer active:scale-95 transition-transform">
          <div className="w-6 h-6 rounded-full bg-phantom-purple/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-phantom-purple" />
          </div>
          <span className="font-bold text-sm">{symbol}</span>
          <ChevronRight className="w-4 h-4 text-phantom-text-dim" />
        </div>
      </div>
    </div>
  );
}

const ActivityRow: React.FC<{ tx: Transaction; tokenIcon: string; isLast: boolean }> = ({ tx, tokenIcon, isLast }) => {
  const Icon = tx.type === 'receive' ? ArrowDownLeft : tx.type === 'send' ? ArrowUpRight : ArrowLeftRight;
  const color = tx.type === 'receive' ? 'text-phantom-purple' : tx.type === 'send' ? 'text-red-400' : 'text-phantom-purple';
  const iconBg = tx.type === 'receive' ? 'bg-phantom-purple/10' : tx.type === 'send' ? 'bg-red-400/10' : 'bg-phantom-purple/10';

  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const timeString = useMemo(() => {
    const diff = Date.now() - tx.timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(tx.timestamp).toLocaleDateString();
  }, [tx.timestamp]);

  return (
    <div className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer ${!isLast ? 'border-b border-white/5' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-black/20 overflow-hidden">
            <img src={tokenIcon} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${iconBg} flex items-center justify-center border-2 border-phantom-card ${color}`}>
            <Icon className="w-3 h-3" />
          </div>
        </div>
        <div>
          <p className="font-bold text-sm capitalize">{tx.type} {tx.tokenSymbol}</p>
          <p className="text-xs text-phantom-text-dim font-medium">{tx.type === 'send' ? 'To' : 'From'}: {truncateAddress(tx.address)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${tx.type === 'receive' ? 'text-phantom-purple' : ''}`}>
          {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.tokenSymbol}
        </p>
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] text-phantom-text-dim font-bold uppercase tracking-tighter">{tx.status}</span>
          <span className="text-[10px] text-phantom-text-dim opacity-50">•</span>
          <span className="text-[10px] text-phantom-text-dim font-bold uppercase tracking-tighter">{timeString}</span>
        </div>
      </div>
    </div>
  );
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="text-phantom-text-dim opacity-50">
          {icon}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-phantom-text-dim">{label}</span>
      </div>
      <span className="text-sm font-bold font-mono text-white/80">{value}</span>
    </div>
  );
}
