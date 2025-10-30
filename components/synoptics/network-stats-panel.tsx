'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, TrendingUp, Network, Layers } from 'lucide-react';
import { calculateNetworkStats, validateNetwork, type NetworkNode, type NetworkConnection } from './shared/network-utils';

interface NetworkStatsPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onIssueClick?: (nodeIds: string[]) => void;
}

export function NetworkStatsPanel({ nodes, connections, onIssueClick }: NetworkStatsPanelProps) {
  const stats = useMemo(() => calculateNetworkStats(nodes, connections), [nodes, connections]);
  const issues = useMemo(() => validateNetwork(nodes, connections), [nodes, connections]);

  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;
  const infoCount = issues.filter((i) => i.type === 'info').length;

  return (
    <div className="absolute top-4 right-4 w-80 space-y-3 z-10">
      {/* Health Status */}
      <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Network Health</h3>
          {errorCount === 0 && warningCount === 0 ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Healthy
            </Badge>
          ) : errorCount > 0 ? (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Issues
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Info className="w-3 h-3 mr-1" />
              Warnings
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {errorCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Errors
              </span>
              <span className="font-semibold text-red-600">{errorCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Warnings
              </span>
              <span className="font-semibold text-orange-600">{warningCount}</span>
            </div>
          )}
          {infoCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-600 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Info
              </span>
              <span className="font-semibold text-blue-600">{infoCount}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Network Statistics */}
      <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Statistics</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-2xl font-bold text-blue-600">{stats.totalNodes}</div>
            <div className="text-xs text-blue-700">Total Nodes</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2">
            <div className="text-2xl font-bold text-purple-600">{stats.totalConnections}</div>
            <div className="text-xs text-purple-700">Connections</div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Network Density</span>
              <span className="font-semibold text-gray-900">
                {(stats.networkDensity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(stats.networkDensity * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Connections/Node</span>
              <span className="font-semibold text-gray-900">
                {stats.avgConnectionsPerNode.toFixed(1)}
              </span>
            </div>
          </div>

          {stats.isolatedNodes.length > 0 && (
            <div className="text-xs">
              <div className="flex justify-between">
                <span className="text-orange-600">Isolated Nodes</span>
                <span className="font-semibold text-orange-600">{stats.isolatedNodes.length}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Node Distribution */}
      <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-900">Node Distribution</h3>
        </div>

        <div className="space-y-2">
          {Object.entries(stats.nodesByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 capitalize">{type}s</span>
              <Badge variant="outline" className="text-xs">
                {count}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Gas Types</h4>
          <div className="space-y-1.5">
            {Object.entries(stats.gasTypeDistribution).map(([gasType, count]) => (
              <div key={gasType} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-0.5 rounded ${
                      gasType === 'oxygen' ? 'bg-red-500' :
                      gasType === 'medical_air' ? 'bg-purple-600' :
                      gasType === 'vacuum' ? 'bg-green-500' :
                      gasType === 'nitrogen' ? 'bg-blue-500' :
                      gasType === 'nitrous_oxide' ? 'bg-orange-500' :
                      'bg-gray-600'
                    }`}
                  ></div>
                  <span className="text-gray-600 capitalize">{gasType.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Validation Issues */}
      {issues.length > 0 && (
        <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg max-h-64 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Validation Issues</h3>
          </div>

          <div className="space-y-2">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                  issue.type === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : issue.type === 'warning'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
                onClick={() => onIssueClick?.(issue.affectedNodes)}
              >
                <div className="flex items-start gap-2">
                  {issue.type === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : issue.type === 'warning' ? (
                    <AlertCircle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span
                    className={
                      issue.type === 'error'
                        ? 'text-red-700'
                        : issue.type === 'warning'
                        ? 'text-orange-700'
                        : 'text-blue-700'
                    }
                  >
                    {issue.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
