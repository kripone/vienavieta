ALTER TABLE "places" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "code" text;--> statement-breakpoint
CREATE INDEX "places_parent_idx" ON "places" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_code_unique" UNIQUE("code");