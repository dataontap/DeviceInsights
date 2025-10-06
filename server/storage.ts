import { imeiSearches, apiKeys, policyAcceptances, blacklistedImeis, carrierCache, voiceCache, loginTokens, adminSessions, adminUsers, registeredUsers, connectivityMetrics, emailReports, connectivityAlerts, apiUsageTracking, adminNotifications, type ImeiSearch, type InsertImeiSearch, type ApiKey, type InsertApiKey, type PolicyAcceptance, type InsertPolicyAcceptance, type BlacklistedImei, type InsertBlacklistedImei, type VoiceCache, type InsertVoiceCache, users, type User, type InsertUser, type LoginToken, type InsertLoginToken, type AdminSession, type InsertAdminSession, type AdminUser, type InsertAdminUser, type RegisteredUser, type InsertRegisteredUser, type ConnectivityMetric, type InsertConnectivityMetric, type EmailReport, type InsertEmailReport, type ConnectivityAlert, type InsertConnectivityAlert, type ApiUsageTracking, type InsertApiUsageTracking, type AdminNotification, type InsertAdminNotification } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // IMEI searches
  createImeiSearch(search: InsertImeiSearch): Promise<ImeiSearch>;
  getImeiSearches(limit?: number): Promise<ImeiSearch[]>;
  getRecentValidSearches(limit?: number): Promise<ImeiSearch[]>;
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
  isPopularDevice(deviceMake: string, deviceModel: string): Promise<boolean>;
  getSearchesByLocation(): Promise<Array<{
    location: string;
    searchCount: number;
  }>>;
  
  // API key specific methods
  getImeiSearchesByApiKey(apiKeyId: number, limit?: number): Promise<ImeiSearch[]>;
  getImeiSearchByIdAndApiKey(id: number, apiKeyId: number): Promise<ImeiSearch | undefined>;
  getSearchStatisticsByApiKey(apiKeyId: number): Promise<{
    totalSearches: number;
    uniqueDevices: number;
    successRate: number;
  }>;
  getPopularDevicesByApiKey(apiKeyId: number, limit?: number): Promise<Array<{
    deviceMake: string;
    deviceModel: string;
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
  
  // Blacklisted IMEIs
  isImeiBlacklisted(imei: string): Promise<BlacklistedImei | null>;
  addBlacklistedImei(blacklistedImei: InsertBlacklistedImei): Promise<BlacklistedImei>;
  removeBlacklistedImei(imei: string): Promise<void>;
  getBlacklistedImeis(): Promise<BlacklistedImei[]>;
  
  // Carrier Cache
  getCachedCarriers(country: string): Promise<{
    country: string;
    carriers: Array<{
      name: string;
      marketShare: string;
      description: string;
    }>;
  } | null>;
  setCachedCarriers(country: string, carriersData: {
    country: string;
    carriers: Array<{
      name: string;
      marketShare: string;
      description: string;
    }>;
  }, hoursToExpire?: number): Promise<void>;

  // Voice Cache
  getCachedVoiceAudio(cacheKey: string): Promise<VoiceCache | null>;
  setCachedVoiceAudio(
    cacheKey: string,
    language: string,
    voiceCount: number,
    locationHash: string,
    conversation?: Array<{
      index: number;
      audio: string;
      message: any;
    }>,
    singleAudio?: {
      audio: string;
      text: string;
      voice: any;
    },
    hoursToExpire?: number
  ): Promise<void>;
  generateVoiceCacheKey(language: string, voiceCount: number, locationHash?: string): string;
  
  // Login Tokens & Admin Sessions
  createLoginToken(token: InsertLoginToken): Promise<LoginToken>;
  getLoginTokenByToken(token: string): Promise<LoginToken | undefined>;
  useLoginToken(token: string): Promise<void>;
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSessionByToken(sessionToken: string): Promise<AdminSession | undefined>;
  deleteAdminSession(sessionToken: string): Promise<void>;
  getApiKeyByEmail(email: string): Promise<ApiKey | undefined>;
  
  // Admin User Management
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUserById(id: number): Promise<AdminUser | undefined>;
  updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  isAdminUser(email: string): Promise<boolean>;
  updateAdminLastLogin(email: string): Promise<void>;
  
  // User Registration & Management
  createRegisteredUser(user: InsertRegisteredUser): Promise<RegisteredUser>;
  getRegisteredUserByEmail(email: string): Promise<RegisteredUser | undefined>;
  getRegisteredUserById(id: number): Promise<RegisteredUser | undefined>;
  updateRegisteredUser(id: number, updates: Partial<InsertRegisteredUser>): Promise<RegisteredUser>;
  updateUserEmailPreferences(id: number, preferences: any): Promise<void>;
  getActiveUsers(): Promise<RegisteredUser[]>;
  
  // Connectivity Monitoring
  recordConnectivityMetric(metric: InsertConnectivityMetric): Promise<ConnectivityMetric>;
  getUserConnectivityMetrics(userId: number, limit?: number): Promise<ConnectivityMetric[]>;
  getConnectivityMetricsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ConnectivityMetric[]>;
  getConnectivityInterruptions(userId: number, limit?: number): Promise<ConnectivityMetric[]>;
  getAverageConnectivityStats(userId: number, days?: number): Promise<{
    averageDownloadSpeed: number;
    averageUploadSpeed: number;
    averageLatency: number;
    totalInterruptions: number;
    totalDowntime: number;
    connectionQualityScore: number;
  }>;
  
  // Email Reports & Insights
  createEmailReport(report: InsertEmailReport): Promise<EmailReport>;
  getEmailReportsByUser(userId: number): Promise<EmailReport[]>;
  getPendingMonthlyReports(): Promise<Array<{ user: RegisteredUser; lastReport?: EmailReport }>>;
  markEmailReportSent(reportId: number): Promise<void>;
  
  // Connectivity Alerts
  createConnectivityAlert(alert: InsertConnectivityAlert): Promise<ConnectivityAlert>;
  getUserAlerts(userId: number, unreadOnly?: boolean): Promise<ConnectivityAlert[]>;
  markAlertAsRead(alertId: number): Promise<void>;
  markAlertAsResolved(alertId: number): Promise<void>;
  getUnreadAlertCount(userId: number): Promise<number>;
  
  // API Usage Tracking & Rate Limiting
  recordApiUsage(usage: InsertApiUsageTracking): Promise<ApiUsageTracking>;
  getApiUsageByKey(apiKeyId: number, hours?: number): Promise<ApiUsageTracking[]>;
  getApiUsageCount(apiKeyId: number, hours?: number): Promise<number>;
  getApiUsageStats(apiKeyId: number): Promise<{
    totalRequests: number;
    requestsLastHour: number;
    requestsLastDay: number;
    rateLimitViolations: number;
    averageResponseTime: number;
  }>;
  
  // Admin Notifications
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getAdminNotifications(unreadOnly?: boolean): Promise<AdminNotification[]>;
  markAdminNotificationRead(notificationId: number): Promise<void>;
  getUnreadAdminNotificationCount(): Promise<number>;
  
  // Analytics Methods for Demo
  getTotalSearchCount(): Promise<number>;
  getTotalUserCount(): Promise<number>;
  getTotalApiKeyCount(): Promise<number>;
  getDeviceTypeStats(): Promise<Array<{ type: string; count: number }>>;
  getLocationStatsAnonymized(): Promise<Array<{ city: string; state: string; country: string; searches: number }>>;
  getPopularDevicesAnalytics(): Promise<Array<{ brand: string; model: string; searches: number }>>;
  getCompatibilityStats(): Promise<{ compatible: number; incompatible: number; unknown: number }>;
  getApiUsageStatsPublic(): Promise<Array<{ apiKeyName: string; totalRequests: number; requestsLastHour: number; rateLimitViolations: number }>>;
  getRecentActivitySanitized(): Promise<Array<{ timestamp: string; action: string; details: string; location: string }>>;
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

  async getRecentValidSearches(limit = 50): Promise<ImeiSearch[]> {
    return await db
      .select()
      .from(imeiSearches)
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL AND device_make != 'Unknown' AND device_model != 'Unknown' AND device_model NOT LIKE '%Unknown%'`)
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
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL AND device_make != 'Unknown' AND device_model != 'Unknown' AND device_model NOT LIKE '%Unknown%'`)
      .groupBy(imeiSearches.deviceMake, imeiSearches.deviceModel)
      .orderBy(desc(count()))
      .limit(limit) as Array<{
        deviceMake: string;
        deviceModel: string;
        searchCount: number;
      }>;
  }

  async isPopularDevice(deviceMake: string, deviceModel: string): Promise<boolean> {
    const popularDevices = await this.getPopularDevices(20); // Check top 20 popular devices
    return popularDevices.some(device => 
      device.deviceMake?.toLowerCase() === deviceMake?.toLowerCase() && 
      device.deviceModel?.toLowerCase() === deviceModel?.toLowerCase()
    );
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

  async isImeiBlacklisted(imei: string): Promise<BlacklistedImei | null> {
    const [result] = await db
      .select()
      .from(blacklistedImeis)
      .where(and(
        eq(blacklistedImeis.imei, imei),
        eq(blacklistedImeis.isActive, true)
      ));
    return result || null;
  }

  async addBlacklistedImei(blacklistedImei: InsertBlacklistedImei): Promise<BlacklistedImei> {
    const [result] = await db
      .insert(blacklistedImeis)
      .values(blacklistedImei)
      .returning();
    return result;
  }

  async removeBlacklistedImei(imei: string): Promise<void> {
    await db
      .update(blacklistedImeis)
      .set({ isActive: false })
      .where(eq(blacklistedImeis.imei, imei));
  }

  async getBlacklistedImeis(): Promise<BlacklistedImei[]> {
    return await db
      .select()
      .from(blacklistedImeis)
      .where(eq(blacklistedImeis.isActive, true))
      .orderBy(desc(blacklistedImeis.blacklistedAt));
  }

  async getCachedCarriers(country: string): Promise<{
    country: string;
    carriers: Array<{
      name: string;
      marketShare: string;
      description: string;
    }>;
  } | null> {
    const [result] = await db
      .select()
      .from(carrierCache)
      .where(and(
        eq(carrierCache.country, country),
        sql`expires_at > NOW()`
      ));
    
    return result?.carriersData || null;
  }

  async setCachedCarriers(
    country: string, 
    carriersData: {
      country: string;
      carriers: Array<{
        name: string;
        marketShare: string;
        description: string;
      }>;
    }, 
    hoursToExpire: number = 24
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hoursToExpire);

      console.log(`Caching carriers for country: ${country}`);

      // Check if entry exists first
      const [existing] = await db
        .select()
        .from(carrierCache)
        .where(eq(carrierCache.country, country));

      if (existing) {
        // Update existing entry
        await db
          .update(carrierCache)
          .set({
            carriersData,
            cachedAt: new Date(),
            expiresAt
          })
          .where(eq(carrierCache.country, country));
        console.log(`Updated cache for country: ${country}`);
      } else {
        // Insert new entry
        await db
          .insert(carrierCache)
          .values({
            country,
            carriersData,
            expiresAt
          });
        console.log(`Inserted new cache entry for country: ${country}`);
      }
    } catch (error) {
      console.error(`Error caching carriers for ${country}:`, error);
      throw error;
    }
  }

  // Voice Cache implementation
  async getCachedVoiceAudio(cacheKey: string): Promise<VoiceCache | null> {
    const [result] = await db
      .select()
      .from(voiceCache)
      .where(and(
        eq(voiceCache.cacheKey, cacheKey),
        sql`expires_at > NOW()`
      ));
    
    return result || null;
  }

  async setCachedVoiceAudio(
    cacheKey: string,
    language: string,
    voiceCount: number,
    locationHash: string,
    conversation?: Array<{
      index: number;
      audio: string;
      message: any;
    }>,
    singleAudio?: {
      audio: string;
      text: string;
      voice: any;
    },
    hoursToExpire: number = 2
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hoursToExpire);

      console.log(`Caching voice audio with key: ${cacheKey}`);

      // Check if entry exists first
      const [existing] = await db
        .select()
        .from(voiceCache)
        .where(eq(voiceCache.cacheKey, cacheKey));

      if (existing) {
        // Update existing entry
        await db
          .update(voiceCache)
          .set({
            language,
            voiceCount,
            locationHash,
            conversation,
            singleAudio,
            cachedAt: new Date(),
            expiresAt
          })
          .where(eq(voiceCache.cacheKey, cacheKey));
        console.log(`Updated voice cache for key: ${cacheKey}`);
      } else {
        // Insert new entry
        await db
          .insert(voiceCache)
          .values({
            cacheKey,
            language,
            voiceCount,
            locationHash,
            conversation,
            singleAudio,
            expiresAt
          });
        console.log(`Inserted new voice cache entry for key: ${cacheKey}`);
      }
    } catch (error) {
      console.error(`Error caching voice audio for ${cacheKey}:`, error);
      throw error;
    }
  }

  generateVoiceCacheKey(language: string, voiceCount: number, locationHash?: string): string {
    const location = locationHash || 'default';
    return `voice_${language}_${voiceCount}_${location}`;
  }

  // API Key specific isolation methods
  async getImeiSearchesByApiKey(apiKeyId: number, limit = 100): Promise<ImeiSearch[]> {
    return await db
      .select()
      .from(imeiSearches)
      .where(eq(imeiSearches.apiKeyId, apiKeyId))
      .orderBy(desc(imeiSearches.searchedAt))
      .limit(limit);
  }

  async getImeiSearchByIdAndApiKey(id: number, apiKeyId: number): Promise<ImeiSearch | undefined> {
    const [search] = await db
      .select()
      .from(imeiSearches)
      .where(and(
        eq(imeiSearches.id, id),
        eq(imeiSearches.apiKeyId, apiKeyId)
      ));
    return search || undefined;
  }

  async getSearchStatisticsByApiKey(apiKeyId: number): Promise<{
    totalSearches: number;
    uniqueDevices: number;
    successRate: number;
  }> {
    const [totalSearchesResult] = await db
      .select({ count: count() })
      .from(imeiSearches)
      .where(eq(imeiSearches.apiKeyId, apiKeyId));

    const [uniqueDevicesResult] = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT CONCAT(device_make, ' ', device_model))` 
      })
      .from(imeiSearches)
      .where(and(
        eq(imeiSearches.apiKeyId, apiKeyId),
        sql`device_make IS NOT NULL AND device_model IS NOT NULL`
      ));

    const [successfulSearchesResult] = await db
      .select({ count: count() })
      .from(imeiSearches)
      .where(and(
        eq(imeiSearches.apiKeyId, apiKeyId),
        sql`device_make IS NOT NULL AND device_model IS NOT NULL`
      ));

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

  async getPopularDevicesByApiKey(apiKeyId: number, limit = 10): Promise<Array<{
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
      .where(and(
        eq(imeiSearches.apiKeyId, apiKeyId),
        sql`device_make IS NOT NULL AND device_model IS NOT NULL AND device_make != 'Unknown' AND device_model != 'Unknown' AND device_model NOT LIKE '%Unknown%'`
      ))
      .groupBy(imeiSearches.deviceMake, imeiSearches.deviceModel)
      .orderBy(desc(count()))
      .limit(limit) as Array<{
        deviceMake: string;
        deviceModel: string;
        searchCount: number;
      }>;
  }

  // Login Tokens & Admin Sessions implementation
  async createLoginToken(token: InsertLoginToken): Promise<LoginToken> {
    const [result] = await db
      .insert(loginTokens)
      .values(token)
      .returning();
    return result;
  }

  async getLoginTokenByToken(token: string): Promise<LoginToken | undefined> {
    const [result] = await db
      .select()
      .from(loginTokens)
      .where(and(
        eq(loginTokens.token, token),
        eq(loginTokens.used, false),
        sql`expires_at > NOW()`
      ));
    return result || undefined;
  }

  async useLoginToken(token: string): Promise<void> {
    await db
      .update(loginTokens)
      .set({ used: true })
      .where(eq(loginTokens.token, token));
  }

  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const [result] = await db
      .insert(adminSessions)
      .values(session)
      .returning();
    return result;
  }

  async getAdminSessionByToken(sessionToken: string): Promise<AdminSession | undefined> {
    const [result] = await db
      .select()
      .from(adminSessions)
      .where(and(
        eq(adminSessions.sessionToken, sessionToken),
        sql`expires_at > NOW()`
      ));
    return result || undefined;
  }

  async deleteAdminSession(sessionToken: string): Promise<void> {
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.sessionToken, sessionToken));
  }

  async getApiKeyByEmail(email: string): Promise<ApiKey | undefined> {
    const [result] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.email, email));
    return result || undefined;
  }

  // Admin User Management Implementation
  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [result] = await db
      .insert(adminUsers)
      .values(user)
      .returning();
    return result;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [result] = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.email, email),
        eq(adminUsers.isActive, true)
      ));
    return result || undefined;
  }

  async getAdminUserById(id: number): Promise<AdminUser | undefined> {
    const [result] = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.id, id),
        eq(adminUsers.isActive, true)
      ));
    return result || undefined;
  }

  async updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [result] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return result;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true))
      .orderBy(desc(adminUsers.createdAt));
  }

  async isAdminUser(email: string): Promise<boolean> {
    const admin = await this.getAdminUserByEmail(email);
    return !!admin;
  }

  async updateAdminLastLogin(email: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.email, email));
  }
  
  // User Registration & Management Implementation
  async createRegisteredUser(user: InsertRegisteredUser): Promise<RegisteredUser> {
    const [result] = await db
      .insert(registeredUsers)
      .values([{
        ...user,
        deviceInfo: user.deviceInfo as { primaryDevice?: string; carrier?: string; networkType?: string; } | null
      }])
      .returning();
    return result;
  }

  async getRegisteredUserByEmail(email: string): Promise<RegisteredUser | undefined> {
    const [result] = await db
      .select()
      .from(registeredUsers)
      .where(eq(registeredUsers.email, email));
    return result || undefined;
  }

  async getRegisteredUserById(id: number): Promise<RegisteredUser | undefined> {
    const [result] = await db
      .select()
      .from(registeredUsers)
      .where(eq(registeredUsers.id, id));
    return result || undefined;
  }

  async updateRegisteredUser(id: number, updates: Partial<InsertRegisteredUser>): Promise<RegisteredUser> {
    const [result] = await db
      .update(registeredUsers)
      .set({ 
        ...updates, 
        updatedAt: new Date(),
        deviceInfo: updates.deviceInfo as { primaryDevice?: string; carrier?: string; networkType?: string; } | null | undefined
      })
      .where(eq(registeredUsers.id, id))
      .returning();
    return result;
  }

  async updateUserEmailPreferences(id: number, preferences: any): Promise<void> {
    await db
      .update(registeredUsers)
      .set({ 
        emailPreferences: preferences,
        updatedAt: new Date()
      })
      .where(eq(registeredUsers.id, id));
  }

  async getActiveUsers(): Promise<RegisteredUser[]> {
    return await db
      .select()
      .from(registeredUsers)
      .where(eq(registeredUsers.subscriptionStatus, "active"))
      .orderBy(desc(registeredUsers.lastActiveAt));
  }
  
  // Connectivity Monitoring Implementation
  async recordConnectivityMetric(metric: InsertConnectivityMetric): Promise<ConnectivityMetric> {
    const [result] = await db
      .insert(connectivityMetrics)
      .values([{
        ...metric,
        deviceInfo: metric.deviceInfo as { make?: string; model?: string; os?: string; osVersion?: string; } | null
      }])
      .returning();
    return result;
  }

  async getUserConnectivityMetrics(userId: number, limit = 100): Promise<ConnectivityMetric[]> {
    return await db
      .select()
      .from(connectivityMetrics)
      .where(eq(connectivityMetrics.userId, userId))
      .orderBy(desc(connectivityMetrics.timestamp))
      .limit(limit);
  }

  async getConnectivityMetricsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ConnectivityMetric[]> {
    return await db
      .select()
      .from(connectivityMetrics)
      .where(and(
        eq(connectivityMetrics.userId, userId),
        sql`timestamp >= ${startDate}`,
        sql`timestamp <= ${endDate}`
      ))
      .orderBy(desc(connectivityMetrics.timestamp));
  }

  async getConnectivityInterruptions(userId: number, limit = 50): Promise<ConnectivityMetric[]> {
    return await db
      .select()
      .from(connectivityMetrics)
      .where(and(
        eq(connectivityMetrics.userId, userId),
        eq(connectivityMetrics.isInterruption, true)
      ))
      .orderBy(desc(connectivityMetrics.timestamp))
      .limit(limit);
  }

  async getAverageConnectivityStats(userId: number, days = 30): Promise<{
    averageDownloadSpeed: number;
    averageUploadSpeed: number;
    averageLatency: number;
    totalInterruptions: number;
    totalDowntime: number;
    connectionQualityScore: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await db
      .select()
      .from(connectivityMetrics)
      .where(and(
        eq(connectivityMetrics.userId, userId),
        sql`timestamp >= ${startDate}`
      ));

    if (metrics.length === 0) {
      return {
        averageDownloadSpeed: 0,
        averageUploadSpeed: 0,
        averageLatency: 0,
        totalInterruptions: 0,
        totalDowntime: 0,
        connectionQualityScore: 0
      };
    }

    const validMetrics = metrics.filter(m => m.downloadSpeed && m.uploadSpeed && m.latency);
    const interruptions = metrics.filter(m => m.isInterruption);
    
    const totalDowntime = interruptions.reduce((sum, i) => sum + (i.interruptionDuration || 0), 0);
    
    const avgDownload = validMetrics.length > 0 
      ? validMetrics.reduce((sum, m) => sum + (m.downloadSpeed || 0), 0) / validMetrics.length 
      : 0;
    const avgUpload = validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + (m.uploadSpeed || 0), 0) / validMetrics.length
      : 0;
    const avgLatency = validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + (m.latency || 0), 0) / validMetrics.length
      : 0;
    
    // Simple quality score: based on speed, latency, and interruptions
    const speedScore = Math.min((avgDownload / 25000) * 40, 40); // Up to 40 points for 25Mbps+
    const latencyScore = Math.max(30 - (avgLatency / 10), 0); // Up to 30 points for low latency
    const reliabilityScore = Math.max(30 - (interruptions.length * 2), 0); // Up to 30 points for reliability
    const connectionQualityScore = Math.round(speedScore + latencyScore + reliabilityScore);

    return {
      averageDownloadSpeed: Math.round(avgDownload),
      averageUploadSpeed: Math.round(avgUpload),
      averageLatency: Math.round(avgLatency),
      totalInterruptions: interruptions.length,
      totalDowntime: Math.round(totalDowntime),
      connectionQualityScore: Math.min(connectionQualityScore, 100)
    };
  }
  
  // Email Reports & Insights Implementation
  async createEmailReport(report: InsertEmailReport): Promise<EmailReport> {
    const [result] = await db
      .insert(emailReports)
      .values([{
        ...report,
        reportData: report.reportData as {
          averageDownloadSpeed?: number;
          averageUploadSpeed?: number;
          averageLatency?: number;
          totalInterruptions?: number;
          totalDowntime?: number;
          connectionQualityScore?: number;
          recommendations?: string[];
          comparisonData?: any;
        } | null
      }])
      .returning();
    return result;
  }

  async getEmailReportsByUser(userId: number): Promise<EmailReport[]> {
    return await db
      .select()
      .from(emailReports)
      .where(eq(emailReports.userId, userId))
      .orderBy(desc(emailReports.reportDate));
  }

  async getPendingMonthlyReports(): Promise<Array<{ user: RegisteredUser; lastReport?: EmailReport }>> {
    const activeUsers = await db
      .select()
      .from(registeredUsers)
      .where(and(
        eq(registeredUsers.subscriptionStatus, "active"),
        sql`email_preferences->>'monthlyInsights' = 'true'`
      ));

    const usersWithReports = [];
    
    for (const user of activeUsers) {
      const [lastReport] = await db
        .select()
        .from(emailReports)
        .where(and(
          eq(emailReports.userId, user.id),
          eq(emailReports.reportType, "monthly")
        ))
        .orderBy(desc(emailReports.reportDate))
        .limit(1);
      
      // Check if user needs a monthly report (hasn't received one in the last 25 days)
      const shouldSendReport = !lastReport || 
        (new Date().getTime() - new Date(lastReport.reportDate).getTime()) > (25 * 24 * 60 * 60 * 1000);
      
      if (shouldSendReport) {
        usersWithReports.push({ user, lastReport });
      }
    }
    
    return usersWithReports;
  }

  async markEmailReportSent(reportId: number): Promise<void> {
    await db
      .update(emailReports)
      .set({ 
        emailSent: true, 
        emailSentAt: new Date() 
      })
      .where(eq(emailReports.id, reportId));
  }
  
  // Connectivity Alerts Implementation
  async createConnectivityAlert(alert: InsertConnectivityAlert): Promise<ConnectivityAlert> {
    const [result] = await db
      .insert(connectivityAlerts)
      .values([{
        ...alert,
        alertData: alert.alertData as {
          location?: string;
          carrier?: string;
          duration?: number;
          affectedMetric?: string;
          previousValue?: number;
          currentValue?: number;
        } | null
      }])
      .returning();
    return result;
  }

  async getUserAlerts(userId: number, unreadOnly = false): Promise<ConnectivityAlert[]> {
    const conditions = [eq(connectivityAlerts.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(connectivityAlerts.isRead, false));
    }
    
    return await db
      .select()
      .from(connectivityAlerts)
      .where(and(...conditions))
      .orderBy(desc(connectivityAlerts.createdAt));
  }

  async markAlertAsRead(alertId: number): Promise<void> {
    await db
      .update(connectivityAlerts)
      .set({ isRead: true })
      .where(eq(connectivityAlerts.id, alertId));
  }

  async markAlertAsResolved(alertId: number): Promise<void> {
    await db
      .update(connectivityAlerts)
      .set({ 
        isResolved: true, 
        resolvedAt: new Date() 
      })
      .where(eq(connectivityAlerts.id, alertId));
  }

  async getUnreadAlertCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(connectivityAlerts)
      .where(and(
        eq(connectivityAlerts.userId, userId),
        eq(connectivityAlerts.isRead, false)
      ));
    return result.count;
  }
  
  // API Usage Tracking & Rate Limiting Implementation
  async recordApiUsage(usage: InsertApiUsageTracking): Promise<ApiUsageTracking> {
    const [result] = await db
      .insert(apiUsageTracking)
      .values(usage)
      .returning();
    return result;
  }

  async getApiUsageByKey(apiKeyId: number, hours = 24): Promise<ApiUsageTracking[]> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    return await db
      .select()
      .from(apiUsageTracking)
      .where(and(
        eq(apiUsageTracking.apiKeyId, apiKeyId),
        sql`timestamp >= ${startTime}`
      ))
      .orderBy(desc(apiUsageTracking.timestamp));
  }

  async getApiUsageCount(apiKeyId: number, hours = 1): Promise<number> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    const [result] = await db
      .select({ count: count() })
      .from(apiUsageTracking)
      .where(and(
        eq(apiUsageTracking.apiKeyId, apiKeyId),
        sql`timestamp >= ${startTime}`
      ));
    return result.count;
  }

  async getApiUsageStats(apiKeyId: number): Promise<{
    totalRequests: number;
    requestsLastHour: number;
    requestsLastDay: number;
    rateLimitViolations: number;
    averageResponseTime: number;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(apiUsageTracking)
      .where(eq(apiUsageTracking.apiKeyId, apiKeyId));
    
    const [hourResult] = await db
      .select({ count: count() })
      .from(apiUsageTracking)
      .where(and(
        eq(apiUsageTracking.apiKeyId, apiKeyId),
        sql`timestamp >= ${oneHourAgo}`
      ));
    
    const [dayResult] = await db
      .select({ count: count() })
      .from(apiUsageTracking)
      .where(and(
        eq(apiUsageTracking.apiKeyId, apiKeyId),
        sql`timestamp >= ${oneDayAgo}`
      ));
    
    const [violationsResult] = await db
      .select({ count: count() })
      .from(apiUsageTracking)
      .where(and(
        eq(apiUsageTracking.apiKeyId, apiKeyId),
        eq(apiUsageTracking.rateLimitExceeded, true)
      ));
    
    const [avgResponseResult] = await db
      .select({ 
        avg: sql<number>`AVG(response_time)` 
      })
      .from(apiUsageTracking)
      .where(and(
        eq(apiUsageTracking.apiKeyId, apiKeyId),
        sql`response_time IS NOT NULL`
      ));
    
    return {
      totalRequests: totalResult.count,
      requestsLastHour: hourResult.count,
      requestsLastDay: dayResult.count,
      rateLimitViolations: violationsResult.count,
      averageResponseTime: Math.round(avgResponseResult.avg || 0)
    };
  }
  
  // Admin Notifications Implementation
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [result] = await db
      .insert(adminNotifications)
      .values([{
        ...notification,
        metadata: notification.metadata as {
          requestCount?: number;
          ipAddress?: string;
          userAgent?: string;
          endpoint?: string;
          timeWindow?: string;
        } | null
      }])
      .returning();
    return result;
  }

  async getAdminNotifications(unreadOnly = false): Promise<AdminNotification[]> {
    const conditions = [];
    if (unreadOnly) {
      conditions.push(eq(adminNotifications.isRead, false));
    }
    
    return await db
      .select()
      .from(adminNotifications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminNotifications.createdAt));
  }

  async markAdminNotificationRead(notificationId: number): Promise<void> {
    await db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, notificationId));
  }

  async getUnreadAdminNotificationCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, false));
    return result.count;
  }
  
  // Analytics Methods Implementation
  async getTotalSearchCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(imeiSearches);
    return result.count;
  }

  async getTotalUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(registeredUsers);
    return result.count;
  }

  async getTotalApiKeyCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(apiKeys);
    return result.count;
  }

  async getDeviceTypeStats(): Promise<Array<{ type: string; count: number }>> {
    const results = await db
      .select({
        type: sql<string>`device_make || ' ' || device_model`,
        count: count()
      })
      .from(imeiSearches)
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL`)
      .groupBy(sql`device_make || ' ' || device_model`)
      .orderBy(desc(count()))
      .limit(10);
    return results.map(r => ({ type: r.type, count: r.count }));
  }

  async getLocationStatsAnonymized(): Promise<Array<{ city: string; state: string; country: string; searches: number }>> {
    // Extract only city, state/province, country from location data for privacy
    const results = await db
      .select({
        location: imeiSearches.searchLocation,
        count: count()
      })
      .from(imeiSearches)
      .where(sql`search_location IS NOT NULL AND search_location != 'Unknown'`)
      .groupBy(imeiSearches.searchLocation)
      .orderBy(desc(count()))
      .limit(10);
    
    return results.map(r => {
      // Parse location and extract only city/state/country
      const locationParts = (r.location || '').split(',').map((p: any) => p.trim());
      return {
        city: locationParts[0] || 'Unknown City',
        state: locationParts[1] || 'Unknown State',
        country: locationParts[locationParts.length - 1] || 'Unknown Country',
        searches: r.count
      };
    });
  }

  async getPopularDevicesAnalytics(): Promise<Array<{ brand: string; model: string; searches: number }>> {
    const results = await db
      .select({
        brand: imeiSearches.deviceMake,
        model: imeiSearches.deviceModel,
        count: count()
      })
      .from(imeiSearches)
      .where(sql`device_make IS NOT NULL AND device_model IS NOT NULL`)
      .groupBy(imeiSearches.deviceMake, imeiSearches.deviceModel)
      .orderBy(desc(count()))
      .limit(10);
    
    return results.map(r => ({
      brand: r.brand || 'Unknown',
      model: r.model || 'Unknown',
      searches: r.count
    }));
  }

  async getCompatibilityStats(): Promise<{ compatible: number; incompatible: number; unknown: number }> {
    // Since there's no direct compatibility field, we'll estimate from network capabilities
    const results = await db
      .select({
        networkCapabilities: imeiSearches.networkCapabilities,
        count: count()
      })
      .from(imeiSearches)
      .where(sql`network_capabilities IS NOT NULL`)
      .groupBy(imeiSearches.networkCapabilities)
      .limit(100);
    
    let compatible = 0, incompatible = 0;
    results.forEach(r => {
      const caps = r.networkCapabilities as any;
      if (caps && (caps.fourG || caps.fiveG || caps.volte)) {
        compatible += r.count;
      } else {
        incompatible += r.count;
      }
    });
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(imeiSearches)
      .where(sql`network_capabilities IS NULL`);
    
    return {
      compatible,
      incompatible,
      unknown: totalResult.count
    };
  }

  async getApiUsageStatsPublic(): Promise<Array<{ apiKeyName: string; totalRequests: number; requestsLastHour: number; rateLimitViolations: number }>> {
    // Get API usage without exposing sensitive information
    const results = await db
      .select({
        apiKeyId: apiUsageTracking.apiKeyId,
        totalRequests: count(),
        rateLimitViolations: sql<number>`SUM(CASE WHEN rate_limit_exceeded THEN 1 ELSE 0 END)`
      })
      .from(apiUsageTracking)
      .groupBy(apiUsageTracking.apiKeyId)
      .orderBy(desc(count()))
      .limit(10);
    
    const statsWithNames = [];
    for (const result of results) {
      // Get API key name without exposing the actual key
      const [apiKey] = await db
        .select({ name: apiKeys.name })
        .from(apiKeys)
        .where(eq(apiKeys.id, result.apiKeyId));
      
      // Get recent usage (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [recentUsage] = await db
        .select({ count: count() })
        .from(apiUsageTracking)
        .where(and(
          eq(apiUsageTracking.apiKeyId, result.apiKeyId),
          sql`timestamp >= ${oneHourAgo}`
        ));
      
      statsWithNames.push({
        apiKeyName: apiKey?.name || 'Unknown API Key',
        totalRequests: result.totalRequests,
        requestsLastHour: recentUsage.count,
        rateLimitViolations: result.rateLimitViolations
      });
    }
    
    return statsWithNames;
  }

  async getRecentActivitySanitized(): Promise<Array<{ timestamp: string; action: string; details: string; location: string }>> {
    // Get recent IMEI searches with sanitized location data
    const recentSearches = await db
      .select({
        timestamp: imeiSearches.searchedAt,
        deviceMake: imeiSearches.deviceMake,
        deviceModel: imeiSearches.deviceModel,
        location: imeiSearches.searchLocation,
        networkCapabilities: imeiSearches.networkCapabilities
      })
      .from(imeiSearches)
      .orderBy(desc(imeiSearches.searchedAt))
      .limit(20);
    
    return recentSearches.map(search => {
      // Sanitize location to city/state level only
      const locationParts = (search.location || '').split(',').map((p: any) => p.trim());
      const sanitizedLocation = locationParts.length >= 2 
        ? `${locationParts[0]}, ${locationParts[1]}` 
        : locationParts[0] || 'Unknown Location';
      
      // Determine compatibility from network capabilities
      const caps = search.networkCapabilities as any;
      const compatibilityText = caps && (caps.fourG || caps.fiveG || caps.volte) ? 'Compatible' : 'Unknown';
      
      return {
        timestamp: search.timestamp?.toISOString() || new Date().toISOString(),
        action: 'IMEI Analysis',
        details: `${search.deviceMake || 'Unknown'} ${search.deviceModel || 'Device'} - ${compatibilityText}`,
        location: sanitizedLocation
      };
    });
  }
}

export const storage = new DatabaseStorage();
