CREATE TABLE "trim_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"name" text NOT NULL,
	"seen" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "trim_names_make_name_uq" ON "trim_names" USING btree ("make","name");