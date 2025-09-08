// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

/**
 * @title LitterClassification
 * @dev Smart contract for privacy-preserving litter classification using ZK proofs
 * Built for DEV.to Privacy First Challenge - integrates with Midnight Network ZK circuits
 */
contract LitterClassification {
    
    // Events for UI integration
    event ClassificationSubmitted(
        bytes32 indexed commitmentHash,
        string classification,
        uint256 points,
        uint256 timestamp
    );
    
    event StrikeAdded(
        bytes32 indexed commitmentHash,
        string reason,
        uint256 strikeCount,
        bool banned
    );
    
    event RewardClaimed(
        bytes32 indexed commitmentHash,
        uint256 amount,
        uint256 timestamp
    );

    // Structs for ZK proof verification
    struct ZKProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[] publicSignals;
    }
    
    struct Classification {
        string category;
        uint256 points;
        uint256 timestamp;
        bool verified;
    }
    
    struct Strike {
        uint256 count;
        bool banned;
        string[] reasons;
    }

    // Storage for privacy-preserving data
    mapping(bytes32 => Classification) public classifications;
    mapping(bytes32 => Strike) public strikes;
    mapping(bytes32 => uint256) public rewards;
    mapping(string => uint256) public classificationPoints;
    
    // Admin controls
    address public admin;
    bool public paused = false;
    
    // ZK proof verification (mocked for testnet)
    address public zkVerifier;
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier notBanned(bytes32 commitmentHash) {
        require(!strikes[commitmentHash].banned, "This commitment is banned");
        _;
    }

    constructor() {
        admin = msg.sender;
        
        // Initialize classification point values (mocked tokens)
        classificationPoints["plastic_bottle"] = 10;
        classificationPoints["plastic_cup"] = 8;
        classificationPoints["plastic_bag"] = 12;
        classificationPoints["rope"] = 15;
        classificationPoints["other"] = 5;
    }

    /**
     * @dev Submit a privacy-preserving litter classification with ZK proof
     * @param commitmentHash Anonymous commitment hash from Midnight Network
     * @param classification Type of litter classified
     * @param zkProof Zero-knowledge proof of valid classification
     */
    function submitClassification(
        bytes32 commitmentHash,
        string memory classification,
        ZKProof memory zkProof
    ) external notPaused notBanned(commitmentHash) {
        
        // Verify ZK proof (simplified for testnet - in production would use real verifier)
        require(verifyZKProof(zkProof), "Invalid ZK proof");
        
        // Check if classification exists and is valid
        uint256 points = classificationPoints[classification];
        require(points > 0, "Invalid classification type");
        
        // Prevent duplicate submissions
        require(classifications[commitmentHash].timestamp == 0, "Classification already exists");
        
        // Store classification data
        classifications[commitmentHash] = Classification({
            category: classification,
            points: points,
            timestamp: block.timestamp,
            verified: true
        });
        
        // Award rewards (mocked tokens)
        rewards[commitmentHash] += points;
        
        emit ClassificationSubmitted(commitmentHash, classification, points, block.timestamp);
    }

    /**
     * @dev Add a strike to an anonymous commitment (admin moderation)
     * @param commitmentHash Anonymous commitment to penalize
     * @param reason Reason for the strike
     */
    function addStrike(bytes32 commitmentHash, string memory reason) external onlyAdmin {
        Strike storage userStrike = strikes[commitmentHash];
        userStrike.count++;
        userStrike.reasons.push(reason);
        
        // Ban after 5 strikes
        if (userStrike.count >= 5) {
            userStrike.banned = true;
        }
        
        emit StrikeAdded(commitmentHash, reason, userStrike.count, userStrike.banned);
    }

    /**
     * @dev Claim accumulated rewards (mocked token transfer)
     * @param commitmentHash Anonymous commitment to claim rewards for
     */
    function claimRewards(bytes32 commitmentHash) external notBanned(commitmentHash) {
        uint256 amount = rewards[commitmentHash];
        require(amount > 0, "No rewards to claim");
        
        // Reset rewards after claiming
        rewards[commitmentHash] = 0;
        
        // In a real implementation, this would transfer actual tokens
        // For the challenge, we just emit an event for UI integration
        emit RewardClaimed(commitmentHash, amount, block.timestamp);
    }

    /**
     * @dev Get classification data for a commitment hash
     */
    function getClassification(bytes32 commitmentHash) external view returns (
        string memory category,
        uint256 points,
        uint256 timestamp,
        bool verified
    ) {
        Classification memory classification = classifications[commitmentHash];
        return (classification.category, classification.points, classification.timestamp, classification.verified);
    }

    /**
     * @dev Get strike information for a commitment hash
     */
    function getStrikes(bytes32 commitmentHash) external view returns (uint256 count, bool banned) {
        Strike storage userStrike = strikes[commitmentHash];
        return (userStrike.count, userStrike.banned);
    }

    /**
     * @dev Admin function to update classification point values
     */
    function updateClassificationPoints(string memory classification, uint256 points) external onlyAdmin {
        classificationPoints[classification] = points;
    }

    /**
     * @dev Admin function to pause/unpause the contract
     */
    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    /**
     * @dev Simplified ZK proof verification (for testnet demonstration)
     * In production, this would integrate with a proper ZK verifier contract
     */
    function verifyZKProof(ZKProof memory proof) internal pure returns (bool) {
        // Simplified verification for challenge demonstration
        // In production, this would call a proper ZK SNARK verifier
        return proof.publicSignals.length > 0 && proof.a[0] != 0;
    }

    /**
     * @dev Emergency function to withdraw any accidentally sent ETH
     */
    function emergencyWithdraw() external onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }
}