import { imeiSearches, apiKeys, policyAcceptances, type ImeiSearch, type InsertImeiSearch, type ApiKey, type InsertApiKey, type PolicyAcceptance, type InsertPolicyAcceptance, users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // IMEI searches
  createImeiSearch(search: InsertImeiSearch): Promise<ImeiSearch>;
  getImeiSearches(limit?: number): Promise<ImeiSearch[]>;
  getImeiSearchById(id: number): Promise<ImeiSearch | undefined>;
  getSearchStatistics(): Promise<{
    totalSearches: number;
    uniqueDevices: number;
    successRate: number;
  }>;
  getPopularDevices(limit?: number): Promise<Array<{
    deviceMake: string;
    deviceModel: string;
    searchCount: number;
  }>>;
  getSearchesByLocation(): Promise<Array<{
    location: string;
    searchCount: number;
  }>>;
  
  // API Keys
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  incrementApiKeyUsage(keyHash: string): Promise<void>;
  
  // Policy Acceptances
  createPolicyAcceptance(acceptance: InsertPolicyAcceptance): Promise<PolicyAcceptance>;
  getPolicyAcceptancesBySearch(searchId: number): Promise<PolicyAcceptance[]>;
  getPolicyComplianceStats(): Promise<{
    totalAcceptances: number;
    acceptanceRate: number;
    recentAcceptances: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createImeiSearch(search: InsertImeiSearch): Promise<ImeiSearch> {
    const [result] = await db
      .insert(imeiSearches)
      .values(search)
      .returning();
    return result;
  }

  async getImeiSearches(limit = 100): Promise<ImeiSearch[]> {
    return await db
      .select()
      .from(imeiSearches)
      .orderBy(desc(imeiSearches.searchedAt))
      .limit(limit);
  }

  async getImeiSearchById(id: number): Promise<ImeiSearch | undefined> {
    const [search] = await db
      .select()
      .from(imeiSearches)
      .where(eq(imeiSearches.id, id));
    return search || undefined;
  }

  async getSearchStatistics(): Promise<{
    totalSearches: number;
    uniqueDevices: number;
    successRate: number;
  }> {
    const [totalSearchesResult] = await db
      .select({ count: count() })
      .from(imeiSearches);

    const [uniqueDevicesResult] = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT CONCAT(device_make, ' ', device_model))` 
      })
      .from(imeiSearches)
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL`);

    const [successfulSearchesResult] = await db
      .select({ count: count() })
      .from(imeiSearches)
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL`);

    const totalSearches = totalSearchesResult.count;
    const uniqueDevices = uniqueDevicesResult.count;
    const successfulSearches = successfulSearchesResult.count;
    const successRate = totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0;

    return {
      totalSearches,
      uniqueDevices,
      successRate: Math.round(successRate * 10) / 10
    };
  }

  async getPopularDevices(limit = 10): Promise<Array<{
    deviceMake: string;
    deviceModel: string;
    searchCount: number;
  }>> {
    return await db
      .select({
        deviceMake: imeiSearches.deviceMake,
        deviceModel: imeiSearches.deviceModel,
        searchCount: count()
      })
      .from(imeiSearches)
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL`)
      .groupBy(imeiSearches.deviceMake, imeiSearches.deviceModel)
      .orderBy(desc(count()))
      .limit(limit) as Array<{
        deviceMake: string;
        deviceModel: string;
        searchCount: number;
      }>;
  }

  async getSearchesByLocation(): Promise<Array<{
    location: string;
    searchCount: number;
  }>> {
    return await db
      .select({
        location: imeiSearches.searchLocation,
        searchCount: count()
      })
      .from(imeiSearches)
      .where(sql`search_location IS NOT NULL`)
      .groupBy(imeiSearches.searchLocation)
      .orderBy(desc(count()))
      .limit(10) as Array<{
        location: string;
        searchCount: number;
      }>;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [result] = await db
      .insert(apiKeys)
      .values(apiKey)
      .returning();
    return result;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash));
    return apiKey || undefined;
  }

  async incrementApiKeyUsage(keyHash: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        requestCount: sql`${apiKeys.requestCount} + 1`,
        lastUsed: new Date()
      })
      .where(eq(apiKeys.keyHash, keyHash));
  }

  async createPolicyAcceptance(acceptance: InsertPolicyAcceptance): Promise<PolicyAcceptance> {
    const [result] = await db
      .insert(policyAcceptances)
      .values({
        searchId: acceptance.searchId || null,
        ipAddress: acceptance.ipAddress,
        userAgent: acceptance.userAgent || null,
        policyVersion: acceptance.policyVersion || "v1.0",
        accepted: acceptance.accepted,
        deviceInfo: acceptance.deviceInfo as any || null,
      })
      .returning();
    return result;
  }

  async getPolicyAcceptancesBySearch(searchId: number): Promise<PolicyAcceptance[]> {
    return await db
      .select()
      .from(policyAcceptances)
      .where(eq(policyAcceptances.searchId, searchId))
      .orderBy(desc(policyAcceptances.acceptedAt));
  }

  async getPolicyComplianceStats(): Promise<{
    totalAcceptances: number;
    acceptanceRate: number;
    recentAcceptances: number;
  }> {
    const totalAcceptancesResult = await db
      .select({ count: count() })
      .from(policyAcceptances);

    const acceptedResult = await db
      .select({ count: count() })
      .from(policyAcceptances)
      .where(eq(policyAcceptances.accepted, true));

    const recentAcceptancesResult = await db
      .select({ count: count() })
      .from(policyAcceptances)
      .where(sql`accepted_at >= NOW() - INTERVAL '30 days'`);

    const totalAcceptances = totalAcceptancesResult[0]?.count || 0;
    const acceptedCount = acceptedResult[0]?.count || 0;
    const recentAcceptances = recentAcceptancesResult[0]?.count || 0;
    const acceptanceRate = totalAcceptances > 0 ? (acceptedCount / totalAcceptances) * 100 : 0;

    return {
      totalAcceptances,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      recentAcceptances
    };
  }
}

export const storage = new DatabaseStorage();
