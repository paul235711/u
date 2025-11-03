ALTER TABLE "connections" RENAME COLUMN "organization_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "fittings" RENAME COLUMN "organization_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "media" RENAME COLUMN "organization_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "nodes" RENAME COLUMN "organization_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "sources" RENAME COLUMN "organization_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "valves" RENAME COLUMN "organization_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "connections" DROP CONSTRAINT "connections_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "fittings" DROP CONSTRAINT "fittings_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "layouts" DROP CONSTRAINT "layouts_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "layouts" DROP CONSTRAINT "layouts_site_id_sites_id_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "media_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "nodes" DROP CONSTRAINT "nodes_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "valves" DROP CONSTRAINT "valves_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "layouts" ALTER COLUMN "site_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fittings" ADD CONSTRAINT "fittings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layouts" ADD CONSTRAINT "layouts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valves" ADD CONSTRAINT "valves_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layouts" DROP COLUMN "organization_id";