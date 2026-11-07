ALTER TABLE "vzd_deals" ADD COLUMN "house_tail" text;--> statement-breakpoint
CREATE INDEX "vzd_deals_tail_idx" ON "vzd_deals" USING btree ("house_tail");