'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteHierarchyManager, EquipmentManager } from '@/components/synoptics';
import { Building2, Box } from 'lucide-react';

interface SiteDetailClientProps {
  siteData: any;
  siteId: string;
  organizationId: string;
  layouts: any[];
}

export function SiteDetailClient({ siteData, siteId, organizationId, layouts }: SiteDetailClientProps) {
  return (
    <Tabs defaultValue="hierarchy" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="hierarchy" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Hierarchy
        </TabsTrigger>
        <TabsTrigger value="equipment" className="flex items-center gap-2">
          <Box className="h-4 w-4" />
          Equipment
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
      
      <TabsContent value="equipment" className="mt-6">
        <EquipmentManager 
          siteId={siteId}
        />
      </TabsContent>
    </Tabs>
  );
}
