'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Columns, 
  GitBranch, 
  Layers, 
  Tag, 
  ArrowRight,
  Grid,
  Eye,
  Shuffle
} from 'lucide-react';

interface LayoutImprovementsProps {
  onApplyLayout?: (type: string) => void;
}

/**
 * Component proposing various layout improvements for better schema readability
 */
export function LayoutImprovements({ onApplyLayout }: LayoutImprovementsProps) {
  
  const improvements = [
    {
      id: 'column-layout',
      title: '🏛️ Organisation en Colonnes par Gaz',
      icon: Columns,
      description: 'Aligne verticalement les vannes du même type de gaz à travers tous les étages',
      benefits: [
        'Vision claire du flux vertical',
        'Comparaison facile entre étages',
        'Identification rapide des vannes manquantes',
      ],
      preview: `
        OXYGEN    MEDICAL_AIR    VACUUM
           │           │           │
        ┌──┼──┐     ┌──┼──┐     ┌──┼──┐
        │ O2-1 │     │ AIR-1│     │ VAC-1│  Floor 1
        └──┼──┘     └──┼──┘     └──┼──┘
           │           │           │
        ┌──┼──┐     ┌──┼──┐     ┌──┼──┐
        │ O2-2 │     │ AIR-2│     │ VAC-2│  Floor 0
        └──┼──┘     └──┼──┘     └──┼──┘
      `,
    },
    {
      id: 'hierarchical',
      title: '📊 Vue Hiérarchique',
      icon: GitBranch,
      description: 'Sépare visuellement les vannes par niveau (Bâtiment → Étage → Zone)',
      benefits: [
        'Hiérarchie claire des vannes',
        'Vannes principales mises en évidence',
        'Navigation intuitive',
      ],
      preview: `
        ╔══ BUILDING LEVEL ══╗
        ║  [MAIN-O2] [MAIN-AIR]  ║
        ╚════════════════════╝
                │
        ┌─── Floor Level ───┐
        │  [F1-O2] [F1-AIR] │
        └───────────────────┘
                │
        ┌─ Zone Level ─┐
        │ [Z1] [Z2]    │
        └──────────────┘
      `,
    },
    {
      id: 'flow-based',
      title: '🌊 Layout Basé sur le Flux',
      icon: ArrowRight,
      description: 'Organise les vannes selon la direction du flux (Source → Distribution → Zones)',
      benefits: [
        'Compréhension du circuit',
        'Identification des points critiques',
        'Visualisation des dépendances',
      ],
      preview: `
        SOURCE → DISTRIBUTION → ZONES
          ●━━━━━━━●━━━━━━━━━━━●
          │       │            │
        [SRC]→[DIST-1]→[ZONE-1]
              →[DIST-2]→[ZONE-2]
      `,
    },
    {
      id: 'matrix',
      title: '📋 Vue Matricielle',
      icon: Grid,
      description: 'Grille avec zones en colonnes et types de gaz en lignes',
      benefits: [
        'Vue d\'ensemble complète',
        'Identification rapide des manques',
        'Comparaison facilitée',
      ],
      preview: `
        ┌────────┬─────────┬─────────┐
        │        │ Zone A  │ Zone B  │
        ├────────┼─────────┼─────────┤
        │ O2     │  [V1]   │  [V2]   │
        │ AIR    │  [V3]   │   ---   │
        │ VAC    │  [V4]   │  [V5]   │
        └────────┴─────────┴─────────┘
      `,
    },
    {
      id: 'compact-zones',
      title: '🎯 Zones Compactes',
      icon: Layers,
      description: 'Regroupe les vannes par zone avec indicateurs visuels clairs',
      benefits: [
        'Économie d\'espace',
        'Focus sur les zones actives',
        'Labels contextuels',
      ],
    },
    {
      id: 'smart-labels',
      title: '🏷️ Labels Intelligents',
      icon: Tag,
      description: 'Affiche les informations essentielles avec hiérarchie visuelle',
      benefits: [
        'Codes courts mais informatifs',
        'Couleurs par criticité',
        'Tooltips détaillés au survol',
      ],
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Améliorations de Disposition Proposées
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="column-layout" className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            {improvements.map((imp) => (
              <TabsTrigger key={imp.id} value={imp.id}>
                <imp.icon className="h-4 w-4" />
              </TabsTrigger>
            ))}
          </TabsList>
          
          {improvements.map((improvement) => (
            <TabsContent key={improvement.id} value={improvement.id}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {improvement.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {improvement.description}
                  </p>
                </div>

                {/* Benefits */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Avantages
                  </h4>
                  <ul className="space-y-1">
                    {improvement.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-500 mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preview */}
                {improvement.preview && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">
                      Aperçu
                    </h4>
                    <pre className="text-xs font-mono text-gray-600 whitespace-pre">
                      {improvement.preview.trim()}
                    </pre>
                  </div>
                )}

                {/* Action */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => onApplyLayout?.(improvement.id)}
                    className="gap-2"
                    size="sm"
                  >
                    <Shuffle className="h-4 w-4" />
                    Appliquer ce Layout
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Actions Rapides</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyLayout?.('optimize-spacing')}
              className="justify-start"
            >
              <Grid className="h-4 w-4 mr-2" />
              Optimiser l\'espacement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyLayout?.('align-vertically')}
              className="justify-start"
            >
              <Columns className="h-4 w-4 mr-2" />
              Aligner verticalement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyLayout?.('group-by-gas')}
              className="justify-start"
            >
              <Layers className="h-4 w-4 mr-2" />
              Grouper par gaz
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyLayout?.('minimize-crossings')}
              className="justify-start"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Minimiser croisements
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <h4 className="text-sm font-semibold text-amber-900 mb-2">
            💡 Conseils d\'optimisation
          </h4>
          <ul className="space-y-1 text-sm text-amber-800">
            <li>• Utilisez les <strong>colonnes par gaz</strong> pour les grands bâtiments multi-étages</li>
            <li>• La vue <strong>hiérarchique</strong> est idéale pour identifier les vannes critiques</li>
            <li>• Le layout <strong>basé sur le flux</strong> aide à comprendre les dépendances</li>
            <li>• Activez les <strong>labels intelligents</strong> pour plus de contexte</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
