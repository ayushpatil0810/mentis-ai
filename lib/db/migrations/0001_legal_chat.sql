ALTER TABLE "user" ADD COLUMN "default_provider" text;--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN "is_enabled" boolean DEFAULT true NOT NULL;