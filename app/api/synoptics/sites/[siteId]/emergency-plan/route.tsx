import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { 
  getSiteWithHierarchy, 
  getNodesWithElementDataBySiteId,
  getMediaByElement,
} from '@/lib/db/synoptics-queries';
import { readFile } from 'fs/promises';
import { join } from 'path';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ValveNode {
  id: string;
  elementId: string;
  nodeType: string;
  name?: string;
  valveType?: string;
  gasType?: string;
  state?: string;
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
  photoDataUri?: string;
}

interface Building {
  id: string;
  name: string;
  floors?: Floor[];
}

interface Floor {
  id: string;
  name?: string;
  floorNumber?: number;
  zones?: Zone[];
}

interface Zone {
  id: string;
  name: string;
}

// Gas type configuration matching your UI
const GAS_COLORS: Record<string, string> = {
  oxygen: '#3B82F6',
  medical_air: '#06B6D4',
  nitrous_oxide: '#8B5CF6',
  carbon_dioxide: '#10B981',
  nitrogen: '#6B7280',
  vacuum: '#F59E0B',
};

const GAS_LABELS: Record<string, string> = {
  oxygen: 'O₂',
  medical_air: 'AIR',
  nitrous_oxide: 'N₂O',
  carbon_dioxide: 'CO₂',
  nitrogen: 'N₂',
  vacuum: 'VAC',
};

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2 solid #E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  emergencyBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
    border: '2 solid #DC2626',
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  buildingSection: {
    marginBottom: 20,
    breakInside: 'avoid',
  },
  buildingHeader: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    marginBottom: 10,
    borderLeft: '4 solid #6366F1',
  },
  buildingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4338CA',
  },
  floorSection: {
    marginLeft: 15,
    marginBottom: 15,
  },
  floorHeader: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    marginBottom: 8,
    borderLeft: '3 solid #10B981',
  },
  floorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
  },
  zoneSection: {
    marginLeft: 25,
    marginBottom: 12,
  },
  zoneHeader: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    marginBottom: 6,
    borderLeft: '2 solid #F59E0B',
  },
  zoneTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
  },
  valveCard: {
    marginLeft: 35,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    border: '1 solid #E5E7EB',
    borderRadius: 4,
  },
  valveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  valveName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  gasBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  valveDetails: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    gap: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 9,
    color: '#1F2937',
  },
  valvePhoto: {
    width: 120,
    height: 90,
    objectFit: 'cover',
    marginTop: 6,
    border: '1 solid #E5E7EB',
    borderRadius: 3,
  },
  photoCaption: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 3,
    fontStyle: 'italic',
  },
  legendPage: {
    padding: 40,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
  },
  legendSection: {
    marginBottom: 20,
  },
  legendSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4B5563',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  legendColor: {
    width: 30,
    height: 20,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 10,
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 8,
  },
});

