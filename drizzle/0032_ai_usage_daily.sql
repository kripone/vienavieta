CREATE TABLE "ai_usage_daily" (
	"day" date PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"transcribes" integer DEFAULT 0 NOT NULL
);
