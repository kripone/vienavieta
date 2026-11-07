ALTER TABLE "listings" ADD COLUMN "features" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "seats" smallint;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "inspection_until" text;