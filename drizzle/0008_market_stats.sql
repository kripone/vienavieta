CREATE TABLE "market_stats" (
	"day" date NOT NULL,
	"segment" text NOT NULL,
	"median" integer NOT NULL,
	"p25" integer NOT NULL,
	"p75" integer NOT NULL,
	"n" integer NOT NULL,
	CONSTRAINT "market_stats_day_segment_pk" PRIMARY KEY("day","segment")
);
--> statement-breakpoint
CREATE INDEX "market_stats_segment_idx" ON "market_stats" USING btree ("segment","day");