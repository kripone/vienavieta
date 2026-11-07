ALTER TABLE "favorites" ADD COLUMN "notified_price" integer;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD COLUMN "frequency" text DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_price_drops" boolean DEFAULT true NOT NULL;