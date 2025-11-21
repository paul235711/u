#!/usr/bin/env tsx
/**
 * Seed script v3 for a realistic hospital medical gas demo
 * - Single hospital site
 * - 3 buildings with a few floors each
 * - Zones per floor
 * - ~30 valves spread across buildings/floors/zones
 *
 * Usage: npx tsx scripts/seed-hospital-demo.v3.ts <user-email>
 */

import { db } from '@/lib/db/drizzle';
import {
  users,
  teams,
  organizations,
  teamMembers,
  sites,
  buildings,
  floors,
  zones,
  sources,
  valves,
  nodes,
  layouts,
  nodePositions,
  connections,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Basic types
// These mirror the allowed values for gasType / valveType in the schema

type ValveGasType = 'oxygen' | 'nitrous_oxide' | 'medical_air' | 'vacuum';
type ValveKind = 'isolation' | 'secondary';

interface DemoZoneConfig {
  id: string;
  name: string;
  gasTypes: ValveGasType[];
}

interface DemoFloorConfig {
  floorNumber: number;
  name: string;
  zones: DemoZoneConfig[];
}

interface DemoBuildingConfig {
  key: string;
  name: string;
  latitudeOffset: number;
  longitudeOffset: number;
  floors: DemoFloorConfig[];
}

interface ValveNodeRef {
  nodeId: string;
  gasType: ValveGasType;
  buildingKey: string;
  level: 'building' | 'floor' | 'zone';
  floorNumber?: number;
  zoneId?: string;
}

// Approximate coordinates for the demo site (central Paris)
const SITE_COORDS = {
  latitude: 48.8566,
  longitude: 2.3522,
};

// Simple, realistic hospital configuration
const BUILDINGS_CONFIG: DemoBuildingConfig[] = [
  {
    key: 'dominicaines',
    name: 'Bâtiment Dominicaines',
    latitudeOffset: 0.0005,
    longitudeOffset: -0.0008,
    floors: [
      {
        floorNumber: 0,
        name: 'Rez-de-chaussée - Admissions et consultations',
        zones: [
          {
            id: 'DOM-RDC-URGENCES',
            name: 'Urgences et admissions',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
          {
            id: 'DOM-RDC-CONSULT',
            name: 'Consultations pédiatrie',
            gasTypes: ['oxygen', 'medical_air'],
          },
        ],
      },
      {
        floorNumber: 1,
        name: '1er étage - Médecine A',
        zones: [
          {
            id: 'DOM-1-MEDA',
            name: 'Service Médecine A',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
    ],
  },
  {
    key: 'medecine',
    name: 'Bâtiment Médecine',
    latitudeOffset: 0,
    longitudeOffset: 0.0006,
    floors: [
      {
        floorNumber: 0,
        name: 'Rez-de-chaussée - Urgences',
        zones: [
          {
            id: 'MED-RDC-URGENCES',
            name: 'Zone urgences adultes',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
      {
        floorNumber: 2,
        name: '2ème étage - Médecine C',
        zones: [
          {
            id: 'MED-2-MEDC',
            name: 'Service Médecine C',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
    ],
  },
  {
    key: 'chirurgie',
    name: 'Bâtiment Chirurgie',
    latitudeOffset: -0.0007,
    longitudeOffset: -0.0004,
    floors: [
      {
        floorNumber: -1,
        name: 'Sous-sol - Bloc opératoire',
        zones: [
          {
            id: 'CHI-SS-BLOC',
            name: 'Blocs opératoires',
            gasTypes: ['oxygen', 'nitrous_oxide', 'medical_air', 'vacuum'],
          },
          {
            id: 'CHI-SS-REVEIL',
            name: 'Salle de réveil',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
      {
        floorNumber: 1,
        name: '1er étage - Chirurgie hospitalisation',
        zones: [
          {
            id: 'CHI-1-HOSP',
            name: 'Unité de chirurgie hospitalisation',
            gasTypes: ['oxygen', 'medical_air'],
          },
        ],
      },
    ],
  },
];

interface PlannedValve {
  code: string;
  kind: ValveKind;
  gasType: ValveGasType;
}

// Plan zone-level valves: one secondary valve per gas in the zone
function planValvesForZone(zone: DemoZoneConfig): PlannedValve[] {
  return zone.gasTypes.map((gas, index) => ({
    code: `${zone.id}-${gas.toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
    kind: 'secondary',
    gasType: gas,
  }));
}

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('❌ Error: Please provide a user email');
    console.log('Usage: npx tsx scripts/seed-hospital-demo.v3.ts <user-email>');
    process.exit(1);
  }

  console.log('🏥 Starting hospital demo data seed (v3 - realistic single hospital)...');
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
    const [newTeam] = await db
      .insert(teams)
      .values({ name: 'Hôpital Central Demo' })
      .returning();
    teamId = newTeam.id;

    const [newOrg] = await db
      .insert(organizations)
      .values({ name: 'Hôpital Central Demo', teamId })
      .returning();
    organizationId = newOrg.id;

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

  // 4. Create buildings, floors, zones, sources and valves
  console.log('\n🏢 Creating buildings, floors, zones, sources and valves...');

  let totalFloors = 0;
  let totalZones = 0;
  let totalValves = 0;

  const buildingValveNodes: ValveNodeRef[] = [];
  const floorValveNodes: ValveNodeRef[] = [];
  const zoneValveNodes: ValveNodeRef[] = [];

  // Determine all gases used anywhere in the hospital and create site-level sources
  const allGasTypes = new Set<ValveGasType>();
  for (const buildingConfig of BUILDINGS_CONFIG) {
    for (const floorConfig of buildingConfig.floors) {
      for (const zoneConfig of floorConfig.zones) {
        for (const gas of zoneConfig.gasTypes) {
          allGasTypes.add(gas);
        }
      }
    }
  }

  const gasLabels: Record<ValveGasType, string> = {
    oxygen: "Oxygène médicinal",
    nitrous_oxide: "Protoxyde d'azote médicinal",
    medical_air: "Air médical",
    vacuum: 'Vide médical',
  };

  for (const gas of allGasTypes) {
    await db.insert(sources).values({
      siteId: site.id,
      name: `${gasLabels[gas]} - Site principal`,
      gasType: gas,
    });
  }

  for (const buildingConfig of BUILDINGS_CONFIG) {
    const [building] = await db
      .insert(buildings)
      .values({
        siteId: site.id,
        name: buildingConfig.name,
        latitude: SITE_COORDS.latitude + buildingConfig.latitudeOffset,
        longitude: SITE_COORDS.longitude + buildingConfig.longitudeOffset,
      })
      .returning();

    console.log(`\n✅ Building: ${buildingConfig.name}`);

    // Gases present in this building (union of all its zones)
    const buildingGasTypes = new Set<ValveGasType>();
    for (const floorConfig of buildingConfig.floors) {
      for (const zoneConfig of floorConfig.zones) {
        for (const gas of zoneConfig.gasTypes) {
          buildingGasTypes.add(gas);
        }
      }
    }

    // Building-level cutoff valves: one per gas present in the building
    for (const gas of buildingGasTypes) {
      const [valve] = await db
        .insert(valves)
        .values({
          siteId: site.id,
          name: `${buildingConfig.key.toUpperCase()}-MAIN-${gas.toUpperCase()}`,
          valveType: 'isolation',
          gasType: gas,
          state: 'open',
        })
        .returning();

      const [buildingNode] = await db
        .insert(nodes)
        .values({
          siteId: site.id,
          elementId: valve.id,
          nodeType: 'valve',
          buildingId: building.id,
        })
        .returning();

      if (buildingNode) {
        buildingValveNodes.push({
          nodeId: buildingNode.id,
          gasType: gas,
          buildingKey: buildingConfig.key,
          level: 'building',
        });
      }

      totalValves++;
    }

    for (const floorConfig of buildingConfig.floors) {
      const [floor] = await db
        .insert(floors)
        .values({
          buildingId: building.id,
          floorNumber: floorConfig.floorNumber,
          name: floorConfig.name,
        })
        .returning();

      totalFloors++;

      // Gases present on this floor (union of its zones)
      const floorGasTypes = new Set<ValveGasType>();
      for (const zoneConfig of floorConfig.zones) {
        for (const gas of zoneConfig.gasTypes) {
          floorGasTypes.add(gas);
        }
      }

      // Floor-level valves (not attached to a specific zone): one per gas on the floor
      for (const gas of floorGasTypes) {
        const [floorValve] = await db
          .insert(valves)
          .values({
            siteId: site.id,
            name: `${buildingConfig.key.toUpperCase()}-F${floorConfig.floorNumber}-${gas.toUpperCase()}`,
            valveType: 'isolation',
            gasType: gas,
            state: 'open',
          })
          .returning();

        const [floorNode] = await db
          .insert(nodes)
          .values({
            siteId: site.id,
            elementId: floorValve.id,
            nodeType: 'valve',
            buildingId: building.id,
            floorId: floor.id,
          })
          .returning();

        if (floorNode) {
          floorValveNodes.push({
            nodeId: floorNode.id,
            gasType: gas,
            buildingKey: buildingConfig.key,
            level: 'floor',
            floorNumber: floorConfig.floorNumber,
          });
        }

        totalValves++;
      }

      for (const zoneConfig of floorConfig.zones) {
        const [zone] = await db
          .insert(zones)
          .values({
            floorId: floor.id,
            name: zoneConfig.name,
          })
          .returning();

        totalZones++;

        const plannedValves = planValvesForZone(zoneConfig);

        for (const planned of plannedValves) {
          const [valve] = await db
            .insert(valves)
            .values({
              siteId: site.id,
              name: planned.code,
              valveType: planned.kind,
              gasType: planned.gasType,
              state: 'open',
            })
            .returning();

          const [zoneNode] = await db
            .insert(nodes)
            .values({
              siteId: site.id,
              elementId: valve.id,
              nodeType: 'valve',
              buildingId: building.id,
              floorId: floor.id,
              zoneId: zone.id,
            })
            .returning();

          if (zoneNode) {
            zoneValveNodes.push({
              nodeId: zoneNode.id,
              gasType: planned.gasType,
              buildingKey: buildingConfig.key,
              level: 'zone',
              floorNumber: floorConfig.floorNumber,
              zoneId: zoneConfig.id,
            });
          }

          totalValves++;
        }
      }
    }
  }

  // 5. Create a site-level layout and place all equipment nodes on it
  const [siteLayout] = await db
    .insert(layouts)
    .values({
      siteId: site.id,
      name: 'Synoptique général du site',
      layoutType: 'site',
    })
    .returning();

  // Fetch all valve nodes for this site to place them on the layout
  const equipmentNodes = await db
    .select()
    .from(nodes)
    .where(eq(nodes.siteId, site.id));

  const allNodeIds = equipmentNodes.map((n: any) => n.id as string);

  const columns = Math.max(1, Math.ceil(Math.sqrt(allNodeIds.length || 1)));
  const spacingX = 200;
  const spacingY = 160;

  for (let index = 0; index < allNodeIds.length; index++) {
    const nodeId = allNodeIds[index];
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = (col + 1) * spacingX;
    const y = (row + 1) * spacingY;

    await db.insert(nodePositions).values({
      layoutId: siteLayout.id,
      nodeId,
      xPosition: x,
      yPosition: y,
      rotation: 0,
    });
  }

  // 6. Create logical connections between building, floor and zone valves
  for (const buildingConfig of BUILDINGS_CONFIG) {
    const buildingKey = buildingConfig.key;

    const mainNodes = buildingValveNodes.filter((n) => n.buildingKey === buildingKey);

    for (const main of mainNodes) {
      const floorNodesForGas = floorValveNodes.filter(
        (n) => n.buildingKey === buildingKey && n.gasType === main.gasType,
      );

      for (const floorNode of floorNodesForGas) {
        await db.insert(connections).values({
          siteId: site.id,
          fromNodeId: main.nodeId,
          toNodeId: floorNode.nodeId,
          gasType: main.gasType,
        });
      }
    }

    for (const floorConfig of buildingConfig.floors) {
      const floorNodes = floorValveNodes.filter(
        (n) => n.buildingKey === buildingKey && n.floorNumber === floorConfig.floorNumber,
      );

      for (const floorNode of floorNodes) {
        const zoneNodesForFloor = zoneValveNodes.filter(
          (z) =>
            z.buildingKey === buildingKey &&
            z.floorNumber === floorConfig.floorNumber &&
            z.gasType === floorNode.gasType,
        );

        for (const zoneNode of zoneNodesForFloor) {
          await db.insert(connections).values({
            siteId: site.id,
            fromNodeId: floorNode.nodeId,
            toNodeId: zoneNode.nodeId,
            gasType: floorNode.gasType,
          });
        }
      }
    }
  }

  console.log('\n✨ Hospital demo data (v3) seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Site: ${site.name}`);
  console.log(`   Buildings: ${BUILDINGS_CONFIG.length}`);
  console.log(`   Floors: ${totalFloors}`);
  console.log(`   Zones: ${totalZones}`);
  console.log(`   Valves: ${totalValves}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed script failed:', err);
  })
  .finally(() => process.exit(0));
