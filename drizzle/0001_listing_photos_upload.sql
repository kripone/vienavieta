ALTER TABLE "listing_photos" ALTER COLUMN "listing_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD COLUMN "thumb_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_user_idx" ON "listing_photos" USING btree ("user_id");