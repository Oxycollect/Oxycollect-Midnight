// Web3 integration for smart contract interaction
// Privacy First Challenge - DApp component

import { ethers } from 'ethers';
import { midnightService, type ZKProofData } from './midnight-integration';

// Smart contract ABI (simplified for challenge)
const LITTER_CLASSIFICATION_ABI = [
  "function submitClassification(bytes32 commitmentHash, string memory classification, tuple(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[] publicSignals) zkProof) external",
  "function addStrike(bytes32 commitmentHash, string memory reason) external",
  "function claimRewards(bytes32 commitmentHash) external",
  "function getClassification(bytes32 commitmentHash) external view returns (string, uint256, uint256, bool)",
  "function getStrikes(bytes32 commitmentHash) external view returns (uint256, bool)",
  "event ClassificationSubmitted(bytes32 indexed commitmentHash, string classification, uint256 points, uint256 timestamp)",
  "event StrikeAdded(bytes32 indexed commitmentHash, string reason, uint256 strikeCount, bool banned)",
  "event RewardClaimed(bytes32 indexed commitmentHash, uint256 amount, uint256 timestamp)"
];

// Contract configuration
const CONTRACT_CONFIG = {
  address: process.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b8D4b9b4A4E8A3b6F2', // Testnet address
  networkId: 11155111, // Sepolia testnet
  rpcUrl: process.env.VITE_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id'
};

class Web3Service {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        await this.requestAccount();
      } else {
        // Fallback to RPC provider for read-only operations
        this.provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
      }

      // Initialize contract
      this.contract = new ethers.Contract(
        CONTRACT_CONFIG.address,
        LITTER_CLASSIFICATION_ABI,
        this.signer || this.provider
      );

      this.initialized = true;
      console.log('🔗 Web3 Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web3 service:', error);
      throw error;
    }
  }

  async requestAccount(): Promise<void> {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.signer = await this.provider.getSigner();
      console.log('📝 Connected to wallet:', await this.signer.getAddress());
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Submit privacy-preserving classification to smart contract
   */
  async submitClassification(params: {
    imageData: string;
    classification: string;
    latitude: number;
    longitude: number;
    userSecret: string;
  }): Promise<string> {
    await this.initialize();
    if (!this.contract || !this.signer) {
      throw new Error('Smart contract or signer not available');
    }

    try {
      // Generate ZK proof using Midnight Network
      const zkProofData = await midnightService.generateClassificationProof(params);

      // Format proof for smart contract
      const formattedProof = {
        a: [ethers.getBigInt(zkProofData.proof.a[0]), ethers.getBigInt(zkProofData.proof.a[1])],
        b: [
          [ethers.getBigInt(zkProofData.proof.b[0][0]), ethers.getBigInt(zkProofData.proof.b[0][1])],
          [ethers.getBigInt(zkProofData.proof.b[1][0]), ethers.getBigInt(zkProofData.proof.b[1][1])]
        ],
        c: [ethers.getBigInt(zkProofData.proof.c[0]), ethers.getBigInt(zkProofData.proof.c[1])],
        publicSignals: Object.values(zkProofData.publicSignals).map(x => ethers.getBigInt(x as any))
      };

      // Submit to smart contract
      const tx = await this.contract.submitClassification(
        zkProofData.commitmentHash,
        params.classification,
        formattedProof
      );

      console.log('📤 Classification transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Classification confirmed on-chain:', receipt.transactionHash);
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to submit classification:', error);
      throw error;
    }
  }

  /**
   * Admin function to add strike to anonymous commitment
   */
  async addStrike(commitmentHash: string, reason: string): Promise<string> {
    await this.initialize();
    if (!this.contract || !this.signer) {
      throw new Error('Smart contract or signer not available');
    }

    try {
      const tx = await this.contract.addStrike(commitmentHash, reason);
      console.log('⚠️ Strike transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Strike confirmed on-chain:', receipt.transactionHash);
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to add strike:', error);
      throw error;
    }
  }

  /**
   * Claim rewards for anonymous commitment
   */
  async claimRewards(commitmentHash: string): Promise<string> {
    await this.initialize();
    if (!this.contract || !this.signer) {
      throw new Error('Smart contract or signer not available');
    }

    try {
      const tx = await this.contract.claimRewards(commitmentHash);
      console.log('💰 Reward claim transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Reward claim confirmed on-chain:', receipt.transactionHash);
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      throw error;
    }
  }

  /**
   * Get classification data from smart contract
   */
  async getClassification(commitmentHash: string): Promise<{
    category: string;
    points: number;
    timestamp: number;
    verified: boolean;
  }> {
    await this.initialize();
    if (!this.contract) {
      throw new Error('Smart contract not available');
    }

    try {
      const [category, points, timestamp, verified] = await this.contract.getClassification(commitmentHash);
      return {
        category,
        points: Number(points),
        timestamp: Number(timestamp),
        verified
      };
    } catch (error) {
      console.error('Failed to get classification:', error);
      throw error;
    }
  }

  /**
   * Get strike information for commitment hash
   */
  async getStrikes(commitmentHash: string): Promise<{
    count: number;
    banned: boolean;
  }> {
    await this.initialize();
    if (!this.contract) {
      throw new Error('Smart contract not available');
    }

    try {
      const [count, banned] = await this.contract.getStrikes(commitmentHash);
      return {
        count: Number(count),
        banned
      };
    } catch (error) {
      console.error('Failed to get strikes:', error);
      throw error;
    }
  }

  /**
   * Listen for smart contract events
   */
  onClassificationSubmitted(callback: (event: any) => void): void {
    if (!this.contract) return;
    
    this.contract.on('ClassificationSubmitted', (commitmentHash, classification, points, timestamp, event) => {
      callback({
        commitmentHash,
        classification,
        points: Number(points),
        timestamp: Number(timestamp),
        transactionHash: event.transactionHash
      });
    });
  }

  onStrikeAdded(callback: (event: any) => void): void {
    if (!this.contract) return;
    
    this.contract.on('StrikeAdded', (commitmentHash, reason, strikeCount, banned, event) => {
      callback({
        commitmentHash,
        reason,
        strikeCount: Number(strikeCount),
        banned,
        transactionHash: event.transactionHash
      });
    });
  }

  onRewardClaimed(callback: (event: any) => void): void {
    if (!this.contract) return;
    
    this.contract.on('RewardClaimed', (commitmentHash, amount, timestamp, event) => {
      callback({
        commitmentHash,
        amount: Number(amount),
        timestamp: Number(timestamp),
        transactionHash: event.transactionHash
      });
    });
  }
}

// Export singleton instance
export const web3Service = new Web3Service();

// Helper function to format commitment hash for display
export function formatCommitmentHash(hash: string): string {
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}

// Helper function to get network name
export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Mainnet',
    11155111: 'Sepolia',
    137: 'Polygon',
    80001: 'Mumbai'
  };
  return networks[chainId] || 'Unknown';
}