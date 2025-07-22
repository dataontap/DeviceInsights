import { imeiSearches, apiKeys, type ImeiSearch, type InsertImeiSearch, type ApiKey, type InsertApiKey, users, type User, type InsertUser } from "@shared/schema";
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
}

export const storage = new DatabaseStorage();
