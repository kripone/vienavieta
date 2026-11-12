ALTER TABLE "saved_searches" ADD COLUMN "notify_telegram" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_price_drops" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_link_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_link_expires" timestamp with time zone;