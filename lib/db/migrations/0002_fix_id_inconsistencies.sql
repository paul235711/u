-- Migration: Fix ID inconsistencies and add performance indexes
-- Generated: 2025-01-27

-- Add performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_team_id ON activity_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_invitations_team_id ON invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Synoptics performance indexes
CREATE INDEX IF NOT EXISTS idx_organizations_team_id ON organizations(team_id);
CREATE INDEX IF NOT EXISTS idx_sites_organization_id ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_site_id ON buildings(site_id);
CREATE INDEX IF NOT EXISTS idx_floors_building_id ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_zones_floor_id ON zones(floor_id);
CREATE INDEX IF NOT EXISTS idx_layouts_organization_id ON layouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_layouts_site_id ON layouts(site_id);
CREATE INDEX IF NOT EXISTS idx_layouts_floor_id ON layouts(floor_id);
CREATE INDEX IF NOT EXISTS idx_nodes_organization_id ON nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_nodes_element_id ON nodes(element_id);
CREATE INDEX IF NOT EXISTS idx_nodes_building_id ON nodes(building_id);
CREATE INDEX IF NOT EXISTS idx_nodes_floor_id ON nodes(floor_id);
CREATE INDEX IF NOT EXISTS idx_nodes_zone_id ON nodes(zone_id);
CREATE INDEX IF NOT EXISTS idx_connections_organization_id ON connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_connections_from_node_id ON connections(from_node_id);
CREATE INDEX IF NOT EXISTS idx_connections_to_node_id ON connections(to_node_id);
CREATE INDEX IF NOT EXISTS idx_media_organization_id ON media(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_element_id ON media(element_id);

-- Add CHECK constraints for data validation
ALTER TABLE valves ADD CONSTRAINT IF NOT EXISTS check_valve_state
  CHECK (state IN ('open', 'closed', 'faulty', 'maintenance'));

ALTER TABLE sources ADD CONSTRAINT IF NOT EXISTS check_gas_type_not_empty
  CHECK (length(trim(gas_type)) > 0);

ALTER TABLE valves ADD CONSTRAINT IF NOT EXISTS check_valve_gas_type_not_empty
  CHECK (length(trim(gas_type)) > 0);

ALTER TABLE fittings ADD CONSTRAINT IF NOT EXISTS check_fitting_gas_type_not_empty
  CHECK (length(trim(gas_type)) > 0);

ALTER TABLE connections ADD CONSTRAINT IF NOT EXISTS check_connection_gas_type_not_empty
  CHECK (length(trim(gas_type)) > 0);

ALTER TABLE nodes ADD CONSTRAINT IF NOT EXISTS check_outlet_count_positive
  CHECK (outlet_count >= 0);

-- Add constraints to ensure gas types are consistent across connections
ALTER TABLE connections ADD CONSTRAINT IF NOT EXISTS check_diameter_positive
  CHECK (diameter_mm IS NULL OR diameter_mm > 0);
