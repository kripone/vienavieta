CREATE TABLE "vzd_deals" (
	"deal_id" integer PRIMARY KEY NOT NULL,
	"day" date NOT NULL,
	"amount" integer NOT NULL,
	"area_m2" numeric(7, 1) NOT NULL,
	"rooms" integer,
	"floor" integer,
	"floors" integer,
	"built_year" integer,
	"material" text,
	"address" text NOT NULL,
	"house_key" text NOT NULL,
	"city" text,
	"building_cad_nr" text,
	"lat" double precision,
	"lon" double precision
);
--> statement-breakpoint
CREATE INDEX "vzd_deals_house_idx" ON "vzd_deals" USING btree ("house_key");--> statement-breakpoint
CREATE INDEX "vzd_deals_building_idx" ON "vzd_deals" USING btree ("building_cad_nr");--> statement-breakpoint
CREATE INDEX "vzd_deals_geo_idx" ON "vzd_deals" USING btree ("lat","lon");