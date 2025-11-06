import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uuid,
  pgEnum,
  decimal,
  jsonb,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  lastActiveTeamId: integer('last_active_team_id'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }: any) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }: any) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }: any) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }: any) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }: any) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  invitations: Invitation[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  CANCEL_INVITATION = 'CANCEL_INVITATION',
}

// =====================================================
// HOSPITAL SYNOPTICS SCHEMA
// =====================================================

// Enums for synoptics
export const layoutTypeEnum = pgEnum('layout_type', ['site', 'floor', 'zone']);
export const nodeTypeEnum = pgEnum('node_type', ['source', 'valve', 'fitting']);

// Organizations (maps to teams for multi-tenancy)
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sites
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Buildings
export const buildings = pgTable('buildings', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Floors
export const floors = pgTable('floors', {
  id: uuid('id').defaultRandom().primaryKey(),
  buildingId: uuid('building_id')
    .notNull()
    .references(() => buildings.id, { onDelete: 'cascade' }),
  floorNumber: integer('floor_number').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zones
export const zones = pgTable('zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  floorId: uuid('floor_id')
    .notNull()
    .references(() => floors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sources (gas sources)
export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  gasType: text('gas_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Valves
export const valves = pgTable('valves', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  valveType: text('valve_type').notNull(),
  gasType: text('gas_type').notNull(),
  state: text('state').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Fittings
export const fittings = pgTable('fittings', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name'),
  fittingType: text('fitting_type').notNull(),
  gasType: text('gas_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Layouts
export const layouts = pgTable('layouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  floorId: uuid('floor_id').references(() => floors.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  layoutType: layoutTypeEnum('layout_type').notNull(),
  backgroundUrl: text('background_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Nodes
export const nodes = pgTable('nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  nodeType: nodeTypeEnum('node_type').notNull(),
  elementId: uuid('element_id').notNull(),
  buildingId: uuid('building_id').references(() => buildings.id, { onDelete: 'set null' }),
  floorId: uuid('floor_id').references(() => floors.id, { onDelete: 'set null' }),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'set null' }),
  zPosition: decimal('z_position', { precision: 10, scale: 2 }).default('0'),
  outletCount: integer('outlet_count').default(0),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Node Positions (for different layouts)
export const nodePositions = pgTable('node_positions', {
  nodeId: uuid('node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  layoutId: uuid('layout_id')
    .notNull()
    .references(() => layouts.id, { onDelete: 'cascade' }),
  xPosition: decimal('x_position', { precision: 10, scale: 2 }).notNull(),
  yPosition: decimal('y_position', { precision: 10, scale: 2 }).notNull(),
}, (table: any) => ({
  pk: { primaryKey: [table.nodeId, table.layoutId] },
}));

// Connections (pipes between nodes)
export const connections = pgTable('connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  fromNodeId: uuid('from_node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  toNodeId: uuid('to_node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  gasType: text('gas_type').notNull(),
  diameterMm: decimal('diameter_mm', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Media (photos/documents for network elements)
export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  elementId: uuid('element_id').notNull(),
  elementType: text('element_type').notNull(),
  storagePath: text('storage_path').notNull(),
  fileName: text('file_name'),
  mimeType: text('mime_type'),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations for synoptics
export const organizationsRelations = relations(organizations, ({ one, many }: any) => ({
  team: one(teams, {
    fields: [organizations.teamId],
    references: [teams.id],
  }),
  sites: many(sites),
}));

export const sitesRelations = relations(sites, ({ one, many }: any) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  buildings: many(buildings),
  layouts: many(layouts),
  nodes: many(nodes),
  sources: many(sources),
  valves: many(valves),
  fittings: many(fittings),
  connections: many(connections),
  media: many(media),
}));

export const buildingsRelations = relations(buildings, ({ one, many }: any) => ({
  site: one(sites, {
    fields: [buildings.siteId],
    references: [sites.id],
  }),
  floors: many(floors),
}));

export const floorsRelations = relations(floors, ({ one, many }: any) => ({
  building: one(buildings, {
    fields: [floors.buildingId],
    references: [buildings.id],
  }),
  zones: many(zones),
  layouts: many(layouts),
}));

export const zonesRelations = relations(zones, ({ one }: any) => ({
  floor: one(floors, {
    fields: [zones.floorId],
    references: [floors.id],
  }),
}));

export const nodesRelations = relations(nodes, ({ one, many }: any) => ({
  site: one(sites, {
    fields: [nodes.siteId],
    references: [sites.id],
  }),
  building: one(buildings, {
    fields: [nodes.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [nodes.floorId],
    references: [floors.id],
  }),
  zone: one(zones, {
    fields: [nodes.zoneId],
    references: [zones.id],
  }),
  positions: many(nodePositions),
  connectionsFrom: many(connections, { relationName: 'fromNode' }),
  connectionsTo: many(connections, { relationName: 'toNode' }),
}));

export const connectionsRelations = relations(connections, ({ one }: any) => ({
  site: one(sites, {
    fields: [connections.siteId],
    references: [sites.id],
  }),
  fromNode: one(nodes, {
    fields: [connections.fromNodeId],
    references: [nodes.id],
    relationName: 'fromNode',
  }),
  toNode: one(nodes, {
    fields: [connections.toNodeId],
    references: [nodes.id],
    relationName: 'toNode',
  }),
}));

// Type exports for synoptics
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Building = typeof buildings.$inferSelect;
export type NewBuilding = typeof buildings.$inferInsert;
export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Valve = typeof valves.$inferSelect;
export type NewValve = typeof valves.$inferInsert;
export type Fitting = typeof fittings.$inferSelect;
export type NewFitting = typeof fittings.$inferInsert;
export type Layout = typeof layouts.$inferSelect;
export type NewLayout = typeof layouts.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type NodePosition = typeof nodePositions.$inferSelect;
export type NewNodePosition = typeof nodePositions.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
