/**
 * Test page for new Synoptics V2 architecture
 * Demonstrates Zustand state management and React Query integration
 */

'use client';

import { LayoutEditorHeader } from '@/components/synoptics-v2/components/LayoutEditorHeader';
import { useUIStore } from '@/components/synoptics-v2/stores/ui-store';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function TestV2Page() {
  const reset = useUIStore((state) => state.reset);
  const isLocked = useUIStore((state) => state.isLocked);
  const isFullscreen = useUIStore((state) => state.isFullscreen);
  const panels = useUIStore((state) => state.panels);
  const selectedElementId = useUIStore((state) => state.selectedElementId);
  const selectElement = useUIStore((state) => state.selectElement);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'h-full min-h-screen'}`}>
      <LayoutEditorHeader />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg border p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">🎉 New Architecture Test</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Synoptics V2! This demonstrates the new state management
              with Zustand and React Query.
            </p>
            <div className="flex gap-2 justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                ✅ Zustand Store Active
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                ✅ React Query Active
              </div>
            </div>
          </div>

          {/* State Display */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current State</h3>
              <Button variant="outline" size="sm" onClick={reset}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset State
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Editor State</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(
                    {
                      isLocked,
                      isFullscreen,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Panel Visibility</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(panels, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selection</h4>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                {JSON.stringify({ selectedElementId }, null, 2)}
              </pre>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Interactive Demo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click the buttons in the header above to see the state update in real-time.
              State is managed by Zustand with Redux DevTools support!
            </p>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Try toggling the lock button
                </p>
                <p className="text-xs text-blue-700">
                  Watch the <code className="bg-blue-100 px-1 rounded">isLocked</code> state
                  change in the state display above
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900 mb-2">
                  Try toggling different panels
                </p>
                <p className="text-xs text-purple-700">
                  Watch the <code className="bg-purple-100 px-1 rounded">panels</code> object
                  update as you toggle filters, stats, and legend
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Test selection state
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectElement('node_123')}
                  >
                    Select Node 123
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectElement('node_456')}
                  >
                    Select Node 456
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectElement(null)}
                  >
                    Deselect
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold mb-3">🚀 Architecture Benefits</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>Single Source of Truth:</strong> All UI state in one Zustand store</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>No Prop Drilling:</strong> Access state from any component</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>DevTools Support:</strong> Debug state changes with Redux DevTools</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>React Query:</strong> Automatic caching, deduplication, and refetching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span><strong>Type Safe:</strong> Full TypeScript support throughout</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-3">📋 Next Steps</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Open Redux DevTools (browser extension) to see state changes</li>
              <li>Open React Query DevTools (bottom-right button) to see query cache</li>
              <li>Start migrating components from the old architecture</li>
              <li>Run the refactoring in parallel with the old code using feature flags</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
