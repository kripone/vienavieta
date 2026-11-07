CREATE TYPE "public"."country" AS ENUM('LV', 'LT');--> statement-breakpoint
ALTER TYPE "public"."listing_source" ADD VALUE 'autoplius.lt';--> statement-breakpoint
ALTER TYPE "public"."listing_source" ADD VALUE 'aruodas.lt';--> statement-breakpoint
ALTER TABLE "regions" ADD COLUMN "country" "country" DEFAULT 'LV' NOT NULL;