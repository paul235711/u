#!/usr/bin/env tsx
/**
 * Seed script for hospital medical gas valve system demo
 * Usage: npx tsx scripts/seed-hospital-demo.ts <user-email>
 */

import { db } from '@/lib/db/drizzle';
import { users, teams, organizations, teamMembers, sites, buildings, floors, zones, sources, valves, nodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { valveData } from './hospital-valve-data.js';

type ValveInfo = {
  id: string;
  location: string;
  zone: string;
  service: string;
  type: 'isolation' | 'secondary';
  gasType: 'oxygen' | 'nitrous_oxide' | 'medical_air' | 'vacuum';
};

// Floor level mapping
const FLOOR_MAPPING: Record<string, { number: number; name: string }> = {
  'EXTERIEUR': { number: -3, name: 'Extérieur (sous-sol stockage)' },
  '2-SOUS-SOL': { number: -2, name: 'Sous-sol -2 (Clinique)' },
  '1-SOUS-SOL': { number: -1, name: 'Sous-sol -1 (Services)' },
  'SOUS-SOL': { number: -1, name: 'Sous-sol -1 (Services)' },
  'R.D CHAUS.': { number: 0, name: 'Rez-de-chaussée' },
  '1er ETAGE': { number: 1, name: '1er Étage' },
  '2ème ETAGE': { number: 2, name: '2ème Étage' },
  '3ème ETAGE': { number: 3, name: '3ème Étage' },
};

async function main() {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.error('❌ Error: Please provide a user email');
    console.log('Usage: npx tsx scripts/seed-hospital-demo.ts <user-email>');
    process.exit(1);
  }

  console.log('🏥 Starting hospital demo data seed...');
  console.log(`📧 User: ${userEmail}\n`);

  // 1. Find user
  const [user] = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
  
  if (!user) {
    console.error(`❌ User with email ${userEmail} not found`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email}`);

  // 2. Get or create team and organization
  const teamMember = await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, user.id)).limit(1);
  let organizationId: string;
  let teamId: number;

  if (!teamMember.length) {
    // Create team first
    const [newTeam] = await db.insert(teams).values({ name: 'Hôpital Central Demo' }).returning();
    teamId = newTeam.id;
    
    // Create organization linked to team
    const [newOrg] = await db.insert(organizations).values({ 
      name: 'Hôpital Central Demo', 
      teamId: teamId 
    }).returning();
    organizationId = newOrg.id;
    
    // Add user to team
    await db.insert(teamMembers).values({
      userId: user.id,
      teamId: teamId,
      role: 'owner',
    });
    
    console.log(`✅ Created organization: ${newOrg.name}`);
  } else {
    teamId = teamMember[0].teamId;
    const [existingOrg] = await db.select().from(organizations).where(eq(organizations.teamId, teamId)).limit(1);
    if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      const [newOrg] = await db.insert(organizations).values({ name: 'Hôpital Central Demo', teamId }).returning();
      organizationId = newOrg.id;
    }
  }

  // 3. Create site
  const [site] = await db.insert(sites).values({
    organizationId,
    name: 'Centre Hospitalier Universitaire',
    address: '1 Avenue de la République, 75001 Paris, France',
  }).returning();
  console.log(`✅ Created site: ${site.name}`);

  // 4. Create building
  const [building] = await db.insert(buildings).values({ siteId: site.id, name: 'Bâtiment Principal' }).returning();
  console.log(`✅ Created building: ${building.name}`);

  // 5. Create floors
  console.log('\n📐 Creating floors...');
  const floorMap = new Map<string, string>();
  for (const [locationKey, floorData] of Object.entries(FLOOR_MAPPING)) {
    const [floor] = await db.insert(floors).values({ buildingId: building.id, floorNumber: floorData.number, name: floorData.name }).returning();
    floorMap.set(locationKey, floor.id);
    console.log(`  ✓ ${floorData.name}`);
  }

  // 6. Create zones
  console.log('\n📦 Creating zones...');
  const zoneMap = new Map<string, { floorId: string; zoneId: string }>();
  const uniqueZones = new Set(valveData.allValves.map((v: ValveInfo) => `${v.location}::${v.zone}`));
  
  for (const zoneKey of uniqueZones) {
    const parts = zoneKey.split('::');
    const location = parts[0];
    const zoneName = parts[1];
    const floorId = floorMap.get(location);
    if (!floorId) continue;
    const [zone] = await db.insert(zones).values({ floorId, name: zoneName }).returning();
    zoneMap.set(zoneKey, { floorId, zoneId: zone.id });
  }
  console.log(`  ✓ Created ${zoneMap.size} zones`);

  // 7. Create gas sources
  console.log('\n⛽ Creating gas sources...');
  const sources_data = [
    { name: 'Source Oxygène Principal', gasType: 'oxygen' },
    { name: 'Source Protoxyde d\'Azote', gasType: 'nitrous_oxide' },
    { name: 'Source Air Médical', gasType: 'medical_air' },
    { name: 'Groupe de Vide', gasType: 'vacuum' },
  ];
  for (const s of sources_data) {
    await db.insert(sources).values({ siteId: site.id, ...s });
  }

  // 8. Create valves
  console.log('\n🔧 Creating valves...');
  let totalCount = 0;
  
  for (const valveInfo of valveData.allValves) {
    const [valve] = await db.insert(valves).values({
      siteId: site.id,
      name: valveInfo.id,
      valveType: valveInfo.type,
      gasType: valveInfo.gasType,
      state: 'open',
    }).returning();

    const zoneKey = `${valveInfo.location}::${valveInfo.zone}`;
    const zoneInfo = zoneMap.get(zoneKey);
    if (!zoneInfo) continue;

    await db.insert(nodes).values({
      siteId: site.id,
      elementId: valve.id,
      nodeType: 'valve',
      buildingId: building.id,
      floorId: zoneInfo.floorId,
      zoneId: zoneInfo.zoneId,
    });
    totalCount++;
  }

  console.log(`✅ Created ${totalCount} valves with nodes`);
  console.log('\n✨ Hospital demo data seeded successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Site: ${site.name}`);
  console.log(`   Buildings: 1`);
  console.log(`   Floors: ${floorMap.size}`);
  console.log(`   Zones: ${zoneMap.size}`);
  console.log(`   Valves: ${totalCount}`);
}

main().catch(console.error).finally(() => process.exit(0));
