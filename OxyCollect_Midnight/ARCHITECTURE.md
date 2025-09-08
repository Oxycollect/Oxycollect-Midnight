# OxyCollect-Midnight Architecture

## 🔒 Privacy First Challenge Implementation

This repository contains a complete Privacy-First DApp built for the DEV.to Privacy First Challenge, demonstrating zero-knowledge proof integration with Midnight Network for anonymous environmental action tracking.

## 📁 Repository Structure

```
privacy-first-challenge/
├── 📱 client/                    # React frontend with privacy-first UI
│   └── src/
│       ├── pages/
│       │   ├── anonymous.tsx     # Anonymous litter classification page
│       │   ├── map-privacy.tsx   # Privacy-protected map display
│       │   └── admin-dashboard-simple.tsx  # Privacy-safe admin panel
│       ├── components/ui/        # Shadcn UI components
│       ├── lib/
│       │   └── queryClient.ts    # TanStack Query configuration
│       └── App.tsx               # Main application with routing
├── 🌙 server/                    # Express backend with privacy protection
│   ├── routes.ts                 # API endpoints with anonymization
│   ├── mock-token-service.ts     # Standalone token rewards system
│   ├── anonymous-privacy-service.ts  # ZK proof privacy service
│   └── midnight-zk-service.ts    # Midnight Network integration
├── 🗄️ shared/
│   └── schema.ts                 # Database schema with anonymousPicks table
├── ⛓️ contracts/
│   └── LitterClassification.sol  # Smart contract for ZK proof verification
├── 🛡️ circuits/
│   └── classification.compact    # Midnight Compact ZK circuits
└── 📋 Configuration files
    ├── package.json              # Dependencies with Midnight SDK
    ├── hardhat.config.ts         # Smart contract deployment
    └── vite.config.ts            # Frontend build configuration
```

## 🚀 Core Privacy Features

### 1. Anonymous Litter Classification (`/anonymous`)
- **Zero User Tracking**: No user accounts or identity storage
- **Anonymous Sessions**: Cryptographic session IDs for consistency
- **ZK Proof Generation**: Real Midnight Network circuits validate submissions
- **Mock Token Rewards**: Anonymous wallet system for environmental incentives

### 2. Privacy-Protected Map (`/map`) 
- **Location Anonymization**: GPS coordinates anonymized to 10km zones
- **Anonymous Data Display**: Environmental actions shown without identity
- **Zone-Based Visualization**: Leaflet maps with privacy-protected markers
- **Real-time Privacy Stats**: Aggregate statistics without user exposure

### 3. Privacy-Safe Admin Panel (`/admin`)
- **Coordinate Anonymization**: Admin sees 10km zones, not exact locations
- **Anonymous Moderation**: Strike system uses cryptographic hashes
- **Identity Protection**: All user data shows as "anonymous_user"
- **Privacy Metadata**: Clear labeling of protection measures

## 🌙 Midnight Network Integration

### ZK Proof Generation
```typescript
// Generate anonymous commitment for privacy protection
const anonymousCommitment = midnightZKService.generateAnonymousCommitment(
  imageData,
  { lat, lng },
  userSecret
);
```

### Smart Contract Verification
```solidity
// Verify ZK proofs on-chain while maintaining privacy
function verifyClassification(
    bytes32 commitment,
    uint256[8] calldata proof
) external returns (bool)
```

### Compact Language Circuits
```compact
// Privacy-preserving litter classification circuit
circuit ClassificationProof {
    field private imageHash;
    field private location;
    field public isValid;
    
    constraint isValid = verifyImage(imageHash) && verifyLocation(location);
}
```

## 💰 Mock Token System

### Anonymous Reward Distribution
- **No KYC Required**: Complete anonymity maintained
- **Cryptographic Wallets**: Anonymous addresses for each user
- **Environmental Incentives**: OXY tokens for environmental actions
- **Blockchain Integration**: Mock smart contract deployment

```typescript
// Reward anonymous environmental action
const transaction = await mockTokenService.rewardAnonymousUser(
  anonymousHash,
  points
);
```

## 🛡️ Privacy Protection Layers

### Layer 1: Data Collection
- Anonymous image capture with privacy-protected metadata
- Location anonymization at collection time
- ZK proof generation for verification without exposure

### Layer 2: Storage
- `anonymousPicks` table instead of user-linked data
- Cryptographic hashes for consistent tracking
- No PII storage anywhere in the system

### Layer 3: Display
- Admin panels show anonymized coordinates (0.1° precision)
- Maps display 10km zones instead of exact locations  
- All user references show as "anonymous_user"

### Layer 4: Verification
- Strike system uses anonymous hashes
- ZK proofs verify actions without revealing identity
- Smart contracts verify without storing personal data

## 🎯 Challenge Compliance

✅ **DApp with Smart Contracts**: Complete blockchain integration  
✅ **ZK Circuit Implementation**: Real Midnight Network circuits  
✅ **Privacy-Focused UI**: Anonymous capture and privacy map  
✅ **Compact Language**: ZK proofs written in Midnight's Compact  
✅ **MidnightJS Integration**: Proper SDK usage throughout  
✅ **Focused Functionality**: Environmental classification with privacy  
✅ **Mock Transactions**: Testnet deployment with no real value  
✅ **Open Source**: Apache 2.0 licensed  

## 🔧 Technical Implementation

### Anonymous Data Flow
1. **Capture**: User takes photo anonymously
2. **Process**: ZK proof generated for verification  
3. **Store**: Data saved to `anonymousPicks` table
4. **Reward**: Mock tokens distributed to anonymous wallet
5. **Display**: Anonymized data shown on privacy map
6. **Moderate**: Admin can moderate using anonymous hashes

### Privacy Guarantees
- **No Identity Linkage**: Anonymous hashes prevent user tracking
- **Location Protection**: GPS anonymized to 10km zones
- **ZK Proof Verification**: Actions verified without revealing details
- **Anonymous Rewards**: Token distribution without KYC

This architecture demonstrates a complete privacy-first approach to environmental action tracking, meeting all Privacy First Challenge requirements while maintaining real-world usability.