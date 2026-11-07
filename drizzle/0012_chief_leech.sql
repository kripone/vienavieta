ALTER TABLE "listings" ADD COLUMN "first_price" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "detail_checked_at" timestamp with time zone;--> statement-breakpoint
-- sākuma cena esošajiem sludinājumiem, kuriem cena jau mainīta (no vecākā price_history ieraksta)
UPDATE "listings" l SET "first_price" = h.price
FROM (SELECT DISTINCT ON (listing_id) listing_id, price FROM "price_history" ORDER BY listing_id, changed_at, id) h
WHERE h.listing_id = l.id AND h.price <> l.price;
