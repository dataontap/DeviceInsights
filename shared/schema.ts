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
  name: text("name").notNull(),
  requestCount: integer("request_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

export const imeiSearchesRelations = relations(imeiSearches, ({ many }) => ({
  // Future relations can be added here
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
  name: true,
});

export type InsertImeiSearch = z.infer<typeof insertImeiSearchSchema>;
export type ImeiSearch = typeof imeiSearches.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
