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
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(),
  key: text("key").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
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

export const imeiSearchesRelations = relations(imeiSearches, ({ one }) => ({
  policyAcceptance: one(policyAcceptances, {
    fields: [imeiSearches.id],
    references: [policyAcceptances.searchId],
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
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  keyHash: true,
  key: true,
  email: true,
  name: true,
});

export const generateApiKeySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter a name for your API key"),
});

export const insertPolicyAcceptanceSchema = createInsertSchema(policyAcceptances).pick({
  searchId: true,
  ipAddress: true,
  userAgent: true,
  policyVersion: true,
  accepted: true,
  deviceInfo: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertImeiSearch = z.infer<typeof insertImeiSearchSchema>;
export type ImeiSearch = typeof imeiSearches.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertPolicyAcceptance = z.infer<typeof insertPolicyAcceptanceSchema>;
export type PolicyAcceptance = typeof policyAcceptances.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
