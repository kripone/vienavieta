CREATE TABLE "crawl_state" (
	"name" text PRIMARY KEY NOT NULL,
	"last_full_at" timestamp with time zone,
	"last_quick_at" timestamp with time zone,
	"last_result" jsonb
);