// PDF Components
const EmergencyPlanDocument: React.FC<{
  siteData: any;
  buildings: Building[];
  valvesByBuilding: Map<string, ValveNode[]>;
  valvesByFloor: Map<string, ValveNode[]>;
  valvesByZone: Map<string, ValveNode[]>;
  totalValves: number;
  generatedDate: string;
}> = ({ siteData, buildings, valvesByBuilding, valvesByFloor, valvesByZone, totalValves, generatedDate }) => {
  
  const uniqueGases = new Set<string>();
  [valvesByBuilding, valvesByFloor, valvesByZone].forEach(map => {
    map.forEach(valves => {
      valves.forEach(v => v.gasType && uniqueGases.add(v.gasType));
    });
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>⚠️ EMERGENCY VALVE SHUTDOWN PLAN ⚠️</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{siteData.name}</Text>
          {siteData.address && (
            <Text style={styles.subtitle}>📍 {siteData.address}</Text>
          )}
          <Text style={styles.subtitle}>Generated: {generatedDate}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BUILDINGS</Text>
            <Text style={styles.statValue}>{buildings.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL VALVES</Text>
            <Text style={styles.statValue}>{totalValves}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>GAS TYPES</Text>
            <Text style={styles.statValue}>{uniqueGases.size}</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={[styles.legendSubtitle, { marginBottom: 15 }]}>📋 DOCUMENT PURPOSE</Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#4B5563' }}>
            This document provides a complete reference of all isolation valves on site, organized by building, floor, and zone. 
            In case of emergency, use this guide to quickly identify which valves need to be closed to isolate affected areas.
          </Text>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={[styles.legendSubtitle, { marginBottom: 15 }]}>🎯 GASES PRESENT ON SITE</Text>
          {Array.from(uniqueGases).map(gasType => (
            <View key={gasType} style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: GAS_COLORS[gasType] || '#6B7280' }]} />
              <Text style={styles.legendLabel}>
                {GAS_LABELS[gasType] || gasType.toUpperCase()} - {gasType.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Confidential - For Emergency Use Only</Text>
          <Text>Page 1</Text>
        </View>
      </Page>

      {/* Building Pages */}
      {buildings.map((building, buildingIdx) => {
        const floors = (building.floors || []).slice().sort((a: any, b: any) => {
          const numA = typeof a.floorNumber === 'number' ? a.floorNumber : a.number || 0;
          const numB = typeof b.floorNumber === 'number' ? b.floorNumber : b.number || 0;
          return numB - numA;
        });

        return (
          <Page key={building.id} size="A4" style={styles.page}>
            <View style={styles.buildingSection}>
              <View style={styles.buildingHeader}>
                <Text style={styles.buildingTitle}>🏢 BUILDING: {building.name}</Text>
              </View>

              {/* Building-level valves */}
              {(valvesByBuilding.get(building.id) || []).map(valve => (
                <ValveCard key={valve.id} valve={valve} />
              ))}

              {/* Floors */}
              {floors.map(floor => {
                const floorValves = valvesByFloor.get(floor.id) || [];
                const zones = floor.zones || [];
                const hasContent = floorValves.length > 0 || zones.some(z => (valvesByZone.get(z.id) || []).length > 0);
                
                if (!hasContent) return null;

                return (
                  <View key={floor.id} style={styles.floorSection}>
                    <View style={styles.floorHeader}>
                      <Text style={styles.floorTitle}>
                        📐 FLOOR: {floor.name || `Level ${floor.floorNumber}`}
                      </Text>
                    </View>

                    {floorValves.map(valve => (
                      <ValveCard key={valve.id} valve={valve} />
                    ))}

                    {/* Zones */}
                    {zones.map(zone => {
                      const zoneValves = valvesByZone.get(zone.id) || [];
                      if (zoneValves.length === 0) return null;

                      return (
                        <View key={zone.id} style={styles.zoneSection}>
                          <View style={styles.zoneHeader}>
                            <Text style={styles.zoneTitle}>📦 ZONE: {zone.name}</Text>
                          </View>
                          {zoneValves.map(valve => (
                            <ValveCard key={valve.id} valve={valve} />
                          ))}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Text>{siteData.name}</Text>
              <Text>Page {buildingIdx + 2}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

const ValveCard: React.FC<{ valve: ValveNode }> = ({ valve }) => {
  const gasColor = GAS_COLORS[valve.gasType || ''] || '#6B7280';
  const gasLabel = GAS_LABELS[valve.gasType || ''] || valve.gasType?.toUpperCase() || 'N/A';

  return (
    <View style={styles.valveCard}>
      <View style={styles.valveHeader}>
        <Text style={styles.valveName}>{valve.name || 'Unnamed Valve'}</Text>
        {valve.gasType && (
          <View style={[styles.gasBadge, { backgroundColor: gasColor }]}>
            <Text>{gasLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.valveDetails}>
        {valve.valveType && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{valve.valveType}</Text>
          </View>
        )}
        {valve.state && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Normal state:</Text>
            <Text style={styles.detailValue}>{valve.state.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {valve.photoDataUri && (
        <View>
          <Image src={valve.photoDataUri} style={styles.valvePhoto} />
          <Text style={styles.photoCaption}>Photo: {valve.name}</Text>
        </View>
      )}
    </View>
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const user = await getUser();
    const { siteId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteData = await getSiteWithHierarchy(siteId);
    if (!siteData) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const nodes = await getNodesWithElementDataBySiteId(siteId);
    const valveNodes: ValveNode[] = nodes.filter(
      (node: any) => node?.nodeType === 'valve'
    );

    // Load photos for valves
    for (const valve of valveNodes) {
      try {
        const mediaItems = await getMediaByElement(valve.elementId, 'valve');
        if (mediaItems && mediaItems.length > 0) {
          const imageMedia = mediaItems.find((m: any) =>
            typeof m.mimeType === 'string' && m.mimeType.startsWith('image/')
          );
          
          if (imageMedia) {
            const relativePath = imageMedia.storagePath?.startsWith('/')
              ? imageMedia.storagePath.slice(1)
              : imageMedia.storagePath;
            
            if (relativePath) {
              const filePath = join(process.cwd(), 'public', relativePath);
              const imageBuffer = await readFile(filePath);
              const base64 = imageBuffer.toString('base64');
              const mimeType = imageMedia.mimeType || 'image/jpeg';
              valve.photoDataUri = `data:${mimeType};base64,${base64}`;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to load photo for valve ${valve.id}:`, error);
      }
    }

    // Group valves by location
    const valvesByBuilding = new Map<string, ValveNode[]>();
    const valvesByFloor = new Map<string, ValveNode[]>();
    const valvesByZone = new Map<string, ValveNode[]>();

    for (const valve of valveNodes) {
      if (valve.zoneId) {
        const list = valvesByZone.get(valve.zoneId) || [];
        list.push(valve);
        valvesByZone.set(valve.zoneId, list);
      } else if (valve.floorId) {
        const list = valvesByFloor.get(valve.floorId) || [];
        list.push(valve);
        valvesByFloor.set(valve.floorId, list);
      } else if (valve.buildingId) {
        const list = valvesByBuilding.get(valve.buildingId) || [];
        list.push(valve);
        valvesByBuilding.set(valve.buildingId, list);
      }
    }

    const generatedDate = new Date().toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const pdfDoc = (
      <EmergencyPlanDocument
        siteData={siteData}
        buildings={siteData.buildings || []}
        valvesByBuilding={valvesByBuilding}
        valvesByFloor={valvesByFloor}
        valvesByZone={valvesByZone}
        totalValves={valveNodes.length}
        generatedDate={generatedDate}
      />
    );

    const stream = await renderToStream(pdfDoc);
    const fileName = `emergency-plan-${siteData.name.replace(/\s+/g, '-')}.pdf`;

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating emergency plan PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate emergency plan PDF' },
      { status: 500 }
    );
  }
}
