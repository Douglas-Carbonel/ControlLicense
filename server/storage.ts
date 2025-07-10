import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { licenses, activities, type License, type InsertLicense, type Activity, type InsertActivity } from "@shared/schema";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = neon(connectionString);
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
      .from(licenses)
      .where(eq(licenses.ativo, true));

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
}

export const storage = new DbStorage();
