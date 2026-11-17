ALTER TABLE "users" ADD COLUMN "business_verified_at" timestamp with time zone;--> statement-breakpoint
-- Esošie saloni/aģentūras, kam jau ir plūsmas, skaitās apstiprināti (lai imports produkcijā neapstājas).
UPDATE "users" SET "business_verified_at" = now() WHERE "seller_type" <> 'private' AND "id" IN (SELECT "user_id" FROM "dealer_feeds");
