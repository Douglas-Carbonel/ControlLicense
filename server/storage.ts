import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { licenses, activities, users, type License, type InsertLicense, type Activity, type InsertActivity, type User, type InsertUser } from "@shared/schema";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // License operations
  getLicenses(): Promise<License[]>;
  getLicense(id: number): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, license: Partial<InsertLicense>): Promise<License>;
  deleteLicense(id: number): Promise<void>;

  // License statistics
  getLicenseStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalLicenseCount: number;
  }>;

  // Activity operations
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
}

export class DbStorage implements IStorage {
  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.id));
  }

  async getLicense(id: number): Promise<License | undefined> {
    const result = await db.select().from(licenses).where(eq(licenses.id, id));
    return result[0];
  }

  async createLicense(license: InsertLicense): Promise<License> {
    const result = await db.insert(licenses).values(license).returning();
    return result[0];
  }

  async updateLicense(id: number, license: Partial<InsertLicense>): Promise<License> {
    const result = await db
      .update(licenses)
      .set(license)
      .where(eq(licenses.id, id))
      .returning();
    return result[0];
  }

  async deleteLicense(id: number): Promise<void> {
    await db.delete(licenses).where(eq(licenses.id, id));
  }

  async getLicenseStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalLicenseCount: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(licenses);
    const [activeResult] = await db
      .select({ count: count() })
      .from(licenses)
      .where(eq(licenses.ativo, true));
    const [inactiveResult] = await db
      .select({ count: count() })
      .from(licenses)
      .where(eq(licenses.ativo, false));

    // Sum all license quantities
    const [licenseCountResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${licenses.qtLicencas}), 0)` 
      })
      .from(licenses);

    return {
      total: totalResult.count,
      active: activeResult.count,
      inactive: inactiveResult.count,
      totalLicenseCount: licenseCountResult.total,
    };
  }

  async getActivities(limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
    return result[0];
  }

  // Métodos para usuários
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(data: InsertUser): Promise<User> {
    const created = await db
      .insert(users)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created[0];
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const updated = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated[0]) {
      throw new Error("User not found");
    }

    return updated[0];
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DbStorage();