CREATE TABLE "dealer_feeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"kind" "listing_kind" DEFAULT 'vehicle' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "remote_photos" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "feed_id" integer;--> statement-breakpoint
ALTER TABLE "dealer_feeds" ADD CONSTRAINT "dealer_feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dealer_feeds_user_idx" ON "dealer_feeds" USING btree ("user_id");