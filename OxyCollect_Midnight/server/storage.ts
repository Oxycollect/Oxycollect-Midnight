import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, count, sql } from "drizzle-orm";
import { 
  users, 
  litterItems, 
  anonymousPicks, 
  anonymousStrikes,
  type User,
  type LitterItem,
  type InsertUser,
  type InsertLitterItem,
  type InsertAnonymousPick
} from "../shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool);

export class Storage {
  // User operations (minimal - admin only)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Litter item operations
  async createLitterItem(itemData: InsertLitterItem): Promise<LitterItem> {
    const [item] = await db.insert(litterItems).values(itemData).returning();
    return item;
  }

  async getLitterItems(limit: number = 100): Promise<LitterItem[]> {
    return await db
      .select()
      .from(litterItems)
      .orderBy(desc(litterItems.createdAt))
      .limit(limit);
  }

  async getLitterItem(id: number): Promise<LitterItem | undefined> {
    const [item] = await db.select().from(litterItems).where(eq(litterItems.id, id));
    return item;
  }

  async updateLitterItem(id: number, updates: Partial<InsertLitterItem>): Promise<LitterItem | undefined> {
    const [item] = await db
      .update(litterItems)
      .set(updates)
      .where(eq(litterItems.id, id))
      .returning();
    return item;
  }

  async deleteLitterItem(id: number): Promise<boolean> {
    const result = await db.delete(litterItems).where(eq(litterItems.id, id));
    return result.rowCount > 0;
  }

  // Anonymous picks operations  
  async createAnonymousPick(pickData: InsertAnonymousPick) {
    const [pick] = await db.insert(anonymousPicks).values(pickData).returning();
    return pick;
  }

  async getAnonymousPicksForMap() {
    return await db
      .select({
        id: anonymousPicks.id,
        classification: anonymousPicks.classification,
        locationRange: anonymousPicks.locationRange,
        points: anonymousPicks.points,
        createdAt: anonymousPicks.createdAt,
      })
      .from(anonymousPicks)
      .orderBy(desc(anonymousPicks.createdAt))
      .limit(1000);
  }

  // Anonymous strikes operations
  async getStrikesForCommitment(commitment: string) {
    const [strike] = await db
      .select()
      .from(anonymousStrikes)
      .where(eq(anonymousStrikes.anonymousCommitment, commitment));
    return strike;
  }

  async addStrike(commitment: string, reason: string, adminId?: string) {
    const existing = await this.getStrikesForCommitment(commitment);
    
    if (existing) {
      const newCount = existing.strikeCount + 1;
      const isBanned = newCount >= 5;
      
      const [updated] = await db
        .update(anonymousStrikes)
        .set({
          strikeCount: newCount,
          bannedAt: isBanned ? new Date() : existing.bannedAt,
          reason: reason,
        })
        .where(eq(anonymousStrikes.anonymousCommitment, commitment))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(anonymousStrikes)
        .values({
          anonymousCommitment: commitment,
          reason,
          strikeCount: 1,
          adminId,
        })
        .returning();
      
      return created;
    }
  }

  // Admin statistics
  async getAdminStats() {
    const [itemCount] = await db.select({ count: count() }).from(litterItems);
    const [pickCount] = await db.select({ count: count() }).from(anonymousPicks);
    const [userCount] = await db.select({ count: count() }).from(users);
    
    return {
      totalItems: itemCount.count,
      totalAnonymousPicks: pickCount.count,
      totalUsers: userCount.count,
    };
  }
}

export const storage = new Storage();