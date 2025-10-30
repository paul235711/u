-- Migration: Change nodes table from organizationId to siteId
-- Date: 2025-10-30
-- Description: Nodes are now site-specific instead of organization-specific

-- Step 1: Add new siteId column (temporarily nullable)
ALTER TABLE nodes ADD COLUMN site_id UUID;

-- Step 2: Add foreign key constraint
ALTER TABLE nodes ADD CONSTRAINT nodes_site_id_fk 
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;

-- Step 3: Migrate data - link nodes to sites based on their building/floor/zone
-- For nodes with buildingId, find the site that owns that building
UPDATE nodes n
SET site_id = b.site_id
FROM buildings b
WHERE n.building_id = b.id
AND n.site_id IS NULL;

-- For nodes with floorId but no building, find site from floor->building
UPDATE nodes n
SET site_id = b.site_id
FROM floors f
JOIN buildings b ON f.building_id = b.id
WHERE n.floor_id = f.id
AND n.site_id IS NULL;

-- For nodes with zoneId but no floor, find site from zone->floor->building
UPDATE nodes n
SET site_id = b.site_id
FROM zones z
JOIN floors f ON z.floor_id = f.id
JOIN buildings b ON f.building_id = b.id
WHERE n.zone_id = z.id
AND n.site_id IS NULL;

-- Step 4: Delete nodes without location (orphaned nodes)
-- First, delete their node_positions (foreign key cascade should handle this, but being explicit)
DELETE FROM node_positions
WHERE node_id IN (
  SELECT id FROM nodes WHERE site_id IS NULL
);

-- Then delete the nodes themselves
DELETE FROM nodes WHERE site_id IS NULL;

-- Step 5: Make site_id NOT NULL (after ensuring all nodes have a site)
ALTER TABLE nodes ALTER COLUMN site_id SET NOT NULL;

-- Step 6: Drop the old organization_id column
ALTER TABLE nodes DROP COLUMN organization_id;

-- Step 7: Update indexes if any existed on organization_id
-- CREATE INDEX IF NOT EXISTS nodes_site_id_idx ON nodes(site_id);

-- Note: You may also want to update any views or materialized views that depend on nodes.organization_id
