"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SiteHierarchyManager,
  SiteEquipmentProvider,
  SiteEquipmentMapTabContent,
  SiteEquipmentListTabContent,
  SiteEquipmentDialogs,
  SiteLayoutTab,
} from '@/components/synoptics';
import { Building2, Layers, MapPin, Package } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  type TabValue = 'hierarchy' | 'map' | 'equipment' | 'layout';

  const currentTab: TabValue = (searchParams.get('tab') as TabValue) ?? 'hierarchy';

  const handleTabChange = (value: string) => {
    const tab = (value as TabValue) || 'hierarchy';
    if (tab === currentTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <SiteEquipmentProvider
      siteId={siteId}
      siteName={siteData?.name ?? ''}
      siteLatitude={latitude}
      siteLongitude={longitude}
      buildings={siteData?.buildings ?? []}
    >
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
        <TabsTrigger value="hierarchy" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {t('synoptics.siteDetail.tabs.hierarchy')}
        </TabsTrigger>
        <TabsTrigger value="map" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('synoptics.siteDetail.tabs.map')}
        </TabsTrigger>
        <TabsTrigger value="equipment" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {t('synoptics.siteDetail.tabs.equipment')}
        </TabsTrigger>
        <TabsTrigger value="layout" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {t('synoptics.siteDetail.tabs.layout')}
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
          <SiteEquipmentMapTabContent />
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <SiteEquipmentListTabContent />
        </TabsContent>

        <TabsContent value="layout" className="mt-6">
          <SiteLayoutTab siteId={siteId} layouts={layouts} />
        </TabsContent>
      </Tabs>

      <SiteEquipmentDialogs
        siteId={siteId}
        siteLatitude={latitude}
        siteLongitude={longitude}
      />
    </SiteEquipmentProvider>
  );
}

