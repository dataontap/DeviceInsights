import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const imeiSearches = pgTable("imei_searches", {
  id: serial("id").primaryKey(),
  imei: text("imei").notNull(),
  deviceMake: text("device_make"),
  deviceModel: text("device_model"),
  deviceYear: integer("device_year"),
  networkCapabilities: jsonb("network_capabilities").$type<{
    fourG: boolean;
    fiveG: boolean;
    volte: boolean;
    wifiCalling: string;
  }>(),
  aiResponse: jsonb("ai_response").$type<any>(),
  searchLocation: text("search_location"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(),
  key: text("key").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  website: text("website"), // Optional: website or description for the API key
  requestCount: integer("request_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

export const policyAcceptances = pgTable("policy_acceptances", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").references(() => imeiSearches.id),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  policyVersion: text("policy_version").notNull().default("v1.0"),
  accepted: boolean("accepted").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  deviceInfo: jsonb("device_info").$type<{
    make?: string;
    model?: string;
    compatible?: boolean;
  }>(),
});

export const blacklistedImeis = pgTable("blacklisted_imeis", {
  id: serial("id").primaryKey(),
  imei: text("imei").notNull().unique(),
  reason: text("reason").notNull(),
  blacklistedAt: timestamp("blacklisted_at").defaultNow().notNull(),
  addedBy: text("added_by").notNull().default("system"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const loginTokens = pgTable("login_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("admin"), // "admin", "super_admin"
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull().default("system"),
});

export const adminAccessRequests = pgTable("admin_access_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  referer: text("referer"),
  isExistingAdmin: boolean("is_existing_admin").default(false).notNull(),
  emailSent: boolean("email_sent").default(false).notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

export const carrierCache = pgTable("carrier_cache", {
  id: serial("id").primaryKey(),
  country: text("country").notNull().unique(),
  carriersData: jsonb("carriers_data").$type<{
    country: string;
    carriers: Array<{
      name: string;
      marketShare: string;
      description: string;
    }>;
  }>(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Pricing Cache for carrier plan pricing
export const pricingCache = pgTable("pricing_cache", {
  id: serial("id").primaryKey(),
  country: text("country").notNull().unique(),
  pricingData: jsonb("pricing_data").$type<{
    country: string;
    currency: string;
    plans: Array<{
      carrier: string;
      planName: string;
      monthlyPrice: number;
      data: string;
      speed: string;
      features: string[];
      contractType: string;
      additionalFees?: string;
      promotions?: string;
    }>;
    lastUpdated: string;
  }>(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ISP Cache for IP geolocation lookups
export const ispCache = pgTable("isp_cache", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  ispData: jsonb("isp_data").$type<{
    isp: string;
    org?: string;
    as?: string;
    city?: string;
    region?: string;
    country?: string;
    mobile?: boolean;
  }>(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Voice Audio Cache for session-based storage
export const voiceCache = pgTable("voice_cache", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  language: text("language").notNull(),
  voiceCount: integer("voice_count").notNull(),
  locationHash: text("location_hash"),
  conversation: jsonb("conversation").$type<Array<{
    index: number;
    audio: string;
    message: {
      text: string;
      voiceConfig: {
        voiceId: string;
        name: string;
        personality: string;
        language: string;
        gender: string;
        accent: string;
      };
      isHarmonizing?: boolean;
      isSinging?: boolean;
    };
  }>>(),
  singleAudio: jsonb("single_audio").$type<{
    audio: string;
    text: string;
    voice: {
      voiceId: string;
      name: string;
      personality: string;
      language: string;
      gender: string;
      accent: string;
    };
  }>(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// User Registration and Account Management
export const registeredUsers = pgTable("registered_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  subscriptionStatus: text("subscription_status").default("active").notNull(),
  emailPreferences: jsonb("email_preferences").$type<{
    monthlyInsights: boolean;
    interruptionAlerts: boolean;
    speedAlerts: boolean;
    marketingEmails: boolean;
  }>().default({
    monthlyInsights: true,
    interruptionAlerts: true,
    speedAlerts: true,
    marketingEmails: false
  }),
  timezone: text("timezone").default("UTC"),
  location: text("location"),
  deviceInfo: jsonb("device_info").$type<{
    primaryDevice?: string;
    carrier?: string;
    networkType?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

// Connectivity Monitoring
export const connectivityMetrics = pgTable("connectivity_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => registeredUsers.id),
  sessionId: text("session_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  location: text("location"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  connectionType: text("connection_type"), // "4G", "5G", "WiFi", etc.
  carrier: text("carrier"),
  signalStrength: integer("signal_strength"), // -50 to -120 dBm range
  downloadSpeed: integer("download_speed"), // kbps
  uploadSpeed: integer("upload_speed"), // kbps
  latency: integer("latency"), // ms
  jitter: integer("jitter"), // ms
  packetLoss: integer("packet_loss"), // percentage
  isInterruption: boolean("is_interruption").default(false).notNull(),
  interruptionDuration: integer("interruption_duration"), // seconds
  deviceInfo: jsonb("device_info").$type<{
    make?: string;
    model?: string;
    os?: string;
    osVersion?: string;
  }>(),
});

// Email Insights and Reports
export const emailReports = pgTable("email_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => registeredUsers.id).notNull(),
  reportType: text("report_type").notNull(), // "monthly", "interruption", "speed_alert"
  reportDate: timestamp("report_date").defaultNow().notNull(),
  emailSent: boolean("email_sent").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  reportData: jsonb("report_data").$type<{
    averageDownloadSpeed?: number;
    averageUploadSpeed?: number;
    averageLatency?: number;
    totalInterruptions?: number;
    totalDowntime?: number;
    connectionQualityScore?: number;
    recommendations?: string[];
    comparisonData?: any;
  }>(),
  emailTemplate: text("email_template"),
  emailSubject: text("email_subject"),
});

// Real-time Alerts
export const connectivityAlerts = pgTable("connectivity_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => registeredUsers.id),
  alertType: text("alert_type").notNull(), // "interruption", "speed_drop", "quality_degradation"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  alertData: jsonb("alert_data").$type<{
    duration?: number;
    affectedMetric?: string;
    previousValue?: number;
    currentValue?: number;
    location?: string;
    carrier?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Rate Limiting and API Usage Tracking
export const apiUsageTracking = pgTable("api_usage_tracking", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id).notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  responseStatus: integer("response_status"),
  responseTime: integer("response_time"), // milliseconds
  rateLimitExceeded: boolean("rate_limit_exceeded").default(false).notNull(),
  requestSize: integer("request_size"), // bytes
  responseSize: integer("response_size"), // bytes
});

// Admin Notifications for Rate Limit Violations
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "rate_limit_exceeded", "api_abuse", "system_alert"
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // "info", "warning", "error", "critical"
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  metadata: jsonb("metadata").$type<{
    endpoint?: string;
    requestCount?: number;
    timeWindow?: string;
    ipAddress?: string;
    userAgent?: string;
  }>(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Net Promoter Score (NPS) Feedback
export const npsResponses = pgTable("nps_responses", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").references(() => imeiSearches.id),
  rating: integer("rating").notNull(), // 0-10 scale
  feedback: text("feedback"), // Optional text feedback
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imeiSearchesRelations = relations(imeiSearches, ({ one }) => ({
  policyAcceptance: one(policyAcceptances, {
    fields: [imeiSearches.id],
    references: [policyAcceptances.searchId],
  }),
}));

export const registeredUsersRelations = relations(registeredUsers, ({ many }) => ({
  connectivityMetrics: many(connectivityMetrics),
  emailReports: many(emailReports),
  connectivityAlerts: many(connectivityAlerts),
}));

export const connectivityMetricsRelations = relations(connectivityMetrics, ({ one }) => ({
  user: one(registeredUsers, {
    fields: [connectivityMetrics.userId],
    references: [registeredUsers.id],
  }),
}));

export const emailReportsRelations = relations(emailReports, ({ one }) => ({
  user: one(registeredUsers, {
    fields: [emailReports.userId],
    references: [registeredUsers.id],
  }),
}));

export const connectivityAlertsRelations = relations(connectivityAlerts, ({ one }) => ({
  user: one(registeredUsers, {
    fields: [connectivityAlerts.userId],
    references: [registeredUsers.id],
  }),
}));

export const apiUsageTrackingRelations = relations(apiUsageTracking, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiUsageTracking.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [adminNotifications.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const policyAcceptancesRelations = relations(policyAcceptances, ({ one }) => ({
  search: one(imeiSearches, {
    fields: [policyAcceptances.searchId],
    references: [imeiSearches.id],
  }),
}));

export const insertImeiSearchSchema = createInsertSchema(imeiSearches).pick({
  imei: true,
  deviceMake: true,
  deviceModel: true,
  deviceYear: true,
  networkCapabilities: true,
  aiResponse: true,
  searchLocation: true,
  ipAddress: true,
  userAgent: true,
  apiKeyId: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  keyHash: true,
  key: true,
  email: true,
  name: true,
  website: true,
});

export const generateApiKeySchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email address is too long")
    .refine(email => !email.includes('<') && !email.includes('>'), "Invalid email format"),
  name: z.string()
    .max(100, "Name must be less than 100 characters")
    .refine(name => !/[<>'"&]/.test(name), "Name contains invalid characters")
    .optional(),
  website: z.string()
    .max(200, "Website/Description must be less than 200 characters")
    .refine(website => !website || !/[<>'"&]/.test(website), "Website contains invalid characters")
    .optional(),
});

export const insertPolicyAcceptanceSchema = createInsertSchema(policyAcceptances).pick({
  searchId: true,
  ipAddress: true,
  userAgent: true,
  policyVersion: true,
  accepted: true,
  deviceInfo: true,
});

export const insertBlacklistedImeiSchema = createInsertSchema(blacklistedImeis).pick({
  imei: true,
  reason: true,
  addedBy: true,
  isActive: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRegisteredUserSchema = createInsertSchema(registeredUsers).pick({
  email: true,
  firstName: true,
  lastName: true,
  emailPreferences: true,
  timezone: true,
  location: true,
  deviceInfo: true,
});

export const insertConnectivityMetricSchema = createInsertSchema(connectivityMetrics).pick({
  userId: true,
  sessionId: true,
  location: true,
  ipAddress: true,
  userAgent: true,
  connectionType: true,
  carrier: true,
  signalStrength: true,
  downloadSpeed: true,
  uploadSpeed: true,
  latency: true,
  jitter: true,
  packetLoss: true,
  isInterruption: true,
  interruptionDuration: true,
  deviceInfo: true,
});

export const insertEmailReportSchema = createInsertSchema(emailReports).pick({
  userId: true,
  reportType: true,
  reportData: true,
  emailTemplate: true,
  emailSubject: true,
});

export const insertConnectivityAlertSchema = createInsertSchema(connectivityAlerts).pick({
  userId: true,
  alertType: true,
  severity: true,
  title: true,
  message: true,
  alertData: true,
});

export const insertApiUsageTrackingSchema = createInsertSchema(apiUsageTracking).pick({
  apiKeyId: true,
  endpoint: true,
  method: true,
  ipAddress: true,
  userAgent: true,
  responseStatus: true,
  responseTime: true,
  rateLimitExceeded: true,
  requestSize: true,
  responseSize: true,
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).pick({
  type: true,
  title: true,
  message: true,
  severity: true,
  apiKeyId: true,
  metadata: true,
});

export const insertNpsResponseSchema = createInsertSchema(npsResponses).pick({
  searchId: true,
  rating: true,
  feedback: true,
  ipAddress: true,
  userAgent: true,
});

export const insertLoginTokenSchema = createInsertSchema(loginTokens).pick({
  email: true,
  token: true,
  expiresAt: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).pick({
  email: true,
  sessionToken: true,
  expiresAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdBy: true,
});

export const insertAdminAccessRequestSchema = createInsertSchema(adminAccessRequests).pick({
  email: true,
  ipAddress: true,
  userAgent: true,
  location: true,
  referer: true,
  isExistingAdmin: true,
  emailSent: true,
});

export const magicLinkRequestSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),
});

export const userRegistrationSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .optional(),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .optional(),
  emailPreferences: z.object({
    monthlyInsights: z.boolean().default(true),
    interruptionAlerts: z.boolean().default(true),
    speedAlerts: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
  }).optional(),
  timezone: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
});

export const connectivityMetricSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  location: z.string().max(100).optional(),
  connectionType: z.string().max(20).optional(),
  carrier: z.string().max(50).optional(),
  signalStrength: z.number().min(-120).max(-30).optional(),
  downloadSpeed: z.number().min(0).max(1000000).optional(), // up to 1Gbps
  uploadSpeed: z.number().min(0).max(1000000).optional(),
  latency: z.number().min(0).max(10000).optional(), // up to 10 seconds
  jitter: z.number().min(0).max(1000).optional(),
  packetLoss: z.number().min(0).max(100).optional(),
  isInterruption: z.boolean().default(false),
  interruptionDuration: z.number().min(0).optional(),
});

export type InsertImeiSearch = z.infer<typeof insertImeiSearchSchema>;
export type ImeiSearch = typeof imeiSearches.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertPolicyAcceptance = z.infer<typeof insertPolicyAcceptanceSchema>;
export type PolicyAcceptance = typeof policyAcceptances.$inferSelect;
export type InsertBlacklistedImei = z.infer<typeof insertBlacklistedImeiSchema>;
export type BlacklistedImei = typeof blacklistedImeis.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLoginToken = z.infer<typeof insertLoginTokenSchema>;
export type LoginToken = typeof loginTokens.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminAccessRequest = z.infer<typeof insertAdminAccessRequestSchema>;
export type AdminAccessRequest = typeof adminAccessRequests.$inferSelect;
export type InsertRegisteredUser = z.infer<typeof insertRegisteredUserSchema>;
export type RegisteredUser = typeof registeredUsers.$inferSelect;
export type InsertConnectivityMetric = z.infer<typeof insertConnectivityMetricSchema>;
export type ConnectivityMetric = typeof connectivityMetrics.$inferSelect;
export type InsertEmailReport = z.infer<typeof insertEmailReportSchema>;
export type EmailReport = typeof emailReports.$inferSelect;
export type InsertConnectivityAlert = z.infer<typeof insertConnectivityAlertSchema>;
export type ConnectivityAlert = typeof connectivityAlerts.$inferSelect;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type ConnectivityMetricInput = z.infer<typeof connectivityMetricSchema>;
export type InsertApiUsageTracking = z.infer<typeof insertApiUsageTrackingSchema>;
export type ApiUsageTracking = typeof apiUsageTracking.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertNpsResponse = z.infer<typeof insertNpsResponseSchema>;
export type NpsResponse = typeof npsResponses.$inferSelect;

// Pricing Cache types
export type PricingCache = typeof pricingCache.$inferSelect;

// ISP Cache types
export type IspCache = typeof ispCache.$inferSelect;

// Voice Cache schema and types
export const insertVoiceCacheSchema = createInsertSchema(voiceCache).omit({
  id: true,
  cachedAt: true,
});

export type InsertVoiceCache = z.infer<typeof insertVoiceCacheSchema>;
export type VoiceCache = typeof voiceCache.$inferSelect;
