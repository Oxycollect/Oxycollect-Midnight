import { pgTable, text, varchar, serial, integer, boolean, timestamp, real, unique, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced users table with crypto wallet integration
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user IDs
  email: varchar("email"),
  password: varchar("password"), // Added password field for email authentication
  displayName: varchar("display_name"), // User-chosen display name
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Legacy fields for backward compatibility
  username: text("username").default(""),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  dailyItems: integer("daily_items").default(0).notNull(),
  weeklyStreak: integer("weekly_streak").default(0).notNull(),
  totalItems: integer("total_items").default(0).notNull(),
  totalRewards: integer("total_rewards").default(0).notNull(),
  // Crypto wallet integration fields
  primaryWalletAddress: varchar("primary_wallet_address"), // Main wallet address
  walletType: varchar("wallet_type"), // metamask, walletconnect, builtin
  oxyTokenBalance: real("oxy_token_balance").default(0).notNull(), // OXY token balance
  stakedTokens: real("staked_tokens").default(0).notNull(), // Tokens currently staked
  totalTokensEarned: real("total_tokens_earned").default(0).notNull(), // Lifetime token earnings
  kycVerified: boolean("kyc_verified").default(false).notNull(), // KYC verification status
  walletCreatedAt: timestamp("wallet_created_at"), // When wallet was first connected
  lastTokenSync: timestamp("last_token_sync"), // Last blockchain sync
  isAdmin: boolean("is_admin").default(false).notNull(), // Admin access
  streakDays: integer("streak_days").default(0).notNull(), // Daily streak counter
  termsAccepted: boolean("terms_accepted").default(false).notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  privacyPolicyAccepted: boolean("privacy_policy_accepted").default(false).notNull(),
  privacyPolicyAcceptedAt: timestamp("privacy_policy_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const litterItems = pgTable("litter_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // Anonymous user hash - no link to real identity
  imageUrl: text("image_url").notNull(),
  originalImageUrl: text("original_image_url"), // Store raw capture for comparison
  classification: text("classification").notNull(),
  originalClassification: text("original_classification"), // What user actually selected (plastic_wrapper, vape, etc.)
  predictedClassification: text("predicted_classification"), // CNN prediction
  classificationConfidence: real("classification_confidence"), // CNN confidence score
  points: integer("points").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  country: varchar("country", { length: 100 }), // Country name from coordinates
  countryCode: varchar("country_code", { length: 2 }), // ISO country code
  region: varchar("region", { length: 100 }), // State/Province/Region
  locality: varchar("locality", { length: 100 }), // City/Town
  verified: boolean("verified").default(false).notNull(),
  manuallyVerified: boolean("manually_verified").default(false).notNull(), // Human verification for training
  imageMetadata: jsonb("image_metadata"), // Processing details, dimensions, etc.
  duplicateHash: varchar("duplicate_hash"), // ZK-based duplicate prevention
  privacyLevel: varchar("privacy_level").default("midnight_protected"), // All submissions use Midnight privacy
  // ZK Proof fields temporarily removed to fix login issue
  // zkProofHash: varchar("zk_proof_hash", { length: 64 }), // Hash of the ZK proof for verification
  // zkPublicSignals: jsonb("zk_public_signals"), // Public signals from ZK proof (location range, confidence)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classifications = pgTable("classifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  points: integer("points").notNull(),
  description: text("description"),
});

