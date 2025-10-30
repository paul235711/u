-- Migration: Change layouts table from organizationId to siteId
-- Date: 2025-10-30
-- Description: Layouts are now site-specific instead of organization-specific

-- Step 1: Ensure all layouts have a siteId (they should already based on current schema)
-- Check if any layouts have NULL siteId
-- SELECT id, name, organization_id, site_id FROM layouts WHERE site_id IS NULL;

-- Step 2: Make site_id NOT NULL
ALTER TABLE layouts ALTER COLUMN site_id SET NOT NULL;

-- Step 3: Drop the old organization_id column
ALTER TABLE layouts DROP COLUMN organization_id;

-- Step 4: Update indexes if any existed on organization_id
-- CREATE INDEX IF NOT EXISTS layouts_site_id_idx ON layouts(site_id);

-- Verification query:
-- SELECT site_id, COUNT(*) as layout_count
-- FROM layouts
-- GROUP BY site_id;
