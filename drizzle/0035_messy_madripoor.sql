ALTER TABLE "listings" ADD COLUMN "trim" text;--> statement-breakpoint
CREATE INDEX "listings_trim_idx" ON "listings" USING btree ("make_id","trim") WHERE "listings"."trim" is not null;