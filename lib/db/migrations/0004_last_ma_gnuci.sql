CREATE TYPE "public"."annotation_type" AS ENUM('building', 'floor', 'zone', 'service', 'label');--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_id" uuid NOT NULL,
	"annotation_type" "annotation_type" NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"position_x" numeric(10, 2) NOT NULL,
	"position_y" numeric(10, 2) NOT NULL,
	"size_width" numeric(10, 2),
	"size_height" numeric(10, 2),
	"color" text,
	"style" text,
	"interactive" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_layout_id_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."layouts"("id") ON DELETE cascade ON UPDATE no action;