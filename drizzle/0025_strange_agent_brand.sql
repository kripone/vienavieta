CREATE TABLE "favorite_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "share_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"share_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"visitor_key" text NOT NULL,
	"name" text NOT NULL,
	"vote" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "stage" text;--> statement-breakpoint
ALTER TABLE "favorite_shares" ADD CONSTRAINT "favorite_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_reactions" ADD CONSTRAINT "share_reactions_share_id_favorite_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."favorite_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_reactions" ADD CONSTRAINT "share_reactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "share_reactions_one_idx" ON "share_reactions" USING btree ("share_id","listing_id","visitor_key");