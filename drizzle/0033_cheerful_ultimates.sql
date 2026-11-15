CREATE TABLE "indexnow_sent" (
	"url" text PRIMARY KEY NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
