-- Migration: Add annotations table for layout annotations
-- Created: 2025-01-06

-- Create annotation_type enum
CREATE TYPE "annotation_type" AS ENUM ('building', 'floor', 'zone', 'service', 'label');

-- Create annotations table
CREATE TABLE "annotations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "layout_id" UUID NOT NULL REFERENCES "layouts"("id") ON DELETE CASCADE,
  "annotation_type" "annotation_type" NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "position_x" DECIMAL(10, 2) NOT NULL,
  "position_y" DECIMAL(10, 2) NOT NULL,
  "size_width" DECIMAL(10, 2),
  "size_height" DECIMAL(10, 2),
  "color" TEXT,
  "style" TEXT,
  "interactive" INTEGER DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on layout_id for faster queries
CREATE INDEX "annotations_layout_id_idx" ON "annotations"("layout_id");

-- Create index on annotation_type for filtering
CREATE INDEX "annotations_type_idx" ON "annotations"("annotation_type");

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER annotations_updated_at_trigger
BEFORE UPDATE ON "annotations"
FOR EACH ROW
EXECUTE FUNCTION update_annotations_updated_at();
