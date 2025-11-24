#!/usr/bin/env tsx
/**
 * Seed script v4 for a realistic hospital medical gas demo
 * - Single hospital site
 * - Explicit 4-level distribution (site -> building -> floor -> zone)
 * - Asymmetric gas distribution across buildings and floors
 *
 * Usage: npx tsx scripts/seed-hospital-demo.v4.ts <user-email>
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
  media,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { mkdir, stat, copyFile } from 'fs/promises';
import { join } from 'path';

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
  buildingKey?: string;
  level: 'site' | 'building' | 'floor' | 'zone';
  floorNumber?: number;
  zoneId?: string;
}

// Approximate coordinates for the demo site (central Paris)
const SITE_COORDS = {
  latitude: 48.8566,
  longitude: 2.3522,
};

// Site-level gases (what is produced / stored on site)
const SITE_GASES: ValveGasType[] = ['oxygen', 'nitrous_oxide', 'medical_air', 'vacuum'];

// Simple, realistic hospital configuration (based on v3 but slightly richer)
const BUILDINGS_CONFIG: DemoBuildingConfig[] = [
  {
    key: 'dominicaines',
    name: 'Batiment Dominicaines',
    latitudeOffset: 0.0005,
    longitudeOffset: -0.0008,
    floors: [
      {
        floorNumber: 0,
        name: 'Rez-de-chaussee - Admissions et consultations',
        zones: [
          {
            id: 'DOM-RDC-URGENCES',
            name: 'Urgences et admissions',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
          {
            id: 'DOM-RDC-CONSULT',
            name: 'Consultations pediatrie',
            gasTypes: ['oxygen', 'medical_air'],
          },
        ],
      },
      {
        floorNumber: 1,
        name: '1er etage - Medecine A',
        zones: [
          {
            id: 'DOM-1-MEDA',
            name: 'Service Medecine A',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
          {
            id: 'DOM-1-USC',
            name: 'Unite de soins continus',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
    ],
  },
  {
    key: 'medecine',
    name: 'Batiment Medecine',
    latitudeOffset: 0,
    longitudeOffset: 0.0006,
    floors: [
      {
        floorNumber: 0,
        name: 'Rez-de-chaussee - Urgences',
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
        name: '2e etage - Medecine C',
        zones: [
          {
            id: 'MED-2-MEDC',
            name: 'Service Medecine C',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
    ],
  },
  {
    key: 'chirurgie',
    name: 'Batiment Chirurgie',
    latitudeOffset: -0.0007,
    longitudeOffset: -0.0004,
    floors: [
      {
        floorNumber: -1,
        name: 'Sous-sol - Bloc operatoire',
        zones: [
          {
            id: 'CHI-SS-BLOC',
            name: 'Blocs operatoires',
            gasTypes: ['oxygen', 'nitrous_oxide', 'medical_air', 'vacuum'],
          },
          {
            id: 'CHI-SS-REVEIL',
            name: 'Salle de reveil',
            gasTypes: ['oxygen', 'medical_air', 'vacuum'],
          },
        ],
      },
      {
        floorNumber: 1,
        name: '1er etage - Chirurgie hospitalisation',
        zones: [
          {
            id: 'CHI-1-HOSP',
            name: 'Unite de chirurgie hospitalisation',
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

type MediaLevel = 'site' | 'building' | 'floor' | 'zone';

interface MediaVariantConfig {
  sourceSegments: string[];
  destFileName: string;
  storagePath: string;
  mimeType: string;
  label: string;
  gasType: ValveGasType | 'any';
}

const SAMPLE_MEDIA_CONFIG: Record<MediaLevel, MediaVariantConfig[]> = {
  site: [
    {
      sourceSegments: ['docs', 'img samples', 'source valve O2.png'],
      destFileName: 'site-main-oxygen.png',
      storagePath: '/uploads/media/site-main-oxygen.png',
      mimeType: 'image/png',
      label: 'Site main valve - Oxygen',
      gasType: 'oxygen',
    },
    {
      sourceSegments: ['docs', 'img samples', 'source valve AIR.png'],
      destFileName: 'site-main-medical-air.png',
      storagePath: '/uploads/media/site-main-medical-air.png',
      mimeType: 'image/png',
      label: 'Site main valve - Medical air',
      gasType: 'medical_air',
    },
    {
      sourceSegments: ['docs', 'img samples', 'source valve 2 - N2O.png'],
      destFileName: 'site-main-nitrous-oxide.png',
      storagePath: '/uploads/media/site-main-nitrous-oxide.png',
      mimeType: 'image/png',
      label: 'Site main valve - Nitrous oxide',
      gasType: 'nitrous_oxide',
    },
    {
      sourceSegments: ['docs', 'img samples', 'source valve vacuum.png'],
      destFileName: 'site-main-vacuum.png',
      storagePath: '/uploads/media/site-main-vacuum.png',
      mimeType: 'image/png',
      label: 'Site main valve - Vacuum',
      gasType: 'vacuum',
    },
  ],
  building: [
    {
      sourceSegments: ['docs', 'img samples', 'building valve O2.png'],
      destFileName: 'building-valve-oxygen.png',
      storagePath: '/uploads/media/building-valve-oxygen.png',
      mimeType: 'image/png',
      label: 'Building isolation valve - Oxygen',
      gasType: 'oxygen',
    },
    {
      sourceSegments: ['docs', 'img samples', 'building valve N2O.png'],
      destFileName: 'building-valve-nitrous-oxide.png',
      storagePath: '/uploads/media/building-valve-nitrous-oxide.png',
      mimeType: 'image/png',
      label: 'Building isolation valve - Nitrous oxide',
      gasType: 'nitrous_oxide',
    },
    {
      sourceSegments: ['docs', 'img samples', 'building valve AIR or VACUUM.png'],
      destFileName: 'building-valve-medical-air.png',
      storagePath: '/uploads/media/building-valve-medical-air.png',
      mimeType: 'image/png',
      label: 'Building isolation valve - Medical air',
      gasType: 'medical_air',
    },
    {
      sourceSegments: ['docs', 'img samples', 'building valve AIR or VACUUM.png'],
      destFileName: 'building-valve-vacuum.png',
      storagePath: '/uploads/media/building-valve-vacuum.png',
      mimeType: 'image/png',
      label: 'Building isolation valve - Vacuum',
      gasType: 'vacuum',
    },
  ],
  floor: [
    {
      sourceSegments: ['docs', 'img samples', 'floor valve all gases .png'],
      destFileName: 'floor-valve-all-gases.png',
      storagePath: '/uploads/media/floor-valve-all-gases.png',
      mimeType: 'image/png',
      label: 'Floor isolation valve (all gases)',
      gasType: 'any',
    },
  ],
  zone: [
    {
      sourceSegments: ['docs', 'img samples', 'zone valve detailed for O2.png'],
      destFileName: 'zone-valve-detailed-oxygen.png',
      storagePath: '/uploads/media/zone-valve-detailed-oxygen.png',
      mimeType: 'image/png',
      label: 'Zone valve box - Oxygen',
      gasType: 'oxygen',
    },
    {
      sourceSegments: ['docs', 'img samples', 'zone valve detailed for AIR.png'],
      destFileName: 'zone-valve-detailed-medical-air.png',
      storagePath: '/uploads/media/zone-valve-detailed-medical-air.png',
      mimeType: 'image/png',
      label: 'Zone valve box - Medical air',
      gasType: 'medical_air',
    },
    {
      sourceSegments: ['docs', 'img samples', 'zone valve detailed for N2O.jpeg'],
      destFileName: 'zone-valve-detailed-nitrous-oxide.jpeg',
      storagePath: '/uploads/media/zone-valve-detailed-nitrous-oxide.jpeg',
      mimeType: 'image/jpeg',
      label: 'Zone valve box - Nitrous oxide',
      gasType: 'nitrous_oxide',
    },
    {
      sourceSegments: ['docs', 'img samples', 'zone valve detailed for VACCUM.png'],
      destFileName: 'zone-valve-detailed-vacuum.png',
      storagePath: '/uploads/media/zone-valve-detailed-vacuum.png',
      mimeType: 'image/png',
      label: 'Zone valve box - Vacuum',
      gasType: 'vacuum',
    },
    {
      sourceSegments: ['docs', 'img samples', 'zone valve large (common for O2, VACUUM, N2O, AIR).png'],
      destFileName: 'zone-valve-large-all-gases.png',
      storagePath: '/uploads/media/zone-valve-large-all-gases.png',
      mimeType: 'image/png',
      label: 'Zone valve box - Generic',
      gasType: 'any',
    },
  ],
};

function getMediaVariant(level: MediaLevel, gasType: ValveGasType): MediaVariantConfig | null {
  const variants = SAMPLE_MEDIA_CONFIG[level];
  if (!variants || variants.length === 0) return null;

  const exactMatch = variants.find((variant) => variant.gasType === gasType);
  if (exactMatch) return exactMatch;

  const anyLevelVariant = variants.find((variant) => variant.gasType === 'any');
  if (anyLevelVariant) return anyLevelVariant;

  return variants[0] ?? null;
}

async function prepareSampleMediaFiles() {
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'media');
  await mkdir(uploadsDir, { recursive: true });

  for (const levelKey of Object.keys(SAMPLE_MEDIA_CONFIG) as MediaLevel[]) {
    const variants = SAMPLE_MEDIA_CONFIG[levelKey];

    for (const config of variants) {
      const sourcePath = join(process.cwd(), ...config.sourceSegments);
      const destPath = join(uploadsDir, config.destFileName);

      try {
        await stat(destPath);
      } catch {
        try {
          await copyFile(sourcePath, destPath);
        } catch (error) {
          console.warn('Failed to copy sample media file', sourcePath, '->', destPath, error);
        }
      }
    }
  }
}

async function attachMediaToValve(params: {
  siteId: string;
  valveId: string;
  level: MediaLevel;
  gasType: ValveGasType;
}) {
  const config = getMediaVariant(params.level, params.gasType);
  if (!config) return;

  try {
    await db.insert(media).values({
      siteId: params.siteId,
      elementId: params.valveId,
      elementType: 'valve',
      storagePath: config.storagePath,
      fileName: config.destFileName,
      mimeType: config.mimeType,
      label: config.label,
    });
  } catch (error) {
    console.warn('Failed to attach media to valve', params.valveId, 'level', params.level, error);
  }
}

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('Error: Please provide a user email');
    console.log('Usage: npx tsx scripts/seed-hospital-demo.v4.ts <user-email>');
    process.exit(1);
  }

  console.log('Starting hospital demo data seed (v4 - 4-level distribution)...');
  console.log(`User: ${userEmail}\n`);

  // 1. Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  if (!user) {
    console.error(`User with email ${userEmail} not found`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);

  await prepareSampleMediaFiles();

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
      .values({ name: 'Hospital Central Demo' })
      .returning();
    teamId = newTeam.id;

    const [newOrg] = await db
      .insert(organizations)
      .values({ name: 'Hospital Central Demo', teamId })
      .returning();
    organizationId = newOrg.id;

    await db.insert(teamMembers).values({
      userId: user.id,
      teamId,
      role: 'owner',
    });

    console.log(`Created organization: ${newOrg.name}`);
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
        .values({ name: 'Hospital Central Demo', teamId })
        .returning();
      organizationId = newOrg.id;
    }
  }

  // 3. Create site
  const [site] = await db
    .insert(sites)
    .values({
      organizationId,
      name: 'Croix-Rousse',
      address: '103 Gd Rue de la Croix-Rousse, 69004 Lyon',
      latitude: SITE_COORDS.latitude,
      longitude: SITE_COORDS.longitude,
    })
    .returning();

  console.log(`Created site: ${site.name}`);

  console.log('\nCreating buildings, floors, zones, sources and valves...');

  let totalFloors = 0;
  let totalZones = 0;
  let totalValves = 0;

  const siteValveNodes: ValveNodeRef[] = [];
  const buildingValveNodes: ValveNodeRef[] = [];
  const floorValveNodes: ValveNodeRef[] = [];
  const zoneValveNodes: ValveNodeRef[] = [];

  // 4. Create site-level sources and main valves
  const gasLabels: Record<ValveGasType, string> = {
    oxygen: 'Oxygene medicinal',
    nitrous_oxide: 'Protoxyde dazote medicinal',
    medical_air: 'Air medical',
    vacuum: 'Vide medical',
  };

  for (const gas of SITE_GASES) {
    await db.insert(sources).values({
      siteId: site.id,
      name: `${gasLabels[gas]} - Centrale`,
      gasType: gas,
    });

    // Create 1 main site valve per gas (general valve photos)
    const [valve] = await db
      .insert(valves)
      .values({
        siteId: site.id,
        name: `SITE-MAIN-${gas.toUpperCase()}`,
        valveType: 'isolation',
        gasType: gas,
        state: 'open',
      })
      .returning();

    const [node] = await db
      .insert(nodes)
      .values({
        siteId: site.id,
        elementId: valve.id,
        nodeType: 'valve',
      })
      .returning();

    await attachMediaToValve({
      siteId: site.id,
      valveId: valve.id,
      level: 'site',
      gasType: gas,
    });

    if (node) {
      siteValveNodes.push({
        nodeId: node.id,
        gasType: gas,
        level: 'site',
      });
    }

    totalValves++;
  }

  // 5. Create buildings, floors, zones and their valves
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

    console.log(`\nBuilding: ${buildingConfig.name}`);

    // Gases present in this building (union of all its zones, intersected with site gases)
    const buildingGasTypes = new Set<ValveGasType>();
    for (const floorConfig of buildingConfig.floors) {
      for (const zoneConfig of floorConfig.zones) {
        for (const gas of zoneConfig.gasTypes) {
          if (SITE_GASES.includes(gas)) {
            buildingGasTypes.add(gas);
          }
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

      await attachMediaToValve({
        siteId: site.id,
        valveId: valve.id,
        level: 'building',
        gasType: gas,
      });

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
          if (buildingGasTypes.has(gas)) {
            floorGasTypes.add(gas);
          }
        }
      }

      // Floor-level valves: one isolation valve per gas on the floor
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

        await attachMediaToValve({
          siteId: site.id,
          valveId: floorValve.id,
          level: 'floor',
          gasType: gas,
        });

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

          await attachMediaToValve({
            siteId: site.id,
            valveId: valve.id,
            level: 'zone',
            gasType: planned.gasType,
          });

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

  // 6. Create a site-level layout and place all equipment nodes on it
  const [siteLayout] = await db
    .insert(layouts)
    .values({
      siteId: site.id,
      name: 'Synoptique general du site (v4)',
      layoutType: 'site',
    })
    .returning();

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

  // 7. Create logical connections: site -> building -> floor -> zone

  // site -> building per gas
  for (const siteNode of siteValveNodes) {
    const buildingNodesForGas = buildingValveNodes.filter(
      (b) => b.gasType === siteNode.gasType,
    );

    for (const buildingNode of buildingNodesForGas) {
      await db.insert(connections).values({
        siteId: site.id,
        fromNodeId: siteNode.nodeId,
        toNodeId: buildingNode.nodeId,
        gasType: siteNode.gasType,
      });
    }
  }

  // building -> floor -> zone
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

  console.log('\nHospital demo data (v4) seeded successfully.');
  console.log('\nSummary:');
  console.log(`   Site: ${site.name}`);
  console.log(`   Buildings: ${BUILDINGS_CONFIG.length}`);
  console.log(`   Floors: ${totalFloors}`);
  console.log(`   Zones: ${totalZones}`);
  console.log(`   Valves: ${totalValves}`);
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
  })
  .finally(() => process.exit(0));
