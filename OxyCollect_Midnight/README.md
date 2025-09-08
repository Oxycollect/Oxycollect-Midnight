# OxyCollect-Midnight: Privacy First Challenge 🌙

A fully decentralized application (DApp) leveraging Midnight Network ZK circuits for privacy-preserving litter classification. Built for the **DEV.to Privacy First Challenge 2025** with complete smart contract integration and zero-knowledge proof verification.

## 🎯 Challenge Requirements Met

✅ **DApp with ZK circuits** - Generates proofs for litter classification entities  
✅ **Smart contracts integration** - Complete blockchain deployment with ZK verification  
✅ **User interface** - Showcases privacy-preserving mechanisms  
✅ **Midnight Compact language** - Real ZK circuits written in Compact  
✅ **MidnightJS integration** - Proper SDK usage for proof generation  
✅ **Focused functionality** - Privacy-preserving environmental classification  
✅ **Mocked transactions** - Testnet deployment with no real-world value  
✅ **Apache 2.0 license** - Open-source compliance  

## 🌙 Core Privacy Features

### Zero-Knowledge Identity Protection
- **Anonymous Commitments**: User identities replaced with cryptographic commitments
- **ZK Proof Generation**: Real Midnight Network circuits verify actions without revealing identity
- **Strike System**: Moderation via commitment hashes, never user accounts

### Location Anonymization
- **1km Radius Protection**: GPS coordinates anonymized to geographic zones
- **ZK Location Proofs**: Prove location validity without revealing exact coordinates
- **Map Display**: Environmental data shown with privacy-protected locations

### Smart Contract Integration
- **On-chain Verification**: ZK proofs verified on blockchain
- **Decentralized Rewards**: Mocked token distribution via smart contracts
- **Privacy-Preserving Events**: Blockchain events with anonymous commitments

## 🏗️ Architecture

```
📱 Frontend (React + TypeScript)
├── 🔐 Anonymous Classification UI (/anonymous)
├── 🗺️ Privacy-Protected Map (/map)
├── 👨‍💼 Admin Moderation Panel (/admin)
└── 🔗 Web3 Integration (MetaMask)

🌙 Midnight Network Integration
├── 📋 Compact Language Circuits (classification.compact)
├── 🔧 MidnightJS SDK Integration
└── 🛡️ ZK Proof Generation & Verification

⛓️ Smart Contracts (Solidity)
├── 📝 LitterClassification.sol
├── 🔐 ZK Proof Verification
└── 💰 Anonymous Reward System

🖥️ Backend Services
├── 🗄️ PostgreSQL Database
├── 🛡️ Privacy Protection Services
└── 📊 Admin Analytics
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- MetaMask wallet (for smart contract interaction)

### Installation

```bash
# Clone and setup
git clone <repository-url>
cd privacy-first-challenge
npm install

# Environment setup
cp .env.example .env
# Edit .env with your database and network configuration

# Database setup
npm run db:push

# Start development server
npm run dev
```

### Smart Contract Deployment

```bash
# Deploy to testnet (Sepolia)
npx hardhat deploy --network sepolia

# Verify contract
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 🔗 Live Demo Routes

- **`/anonymous`** - Privacy-first litter classification with ZK proofs
- **`/map`** - Environmental map with anonymized location data  
- **`/admin`** - Moderation panel preserving user privacy
- **`/auth`** - Admin authentication for contract interaction

## 🛠️ Technology Stack

### Privacy & ZK Technology
- **Midnight Network** - Zero-knowledge proof infrastructure
- **Compact Language** - ZK circuit programming language
- **MidnightJS SDK** - Proof generation and verification

### Blockchain & Smart Contracts
- **Solidity** - Smart contract development
- **Ethers.js** - Web3 blockchain interaction
- **Hardhat** - Smart contract deployment and testing

### Frontend & Backend
- **React + TypeScript** - Modern UI framework
- **Express.js** - Backend API server
- **PostgreSQL + Drizzle ORM** - Privacy-focused data storage
- **TailwindCSS** - Responsive styling

## 🔐 Privacy Architecture Deep Dive

### 1. Anonymous Identity System
```typescript
// Generate anonymous commitment
const commitment = mimc([userSecret, imageHash, timestamp]);
// User identity → Anonymous commitment hash
```

### 2. ZK Classification Proofs
```compact
// Compact circuit proves valid classification without revealing details
circuit ClassificationProof {
    private field userSecret;
    private field imageHash;
    private field exactLocation;
    
    public field commitmentHash;
    public field classificationHash;
    public field locationZone;
    
    constraint main() {
        // Prove commitment is correctly computed
        let computed = mimc([userSecret, imageHash]);
        assert(computed == commitmentHash);
        
        // Prove location is anonymized properly
        let zone = anonymizeLocation(exactLocation);
        assert(zone == locationZone);
    }
}
```

### 3. Smart Contract Verification
```solidity
function submitClassification(
    bytes32 commitmentHash,
    string memory classification,
    ZKProof memory proof
) external {
    require(verifyZKProof(proof), "Invalid ZK proof");
    // Process anonymous classification...
}
```

## 🎮 How It Works

1. **Anonymous Session**: User creates privacy-protected session
2. **Photo Capture**: Take photo of litter for classification
3. **ZK Proof Generation**: Midnight Network generates privacy proof
4. **Smart Contract Submission**: Proof verified on-chain
5. **Anonymous Rewards**: Mocked tokens awarded to commitment hash
6. **Privacy-Protected Map**: Location displayed with anonymization
7. **Admin Moderation**: Content reviewed without user identity exposure

## 💡 Privacy Guarantees

- **Zero User Tracking**: No personal data collection or storage
- **Location Protection**: GPS coordinates anonymized to 1km zones  
- **Identity Anonymization**: All actions tied to cryptographic commitments
- **Decentralized Verification**: ZK proofs verified on blockchain
- **Moderation Privacy**: Strike system works with anonymous hashes

## 🌍 Environmental Impact

While maintaining complete privacy, the DApp contributes to environmental awareness by:
- Crowdsourcing litter classification data
- Creating anonymous environmental maps
- Incentivizing cleanup activities
- Training AI models with privacy-protected data

## 📝 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

## 🏆 DEV.to Privacy First Challenge

This DApp demonstrates how zero-knowledge technology can enable environmental crowdsourcing while providing unprecedented privacy protection. Users can contribute to environmental data collection without sacrificing their identity, location privacy, or personal information.

**Key Innovation**: Complete anonymity with full functionality - proving that privacy and utility are not mutually exclusive.

---

*Built with 🌙 Midnight Network ZK technology for maximum privacy protection*