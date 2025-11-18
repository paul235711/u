"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteHierarchyManager, SiteEquipmentMap } from '@/components/synoptics';
import { Building2, MapPin } from 'lucide-react';
import { useI18n } from '@/app/i18n-provider';

interface SiteDetailClientProps {
  siteData: any;
  siteId: string;
  organizationId: string;
  layouts: any[];
}

export function SiteDetailClient({ siteData, siteId, organizationId, layouts }: SiteDetailClientProps) {
  const latitude = siteData?.latitude ? parseFloat(siteData.latitude) : undefined;
  const longitude = siteData?.longitude ? parseFloat(siteData.longitude) : undefined;
  const { t } = useI18n();

  return (
    <Tabs defaultValue="hierarchy" className="w-full">
      <TabsList className="grid w-full max-w-lg grid-cols-2">
        <TabsTrigger value="hierarchy" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {t('synoptics.siteDetail.tabs.hierarchy')}
        </TabsTrigger>
        <TabsTrigger value="map" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('synoptics.siteDetail.tabs.map')}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="hierarchy" className="mt-6">
        <SiteHierarchyManager 
          siteData={siteData}
          siteId={siteId}
          organizationId={organizationId}
          layouts={layouts}
        />
      </TabsContent>

      <TabsContent value="map" className="mt-6">
        <SiteEquipmentMap
          siteId={siteId}
          siteName={siteData?.name ?? ''}
          siteLatitude={latitude}
          siteLongitude={longitude}
          buildings={siteData?.buildings ?? []}
        />
      </TabsContent>
    </Tabs>
  );
}
