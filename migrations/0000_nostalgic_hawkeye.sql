CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_hash" text NOT NULL,
	"key" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"request_count" integer DEFAULT 0,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash"),
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "blacklisted_imeis" (
	"id" serial PRIMARY KEY NOT NULL,
	"imei" text NOT NULL,
	"reason" text NOT NULL,
	"blacklisted_at" timestamp DEFAULT now() NOT NULL,
	"added_by" text DEFAULT 'system' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "blacklisted_imeis_imei_unique" UNIQUE("imei")
);
--> statement-breakpoint
CREATE TABLE "carrier_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"carriers_data" jsonb,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "carrier_cache_country_unique" UNIQUE("country")
);
--> statement-breakpoint
CREATE TABLE "imei_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"imei" text NOT NULL,
	"device_make" text,
	"device_model" text,
	"device_year" integer,
	"network_capabilities" jsonb,
	"ai_response" jsonb,
	"search_location" text,
	"ip_address" text,
	"user_agent" text,
	"api_key_id" integer,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_acceptances" (
	"id" serial PRIMARY KEY NOT NULL,
	"search_id" integer,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"policy_version" text DEFAULT 'v1.0' NOT NULL,
	"accepted" boolean NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"device_info" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "imei_searches" ADD CONSTRAINT "imei_searches_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_search_id_imei_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."imei_searches"("id") ON DELETE no action ON UPDATE no action;