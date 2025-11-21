#!/usr/bin/env tsx
/**
 * Seed script v2 for hospital medical gas valve system demo
 * - Uses 3 buildings: Dominicaines, Médecine, Chirurgie
 * - Distributes valves to buildings based on `service` text
 * - Creates floors and zones per building
 *
 * Usage: npx tsx scripts/seed-hospital-demo.v2.ts <user-email>
 */

import { db } from '@/lib/db/drizzle';
import { users, teams, organizations, teamMembers, sites, buildings, floors, zones, sources, valves, nodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { valveData } from './hospital-valve-data.js';

// Keep this in sync with hospital-valve-data.ts
type ValveInfo = {
  id: string;
  location: string;
  zone: string;
  service: string;
  type: 'isolation' | 'secondary';
  gasType: 'oxygen' | 'nitrous_oxide' | 'medical_air' | 'vacuum';
};

// Floor level mapping (shared across buildings)
const FLOOR_MAPPING: Record<string, { number: number; name: string }> = {
  EXTERIEUR: { number: -3, name: 'Extérieur (sous-sol stockage)' },
  '2-SOUS-SOL': { number: -2, name: 'Sous-sol -2 (Clinique)' },
  '1-SOUS-SOL': { number: -1, name: 'Sous-sol -1 (Services)' },
  'R.D CHAUS.': { number: 0, name: 'Rez-de-chaussée' },
  '1er ETAGE': { number: 1, name: '1er Étage' },
  '2ème ETAGE': { number: 2, name: '2ème Étage' },
  '3ème ETAGE': { number: 3, name: '3ème Étage' },
};

// Approximate coordinates for the demo site (central Paris) and its buildings
const SITE_COORDS = {
  latitude: 48.8566,
  longitude: 2.3522,
};

const BUILDING_COORDS: Record<BuildingKey, { latitude: number; longitude: number }> = {
  dominicaines: {
    latitude: SITE_COORDS.latitude + 0.0005,
    longitude: SITE_COORDS.longitude - 0.0008,
  },
  medecine: {
    latitude: SITE_COORDS.latitude,
    longitude: SITE_COORDS.longitude + 0.0006,
  },
  chirurgie: {
    latitude: SITE_COORDS.latitude - 0.0007,
    longitude: SITE_COORDS.longitude - 0.0004,
  },
};

// Building keys
const BUILDING_KEYS = ['dominicaines', 'medecine', 'chirurgie'] as const;
type BuildingKey = (typeof BUILDING_KEYS)[number];

const BUILDING_LABELS: Record<BuildingKey, string> = {
  dominicaines: 'Bâtiment Dominicaines',
  medecine: 'Bâtiment Médecine',
  chirurgie: 'Bâtiment Chirurgie',
};

// Canonical zone labels per building/floor for Dominicaines & Médecine
// Derived from the hospital panel: one main functional zone per floor.
const ZONE_LABELS: Partial<Record<BuildingKey, Record<string, string>>> = {
  dominicaines: {
    'SOUS-SOL': 'SOUS-SOL CENTRE HOSPITALIER', // not shown explicitly but consistent with data
    'R.D CHAUS.': 'CONSULTATIONS PEDIATRIE ET MATERNITE LABORATOIRE',
    '1er ETAGE': 'MEDECINE "A" + REEDUCATION',
    '2ème ETAGE': 'MEDECINE "B" + CONSULTATION',
    '3ème ETAGE': 'CONSULTATIONS EXTERNES',
  },
  medecine: {
    'SOUS-SOL': 'RADIOLOGIE',
    'R.D CHAUS.': 'URGENCES',
    '1er ETAGE': 'SERVICE TAMPON',
    '2ème ETAGE': 'MEDECINE "C"',
    '3ème ETAGE': 'S.S.R.',
  },
  chirurgie: {
    // Based on the Chirurgie building panel
    '2-SOUS-SOL': 'STERILISATION',
    '1-SOUS-SOL': 'BLOC OPERATOIRE / REANIMATION / SALLES NAISSANCE & REVEIL',
    'R.D CHAUS.': 'CHIRURGIE AMBULATOIRE + SOINS',
    '1er ETAGE': 'CHIRURGIE "1" CH.115 à 134',
    '2ème ETAGE': 'CHIRURGIE "2" CH.216 à 234',
  },
};

function getBuildingKeyForValve(service: string): BuildingKey {
  const s = service.toLowerCase();
  if (s.includes('dominicaines')) return 'dominicaines';
  if (s.includes('chirurgie')) return 'chirurgie';
  if (s.includes('medecine')) return 'medecine';
  // Fallback: attach generic / global entries to Médecine
  return 'medecine';
}

function normalizeValveZone(v: ValveInfo): ValveInfo {
  const key = getBuildingKeyForValve(v.service);
  const byBuilding = ZONE_LABELS[key];
  if (!byBuilding) return v;

  const label = byBuilding[v.location];
  if (!label) return v;

  return {
    ...v,
    zone: label,
  };
}

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('❌ Error: Please provide a user email');
    console.log('Usage: npx tsx scripts/seed-hospital-demo.v2.ts <user-email>');
    process.exit(1);
  }

  console.log('🏥 Starting hospital demo data seed (v2 - 3 buildings)...');
  console.log(`📧 User: ${userEmail}\n`);

  // 1. Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  if (!user) {
    console.error(`❌ User with email ${userEmail} not found`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email}`);

  // 2. Get or create team and organization
  const teamMember = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  let organizationId: string;
  let teamId: number;

  if (!teamMember.length) {
    // Create team first
    const [newTeam] = await db
      .insert(teams)
      .values({ name: 'Hôpital Central Demo' })
      .returning();
    teamId = newTeam.id;

    // Create organization linked to team
    const [newOrg] = await db
      .insert(organizations)
      .values({ name: 'Hôpital Central Demo', teamId })
      .returning();
    organizationId = newOrg.id;

    // Add user to team
    await db.insert(teamMembers).values({
      userId: user.id,
      teamId,
      role: 'owner',
    });

    console.log(`✅ Created organization: ${newOrg.name}`);
  } else {
    teamId = teamMember[0].teamId;
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.teamId, teamId))
      .limit(1);

    if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      const [newOrg] = await db
        .insert(organizations)
        .values({ name: 'Hôpital Central Demo', teamId })
        .returning();
      organizationId = newOrg.id;
    }
  }

  // 3. Create site
  const [site] = await db
    .insert(sites)
    .values({
      organizationId,
      name: 'Centre Hospitalier Universitaire',
      address: '1 Avenue de la République, 75001 Paris, France',
      latitude: SITE_COORDS.latitude,
      longitude: SITE_COORDS.longitude,
    })
    .returning();

  console.log(`✅ Created site: ${site.name}`);

  // 4. Split valves by building key
  const valvesByBuilding: Record<BuildingKey, ValveInfo[]> = {
    dominicaines: [],
    medecine: [],
    chirurgie: [],
  };

  for (const v of valveData.allValves as ValveInfo[]) {
    const key = getBuildingKeyForValve(v.service);
    const normalized = normalizeValveZone(v);
    valvesByBuilding[key].push(normalized);
  }

  // 5. Create buildings, floors, zones, valves + nodes per building
  console.log('\n🏢 Creating buildings, floors, zones and valves per building...');

  let totalFloors = 0;
  let totalZones = 0;
  let totalValves = 0;

  const buildingIdByKey = new Map<BuildingKey, string>();

  for (const key of BUILDING_KEYS) {
    const buildingValves = valvesByBuilding[key];
    if (buildingValves.length === 0) continue;

    // 5.1 Building
    const [building] = await db
      .insert(buildings)
      .values({
        siteId: site.id,
        name: BUILDING_LABELS[key],
        latitude: BUILDING_COORDS[key].latitude,
        longitude: BUILDING_COORDS[key].longitude,
      })
      .returning();

    buildingIdByKey.set(key, building.id);
    console.log(`\n✅ Building: ${BUILDING_LABELS[key]} (${buildingValves.length} valves)`);

    // 5.2 Floors for this building
    //    Derive floors from the actual valve locations used in this building
    //    so the counts match the real dataset more closely.
    const floorMap = new Map<string, string>();

    const baseLocations: string[] = Array.from(
      new Set<string>(buildingValves.map((v) => v.location as string)),
    );

    for (const locationKey of baseLocations) {
      const floorInfo = FLOOR_MAPPING[locationKey];
      if (!floorInfo) continue;

      const [floor] = await db
        .insert(floors)
        .values({
          buildingId: building.id,
          floorNumber: floorInfo.number,
          name: floorInfo.name,
        })
        .returning();

      floorMap.set(locationKey, floor.id);
      totalFloors++;
    }

    // 5.3 Zones for this building
    const zoneMap = new Map<string, { floorId: string; zoneId: string }>();

    const uniqueZones = new Set<string>(
      buildingValves.map((v) => `${v.location}::${v.zone}`),
    );

    for (const zoneKey of uniqueZones) {
      const [location, zoneName] = zoneKey.split('::');
      const floorId = floorMap.get(location);
      if (!floorId) continue;

      const [zone] = await db
        .insert(zones)
        .values({ floorId, name: zoneName })
        .returning();

      zoneMap.set(zoneKey, { floorId, zoneId: zone.id });
      totalZones++;
    }

    // 5.4 Gas sources (once per building for simplicity)
    const sourcesData = [
      { name: `Source Oxygène - ${BUILDING_LABELS[key]}`, gasType: 'oxygen' },
      { name: `Source Protoxyde d'Azote - ${BUILDING_LABELS[key]}`, gasType: 'nitrous_oxide' },
      { name: `Source Air Médical - ${BUILDING_LABELS[key]}`, gasType: 'medical_air' },
      { name: `Groupe de Vide - ${BUILDING_LABELS[key]}`, gasType: 'vacuum' },
    ];

    for (const s of sourcesData) {
      await db.insert(sources).values({ siteId: site.id, ...s });
    }

    // 5.5 Valves + nodes
    let buildingValveCount = 0;

    for (const valveInfo of buildingValves) {
      const [valve] = await db
        .insert(valves)
        .values({
          siteId: site.id,
          name: valveInfo.id,
          valveType: valveInfo.type,
          gasType: valveInfo.gasType,
          state: 'open',
        })
        .returning();

      const zoneKey = `${valveInfo.location}::${valveInfo.zone}`;
      const zoneInfo = zoneMap.get(zoneKey);
      if (zoneInfo) {
        await db.insert(nodes).values({
          siteId: site.id,
          elementId: valve.id,
          nodeType: 'valve',
          buildingId: building.id,
          floorId: zoneInfo.floorId,
          zoneId: zoneInfo.zoneId,
        });
      } else {
        // Fallback: attach the valve node to the building without a specific floor/zone
        await db.insert(nodes).values({
          siteId: site.id,
          elementId: valve.id,
          nodeType: 'valve',
          buildingId: building.id,
        });
      }

      buildingValveCount++;
      totalValves++;
    }

    console.log(`   → Floors: ${floorMap.size}`);
    console.log(`   → Zones: ${zoneMap.size}`);
    console.log(`   → Valves: ${buildingValveCount}`);
  }

  // 6. Site-level sources & valves (not attached to specific buildings)
  console.log('\n🌐 Creating site-level sources and main cut-off valves...');

  const siteSources = [
    { name: "Oxygène médicinal - Principal évaporateur", gasType: 'oxygen' },
    { name: 'Oxygène médicinal - Secours 2 x 2 cadres V9', gasType: 'oxygen' },
    { name: "Air médical - Principal Modul'air", gasType: 'medical_air' },
    { name: "Air médical - Secours 2 x 1 cadre H16", gasType: 'medical_air' },
    { name: "Protoxyde d'azote médicinal - Principal 2 x 1 Bt", gasType: 'nitrous_oxide' },
    { name: "Protoxyde d'azote médicinal - Secours 1 Bt", gasType: 'nitrous_oxide' },
    { name: 'Aspiration médicale - Principal', gasType: 'vacuum' },
    { name: 'Aspiration - Secours', gasType: 'vacuum' },
  ] as const;

  for (const s of siteSources) {
    await db.insert(sources).values({ siteId: site.id, ...s });
  }

  // Main site-level isolation valves (no building / floor / zone)
  const siteValves: ValveInfo[] = [
    { id: 'EUM1', location: 'EXTERIEUR', zone: 'SITE', service: 'OXYGENE MEDICINAL PRINCIPAL EVAPORATEUR', type: 'isolation', gasType: 'oxygen' },
    { id: 'EUM201', location: 'EXTERIEUR', zone: 'SITE', service: "AIR MEDICAL PRINCIPAL MODUL'AIR", type: 'isolation', gasType: 'medical_air' },
    { id: 'EUM101', location: 'EXTERIEUR', zone: 'SITE', service: "PROTOXYDE D'AZOTE MEDICINAL PRINCIPAL", type: 'isolation', gasType: 'nitrous_oxide' },
    { id: 'V301S', location: 'EXTERIEUR', zone: 'SITE', service: 'ASPIRATION MEDICALE PRINCIPAL', type: 'isolation', gasType: 'vacuum' },
    { id: 'V305S', location: 'EXTERIEUR', zone: 'SITE', service: 'ASPIRATION SECOURS', type: 'isolation', gasType: 'vacuum' },
  ];

  for (const v of siteValves) {
    const [valve] = await db
      .insert(valves)
      .values({
        siteId: site.id,
        name: v.id,
        valveType: v.type,
        gasType: v.gasType,
        state: 'open',
      })
      .returning();

    await db.insert(nodes).values({
      siteId: site.id,
      elementId: valve.id,
      nodeType: 'valve',
      // No building / floor / zone: truly site-level
      outletCount: 0,
    });

    totalValves++;
  }

  console.log('\n✨ Hospital demo data (v2) seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Site: ${site.name}`);
  console.log(`   Buildings: ${buildingIdByKey.size}`);
  console.log(`   Floors: ${totalFloors}`);
  console.log(`   Zones: ${totalZones}`);
  console.log(`   Valves: ${totalValves}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed script failed:', err);
  })
  .finally(() => process.exit(0));
