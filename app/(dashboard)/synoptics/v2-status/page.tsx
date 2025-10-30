'use client';

import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function V2StatusPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Synoptics V2 Status</h1>
      
      <div className="space-y-4">
        <StatusCard 
          name="Element Properties Panel"
          active={FEATURE_FLAGS.USE_NEW_PROPERTIES_PANEL}
          route="/synoptics/layouts/[any-layout-id]"
          description="Click on any node to see V2 properties panel"
        />
        
        <StatusCard 
          name="Layout Editor"
          active={FEATURE_FLAGS.USE_NEW_LAYOUT_EDITOR}
          route="/synoptics/layouts/[any-layout-id]"
          description="Full layout editor with V2 architecture"
        />
        
        <StatusCard 
          name="Hierarchy Manager"
          active={FEATURE_FLAGS.USE_NEW_HIERARCHY_MANAGER}
          route="/synoptics/sites/[site-id]"
          description="Site hierarchy management (infrastructure ready)"
        />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold text-blue-900 mb-2">Active Components</h2>
        <p className="text-blue-700 text-sm">
          {FEATURE_FLAGS.USE_NEW_PROPERTIES_PANEL && FEATURE_FLAGS.USE_NEW_LAYOUT_EDITOR
            ? '✅ All core V2 components are ACTIVE in production!'
            : 'Some V2 components are disabled. Check .env file.'}
        </p>
      </div>
    </div>
  );
}

function StatusCard({ name, active, route, description }: {
  name: string;
  active: boolean;
  route: string;
  description: string;
}) {
  return (
    <div className="border rounded-lg p-4 flex items-start gap-4">
      {active ? (
        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
      ) : (
        <XCircle className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-gray-600 mb-1">{description}</p>
        <p className="text-xs text-gray-500">Route: {route}</p>
        <div className="mt-2">
          {active ? (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              ACTIVE
            </span>
          ) : (
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              INACTIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