// New table for user-submitted classification suggestions pending admin approval
export const classificationSuggestions = pgTable("classification_suggestions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // Suggested classification name
  description: text("description"), // User-provided description
  suggestedPoints: integer("suggested_points").default(10).notNull(), // User or default point suggestion
  imageUrl: text("image_url"), // Reference image that prompted this suggestion
  status: varchar("status").default("pending").notNull(), // pending, approved, rejected
  adminNotes: text("admin_notes"), // Admin feedback/reasoning
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetType: text("target_type").notNull(), // e.g., "plastic_bottle", "any"
  targetCount: integer("target_count").notNull(),
  rewardPoints: integer("reward_points").notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userQuests = pgTable("user_quests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  questId: integer("quest_id").references(() => quests.id).notNull(),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questCompletions = pgTable("quest_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  questId: integer("quest_id").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserQuest: unique().on(table.userId, table.questId),
}));

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens for secure email-based password recovery
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cleanupSessions = pgTable("cleanup_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  totalDistance: real("total_distance").default(0), // in meters
  totalPoints: integer("total_points").default(0),
  itemsCollected: integer("items_collected").default(0),
  averageAccuracy: real("average_accuracy"), // GPS accuracy in meters
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gpsTrackingPoints = pgTable("gps_tracking_points", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => cleanupSessions.id).notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"), // GPS accuracy in meters
  altitude: real("altitude"),
  heading: real("heading"),
  speed: real("speed"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Anonymous picks table for ZK-verified litter submissions (Privacy First Challenge)
export const anonymousPicks = pgTable("anonymous_picks", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(), // Full anonymous image data (base64 or IPFS)
  imageHash: varchar("image_hash", { length: 64 }).notNull().unique(), // SHA-256 hash of image for verification
  classification: text("classification").notNull(), // AI-classified litter type
  locationRange: jsonb("location_range").notNull(), // {latRange: [min, max], lngRange: [min, max]}
  anonymousHash: varchar("anonymous_hash", { length: 64 }).notNull(), // Consistent anonymous user identifier
  points: integer("points").default(10).notNull(), // Anonymous points awarded
  zkProofHash: varchar("zk_proof_hash", { length: 64 }), // Hash of the ZK proof for verification
  zkPublicSignals: jsonb("zk_public_signals"), // Public signals from ZK proof
  isVerified: boolean("is_verified").default(false), // Whether ZK proof was verified
  confidenceScore: real("confidence_score"), // AI classification confidence
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Anonymous rewards tracking (decoupled from user accounts)
export const anonymousRewards = pgTable("anonymous_rewards", {
  id: serial("id").primaryKey(),
  rewardHash: varchar("reward_hash", { length: 64 }).notNull().unique(), // Anonymous identifier
  totalPoints: integer("total_points").default(0).notNull(),
  totalPicks: integer("total_picks").default(0).notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  zkCommitment: varchar("zk_commitment", { length: 128 }), // ZK commitment for privacy
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teams table for team management
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  maxMembers: integer("max_members").default(20),
  totalPoints: integer("total_points").default(0),
  rank: integer("rank").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).default("member"), // member, admin, leader
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueTeamUser: unique().on(table.teamId, table.userId),
}));

// Team join requests table
export const teamJoinRequests = pgTable("team_join_requests", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  respondedById: integer("responded_by_id").references(() => users.id),
}, (table) => ({
  uniqueTeamUserRequest: unique().on(table.teamId, table.userId),
}));

// Team posts and social features
export const teamPosts = pgTable("team_posts", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  postType: varchar("post_type").default("discussion").notNull(), // discussion, event, swap, announcement
  eventDate: timestamp("event_date"), // For event posts
  location: varchar("location"), // Event location
  isSticky: boolean("is_sticky").default(false).notNull(), // Pin to top
  likesCount: integer("likes_count").default(0).notNull(),
  repliesCount: integer("replies_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team post likes
export const teamPostLikes = pgTable("team_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => teamPosts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniquePostUserLike: unique().on(table.postId, table.userId),
}));

