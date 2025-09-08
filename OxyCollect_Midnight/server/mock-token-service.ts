// Mock Token Service for Privacy First Challenge
// Simulates Web3 token rewards without real blockchain interaction

export interface MockToken {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
}

export interface MockWallet {
  address: string;
  balance: bigint;
  transactions: MockTransaction[];
}

export interface MockTransaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  timestamp: Date;
  type: 'reward' | 'transfer';
  description: string;
}

class MockTokenService {
  private readonly OXY_TOKEN: MockToken = {
    id: 'oxy-token',
    symbol: 'OXY',
    name: 'Oxy Environmental Token',
    decimals: 18,
    totalSupply: BigInt('1000000000000000000000000') // 1M tokens with 18 decimals
  };

  private wallets = new Map<string, MockWallet>();
  private transactions: MockTransaction[] = [];

  constructor() {
    console.log('🪙 Mock Token Service initialized for Privacy First Challenge');
  }

  // Create anonymous wallet for privacy testing
  createAnonymousWallet(): MockWallet {
    const anonymousAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    const wallet: MockWallet = {
      address: anonymousAddress,
      balance: BigInt(0),
      transactions: []
    };
    
    this.wallets.set(anonymousAddress, wallet);
    console.log(`🔐 Anonymous wallet created: ${anonymousAddress.substring(0, 8)}...`);
    return wallet;
  }

  // Reward anonymous user with mock tokens
  async rewardAnonymousUser(anonymousHash: string, points: number): Promise<MockTransaction> {
    const tokenAmount = BigInt(points) * BigInt('1000000000000000000'); // Points * 1 token with 18 decimals
    
    // Get or create anonymous wallet
    let wallet = this.wallets.get(anonymousHash);
    if (!wallet) {
      wallet = {
        address: anonymousHash,
        balance: BigInt(0),
        transactions: []
      };
      this.wallets.set(anonymousHash, wallet);
    }

    // Create mock transaction
    const transaction: MockTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
      from: 'REWARD_CONTRACT',
      to: anonymousHash,
      amount: tokenAmount,
      timestamp: new Date(),
      type: 'reward',
      description: `Environmental cleanup reward: ${points} points → ${points} OXY tokens`
    };

    // Update wallet balance
    wallet.balance += tokenAmount;
    wallet.transactions.push(transaction);
    this.transactions.push(transaction);

    console.log(`💰 Mock reward: ${points} OXY tokens → ${anonymousHash.substring(0, 12)}...`);
    return transaction;
  }

  // Get wallet info for anonymous user
  getWalletInfo(address: string): MockWallet | null {
    return this.wallets.get(address) || null;
  }

  // Get all transactions for admin review
  getAllTransactions(): MockTransaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get total tokens distributed
  getTotalDistributed(): bigint {
    return this.transactions
      .filter(tx => tx.type === 'reward')
      .reduce((total, tx) => total + tx.amount, BigInt(0));
  }

  // Format token amount for display
  formatTokenAmount(amount: bigint): string {
    const tokenValue = Number(amount) / Number(BigInt('1000000000000000000')); // Convert from wei
    return `${tokenValue.toFixed(2)} OXY`;
  }

  // Get mock contract stats for admin
  getContractStats() {
    const totalWallets = this.wallets.size;
    const totalTransactions = this.transactions.length;
    const totalDistributed = this.getTotalDistributed();
    
    return {
      tokenInfo: this.OXY_TOKEN,
      totalWallets,
      totalTransactions,
      totalDistributed: this.formatTokenAmount(totalDistributed),
      activeWallets: Array.from(this.wallets.values()).filter(w => w.balance > 0).length
    };
  }
}

export const mockTokenService = new MockTokenService();