// Team post replies/comments
export const teamPostReplies = pgTable("team_post_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => teamPosts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentReplyId: integer("parent_reply_id"), // For nested replies - will add self-reference later
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team settings and customization
export const teamSettings = pgTable("team_settings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull().unique(),
  allowJoinRequests: boolean("allow_join_requests").default(true).notNull(),
  allowMemberPosts: boolean("allow_member_posts").default(true).notNull(),
  allowMemberEvents: boolean("allow_member_events").default(true).notNull(),
  requirePostApproval: boolean("require_post_approval").default(false).notNull(),
  postingMode: varchar("posting_mode").default("team").notNull(), // "team", "leader_only", "selective"
  teamColor: varchar("team_color").default("#059669").notNull(), // Teal default
  teamBanner: text("team_banner"), // Banner image URL
  welcomeMessage: text("welcome_message"),
  rules: text("rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Selective posting privileges for specific users
export const teamPostingPrivileges = pgTable("team_posting_privileges", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  canPost: boolean("can_post").default(true).notNull(),
  canCreateEvents: boolean("can_create_events").default(true).notNull(),
  grantedBy: varchar("granted_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTeamUserPrivilege: unique().on(table.teamId, table.userId),
}));

// Proposals system for teams and general community
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  teamId: integer("team_id").references(() => teams.id), // null for general proposals
  category: varchar("category").default("general").notNull(), // general, feature, team, event
  status: varchar("status").default("active").notNull(), // active, completed, rejected, archived
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  implementationStatus: varchar("implementation_status").default("proposed").notNull(), // proposed, in_progress, completed, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proposal votes
export const proposalVotes = pgTable("proposal_votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  voteType: varchar("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueProposalUserVote: unique().on(table.proposalId, table.userId),
}));



export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLitterItemSchema = createInsertSchema(litterItems).omit({
  id: true,
  createdAt: true,
});

export const insertClassificationSchema = createInsertSchema(classifications).omit({
  id: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});



export const insertUserQuestSchema = createInsertSchema(userQuests).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCleanupSessionSchema = createInsertSchema(cleanupSessions).omit({
  id: true,
  createdAt: true,
});

export const insertGpsTrackingPointSchema = createInsertSchema(gpsTrackingPoints).omit({
  id: true,
  timestamp: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalPoints: true,
  rank: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTeamJoinRequestSchema = createInsertSchema(teamJoinRequests).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
  respondedById: true,
});

export const insertTeamPostSchema = createInsertSchema(teamPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likesCount: true,
  repliesCount: true,
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  upvotes: true,
  downvotes: true,
});

export const insertProposalVoteSchema = createInsertSchema(proposalVotes).omit({
  id: true,
  createdAt: true,
});

export const insertTeamPostLikeSchema = createInsertSchema(teamPostLikes).omit({
  id: true,
  createdAt: true,
});

export const insertTeamPostReplySchema = createInsertSchema(teamPostReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSettingsSchema = createInsertSchema(teamSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamPostingPrivilegeSchema = createInsertSchema(teamPostingPrivileges).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertLitterItem = z.infer<typeof insertLitterItemSchema>;
export type LitterItem = typeof litterItems.$inferSelect;
export type InsertClassification = z.infer<typeof insertClassificationSchema>;
export type Classification = typeof classifications.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;
export type InsertUserQuest = z.infer<typeof insertUserQuestSchema>;
export type UserQuest = typeof userQuests.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertCleanupSession = z.infer<typeof insertCleanupSessionSchema>;
export type CleanupSession = typeof cleanupSessions.$inferSelect;
export type InsertGpsTrackingPoint = z.infer<typeof insertGpsTrackingPointSchema>;
export type GpsTrackingPoint = typeof gpsTrackingPoints.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect & {
  memberCount?: string | number;
  allowJoinRequests?: boolean;
  points?: number; // Alias for totalPoints for backward compatibility
};
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamJoinRequest = z.infer<typeof insertTeamJoinRequestSchema>;
export type TeamJoinRequest = typeof teamJoinRequests.$inferSelect;
export type InsertTeamPost = z.infer<typeof insertTeamPostSchema>;
export type TeamPost = typeof teamPosts.$inferSelect;
export type InsertTeamPostLike = z.infer<typeof insertTeamPostLikeSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposalVote = z.infer<typeof insertProposalVoteSchema>;
export type ProposalVote = typeof proposalVotes.$inferSelect;
export type TeamPostLike = typeof teamPostLikes.$inferSelect;
export type InsertTeamPostReply = z.infer<typeof insertTeamPostReplySchema>;
export type TeamPostReply = typeof teamPostReplies.$inferSelect;
export type InsertTeamSettings = z.infer<typeof insertTeamSettingsSchema>;
export type TeamSettings = typeof teamSettings.$inferSelect;
export type TeamPostingPrivilege = typeof teamPostingPrivileges.$inferSelect;
export type InsertTeamPostingPrivilege = z.infer<typeof insertTeamPostingPrivilegeSchema>;

// Classification suggestion types
export const insertClassificationSuggestionSchema = createInsertSchema(classificationSuggestions)
  .omit({ id: true, createdAt: true, reviewedAt: true });
export type ClassificationSuggestion = typeof classificationSuggestions.$inferSelect;
export type InsertClassificationSuggestion = z.infer<typeof insertClassificationSuggestionSchema>;

export const CLASSIFICATION_TYPES = {
  plastic_bottle: { name: "Plastic Bottle", points: 10 },
  plastic_cup: { name: "Plastic Cup", points: 10 },
  plastic_bag: { name: "Plastic Bag", points: 10 },
  rope: { name: "Rope", points: 10 },
  other: { name: "Other Material", points: 10 },
} as const;

// Handle both space and underscore variants for classification mapping
export const getClassificationInfo = (classification: string) => {
  // Handle space variant by converting to underscore
  const normalizedKey = classification.replace(/\s+/g, '_') as keyof typeof CLASSIFICATION_TYPES;
  return CLASSIFICATION_TYPES[normalizedKey] || CLASSIFICATION_TYPES.other;
};

export type ClassificationType = keyof typeof CLASSIFICATION_TYPES;

// Crypto wallet management tables
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletAddress: varchar("wallet_address").notNull().unique(),
  walletType: varchar("wallet_type").notNull(), // metamask, walletconnect, builtin, hardware
  blockchain: varchar("blockchain").default("polygon").notNull(), // polygon, ethereum, bsc
  isActive: boolean("is_active").default(true).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  publicKey: text("public_key"),
  encryptedPrivateKey: text("encrypted_private_key"), // For built-in wallets only
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Token transaction history
export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletId: integer("wallet_id").references(() => wallets.id),
  transactionType: varchar("transaction_type").notNull(), // earn, spend, stake, unstake, transfer
  amount: real("amount").notNull(),
  tokenType: varchar("token_type").default("OXY").notNull(),
  pointsConverted: integer("points_converted"), // Points converted to tokens
  conversionRate: real("conversion_rate"), // Points per token at time of conversion
  blockchainTxHash: varchar("blockchain_tx_hash"), // On-chain transaction hash
  status: varchar("status").default("pending").notNull(), // pending, confirmed, failed
  description: text("description"),
  metadata: jsonb("metadata"), // Additional transaction details
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

// Token staking system
export const stakingPools = pgTable("staking_pools", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  minStakeAmount: real("min_stake_amount").default(100).notNull(),
  maxStakeAmount: real("max_stake_amount"),
  apy: real("apy").notNull(), // Annual percentage yield
  lockupPeriodDays: integer("lockup_period_days").default(30).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  totalStaked: real("total_staked").default(0).notNull(),
  maxPoolSize: real("max_pool_size"),
  rewardTokenType: varchar("reward_token_type").default("OXY").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userStakes = pgTable("user_stakes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  poolId: integer("pool_id").references(() => stakingPools.id).notNull(),
  amount: real("amount").notNull(),
  rewardsEarned: real("rewards_earned").default(0).notNull(),
  stakedAt: timestamp("staked_at").defaultNow().notNull(),
  unstakedAt: timestamp("unstaked_at"),
  lockupEndsAt: timestamp("lockup_ends_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastRewardClaim: timestamp("last_reward_claim"),
});

// Token economics and conversion rates
export const tokenEconomics = pgTable("token_economics", {
  id: serial("id").primaryKey(),
  pointsPerToken: real("points_per_token").default(10).notNull(), // 10 points = 1 OXY token
  dailyTokenSupply: real("daily_token_supply").default(1000).notNull(),
  totalSupplyCap: real("total_supply_cap").default(100000000).notNull(), // 100M tokens max
  circulatingSupply: real("circulating_supply").default(0).notNull(),
  treasuryReserve: real("treasury_reserve").default(10000000).notNull(), // 10M for treasury
  stakingRewardPool: real("staking_reward_pool").default(5000000).notNull(), // 5M for staking
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// NFT achievements system
export const nftAchievements = pgTable("nft_achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  requirement: text("requirement"), // JSON describing achievement criteria
  tokenId: varchar("token_id"), // NFT token ID on blockchain
  contractAddress: varchar("contract_address"), // NFT contract address
  rarity: varchar("rarity").default("common").notNull(), // common, rare, epic, legendary
  totalMinted: integer("total_minted").default(0).notNull(),
  maxSupply: integer("max_supply"), // null = unlimited
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userNfts = pgTable("user_nfts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => nftAchievements.id).notNull(),
  tokenId: varchar("token_id").notNull(),
  mintTxHash: varchar("mint_tx_hash"), // Blockchain transaction hash
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Additional NFT metadata
});

// Anti-fraud and security system
export const fraudDetection = pgTable("fraud_detection", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type").notNull(), // litter_photo, token_claim, location_check
  riskScore: real("risk_score").notNull(), // 0-1 scale
  riskFactors: jsonb("risk_factors"), // Details about risk factors
  gpsCoordinates: jsonb("gps_coordinates"), // Location verification
  deviceFingerprint: text("device_fingerprint"),
  ipAddress: varchar("ip_address"),
  status: varchar("status").default("pending").notNull(), // pending, approved, flagged, rejected
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Anonymous strike system for duplicate/fraud detection without user identity
export const anonymousStrikes = pgTable("anonymous_strikes", {
  id: serial("id").primaryKey(),
  anonymousId: varchar("anonymous_id").notNull(), // Hash-based anonymous identifier
  strikeCount: integer("strike_count").default(0).notNull(),
  reason: text("reason"), // Reason for strikes (duplicate, fraud, inappropriate)
  lastStrikeAt: timestamp("last_strike_at").defaultNow().notNull(),
  bannedAt: timestamp("banned_at"), // When user was banned (5 strikes)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ZK Privacy Layer Tables
export const zkProofs = pgTable("zk_proofs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  proofType: varchar("proof_type").notNull(), // location_verification, duplicate_check, reputation_proof, reward_claim
  proof: jsonb("proof").notNull(), // ZK proof data
  publicSignals: jsonb("public_signals").notNull(), // Public inputs/outputs
  verificationKey: text("verification_key").notNull(), // Circuit verification key
  nullifierHash: varchar("nullifier_hash"), // Prevents double-spending/claiming
  commitment: varchar("commitment"), // Commitment to private data
  isVerified: boolean("is_verified").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  relatedEntityId: integer("related_entity_id"), // Links to litter_items, token_transactions, etc.
  relatedEntityType: varchar("related_entity_type"), // "litter_item", "token_transaction", etc.
  metadata: jsonb("metadata"), // Additional proof metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Anonymous identity commitments for privacy-preserving reputation
export const anonymousCommitments = pgTable("anonymous_commitments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  commitment: varchar("commitment").notNull().unique(), // Hash commitment to user identity
  nullifier: varchar("nullifier").notNull().unique(), // Prevents double-use
  merkleRoot: varchar("merkle_root").notNull(), // Merkle tree root for membership proof
  leafIndex: integer("leaf_index").notNull(), // Position in merkle tree
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Private transaction pool for ZK token transfers
export const privateTransactions = pgTable("private_transactions", {
  id: serial("id").primaryKey(),
  nullifierHash: varchar("nullifier_hash").notNull().unique(), // Prevents double-spending
  commitmentHash: varchar("commitment_hash").notNull(), // New commitment
  proof: jsonb("proof").notNull(), // ZK proof for transaction validity
  encryptedAmount: text("encrypted_amount"), // Encrypted transaction amount
  encryptedMemo: text("encrypted_memo"), // Encrypted transaction memo
  shieldedPool: varchar("shielded_pool").default("OXY_POOL").notNull(), // Which token pool
  blockHeight: integer("block_height"), // Block when transaction was mined
  status: varchar("status").default("pending").notNull(), // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Governance system for token holders
export const governanceProposals = pgTable("governance_proposals", {
  id: serial("id").primaryKey(),
  proposerId: varchar("proposer_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  proposalType: varchar("proposal_type").notNull(), // feature, economic, governance
  votingStartsAt: timestamp("voting_starts_at").notNull(),
  votingEndsAt: timestamp("voting_ends_at").notNull(),
  minTokensToVote: real("min_tokens_to_vote").default(100).notNull(),
  status: varchar("status").default("draft").notNull(), // draft, active, passed, rejected, executed
  yesVotes: real("yes_votes").default(0).notNull(),
  noVotes: real("no_votes").default(0).notNull(),
  totalParticipants: integer("total_participants").default(0).notNull(),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const governanceVotes = pgTable("governance_votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => governanceProposals.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  vote: varchar("vote").notNull(), // yes, no, abstain
  tokenWeight: real("token_weight").notNull(), // Voting power based on token holdings
  votedAt: timestamp("voted_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserProposal: unique().on(table.proposalId, table.userId),
}));

// Environmental data marketplace
export const dataMarketplace = pgTable("data_marketplace", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  dataType: varchar("data_type").notNull(), // cleanup_session, litter_density, environmental_impact
  title: varchar("title").notNull(),
  description: text("description"),
  datasetSize: integer("dataset_size"), // Number of data points
  price: real("price").notNull(), // Price in OXY tokens
  licenseType: varchar("license_type").default("single_use").notNull(),
  geographicArea: jsonb("geographic_area"), // Coordinates/region covered
  dataQualityScore: real("data_quality_score"),
  verificationStatus: varchar("verification_status").default("pending").notNull(),
  totalSales: integer("total_sales").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dataPurchases = pgTable("data_purchases", {
  id: serial("id").primaryKey(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  marketplaceId: integer("marketplace_id").references(() => dataMarketplace.id).notNull(),
  price: real("price").notNull(),
  transactionHash: varchar("transaction_hash"),
  accessToken: varchar("access_token").notNull(), // Token to access purchased data
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // For time-limited licenses
});

// Insert schemas for new tables
export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertStakingPoolSchema = createInsertSchema(stakingPools).omit({
  id: true,
  createdAt: true,
  totalStaked: true,
});

export const insertUserStakeSchema = createInsertSchema(userStakes).omit({
  id: true,
  stakedAt: true,
  rewardsEarned: true,
});

export const insertTokenEconomicsSchema = createInsertSchema(tokenEconomics).omit({
  id: true,
  lastUpdated: true,
});

export const insertNftAchievementSchema = createInsertSchema(nftAchievements).omit({
  id: true,
  createdAt: true,
  totalMinted: true,
});

export const insertUserNftSchema = createInsertSchema(userNfts).omit({
  id: true,
  earnedAt: true,
});

export const insertFraudDetectionSchema = createInsertSchema(fraudDetection).omit({
  id: true,
  createdAt: true,
});

export const insertAnonymousStrikesSchema = createInsertSchema(anonymousStrikes).omit({
  id: true,
  createdAt: true,
  lastStrikeAt: true,
});

export const insertGovernanceProposalSchema = createInsertSchema(governanceProposals).omit({
  id: true,
  createdAt: true,
  yesVotes: true,
  noVotes: true,
  totalParticipants: true,
});

export const insertGovernanceVoteSchema = createInsertSchema(governanceVotes).omit({
  id: true,
  votedAt: true,
});

export const insertDataMarketplaceSchema = createInsertSchema(dataMarketplace).omit({
  id: true,
  createdAt: true,
  totalSales: true,
});

export const insertDataPurchaseSchema = createInsertSchema(dataPurchases).omit({
  id: true,
  purchasedAt: true,
});

// Anonymous picks schemas for Privacy First Challenge
export const insertAnonymousPickSchema = createInsertSchema(anonymousPicks).omit({
  id: true,
  submittedAt: true,
});

export const insertAnonymousRewardSchema = createInsertSchema(anonymousRewards).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});

// ZK Privacy Layer insert schemas
export const insertZkProofSchema = createInsertSchema(zkProofs).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
  isVerified: true,
});

export const insertAnonymousCommitmentSchema = createInsertSchema(anonymousCommitments).omit({
  id: true,
  createdAt: true,
});

export const insertPrivateTransactionSchema = createInsertSchema(privateTransactions).omit({
  id: true,
  createdAt: true,
});

// Type exports for new tables
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertStakingPool = z.infer<typeof insertStakingPoolSchema>;
export type StakingPool = typeof stakingPools.$inferSelect;
export type InsertUserStake = z.infer<typeof insertUserStakeSchema>;
export type UserStake = typeof userStakes.$inferSelect;
export type InsertTokenEconomics = z.infer<typeof insertTokenEconomicsSchema>;
export type TokenEconomics = typeof tokenEconomics.$inferSelect;
export type InsertNftAchievement = z.infer<typeof insertNftAchievementSchema>;
export type NftAchievement = typeof nftAchievements.$inferSelect;
export type InsertUserNft = z.infer<typeof insertUserNftSchema>;
export type UserNft = typeof userNfts.$inferSelect;
export type InsertFraudDetection = z.infer<typeof insertFraudDetectionSchema>;
export type FraudDetection = typeof fraudDetection.$inferSelect;
export type InsertAnonymousStrikes = z.infer<typeof insertAnonymousStrikesSchema>;
export type AnonymousStrikes = typeof anonymousStrikes.$inferSelect;
export type InsertGovernanceProposal = z.infer<typeof insertGovernanceProposalSchema>;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceVote = z.infer<typeof insertGovernanceVoteSchema>;
export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type InsertDataMarketplace = z.infer<typeof insertDataMarketplaceSchema>;
export type DataMarketplace = typeof dataMarketplace.$inferSelect;
export type InsertDataPurchase = z.infer<typeof insertDataPurchaseSchema>;
export type DataPurchase = typeof dataPurchases.$inferSelect;

// ZK Privacy Layer types
export type InsertZkProof = z.infer<typeof insertZkProofSchema>;
export type ZkProof = typeof zkProofs.$inferSelect;
export type InsertAnonymousCommitment = z.infer<typeof insertAnonymousCommitmentSchema>;
export type AnonymousCommitment = typeof anonymousCommitments.$inferSelect;
export type InsertPrivateTransaction = z.infer<typeof insertPrivateTransactionSchema>;
export type PrivateTransaction = typeof privateTransactions.$inferSelect;

// Privacy First Challenge types  
export type InsertAnonymousPick = z.infer<typeof insertAnonymousPickSchema>;
export type AnonymousPick = typeof anonymousPicks.$inferSelect;
export type InsertAnonymousReward = z.infer<typeof insertAnonymousRewardSchema>;
export type AnonymousReward = typeof anonymousRewards.$inferSelect;
