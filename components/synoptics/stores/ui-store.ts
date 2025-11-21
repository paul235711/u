/**
 * Zustand store for UI state management
 * Manages editor mode, panel visibility, and selection state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NetworkFilters } from '../shared/network-utils';
import { createDefaultFilters } from '../shared/network-utils';

type ElementType = 'source' | 'valve' | 'fitting';
type EdgeToolMode = 'select' | 'cut';

interface QuickAddContext {
  elementType: ElementType;
  position: { x: number; y: number };
}

interface UIState {
  // Editor state
  isLocked: boolean;
  edgeToolMode: EdgeToolMode;
  annotationMode: boolean;
  showLocationBadges: boolean;
  
  // Panel visibility
  panels: {
    stats: boolean;
    filters: boolean;
    legend: boolean;
    locationFilter: boolean;
    valveImpact: boolean;
    properties: boolean;
    import: boolean;
  };
  
  // Selection
  selectedElementId: string | null;
  
  // Dialogs
  dialogs: {
    quickAdd: boolean;
    deleteConfirm: boolean;
  };
  quickAddContext: QuickAddContext | null;
  filters: NetworkFilters;

  // Actions
  toggleLock: () => void;
  setLocked: (locked: boolean) => void;
  setEdgeToolMode: (mode: EdgeToolMode) => void;
  toggleEdgeToolMode: () => void;
  toggleAnnotationMode: () => void;
  setAnnotationMode: (enabled: boolean) => void;
   toggleLocationBadges: () => void;
   setLocationBadges: (visible: boolean) => void;
  togglePanel: (panel: keyof UIState['panels']) => void;
  setPanel: (panel: keyof UIState['panels'], visible: boolean) => void;
  selectElement: (id: string | null) => void;
  toggleDialog: (dialog: keyof UIState['dialogs']) => void;
  setDialog: (dialog: keyof UIState['dialogs'], open: boolean) => void;
  openQuickAddDialog: (context: QuickAddContext) => void;
  closeQuickAddDialog: () => void;
  setFilters: (filters: NetworkFilters) => void;
  resetFilters: () => void;
  reset: () => void;
}

const initialPanels = {
  stats: false,
  filters: false,
  legend: true,
  locationFilter: false,
  valveImpact: false,
  properties: false,
  import: false,
};

const initialDialogs = {
  quickAdd: false,
  deleteConfirm: false,
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      isLocked: true,
      edgeToolMode: 'select',
      annotationMode: false,
      showLocationBadges: false,
      panels: initialPanels,
      selectedElementId: null,
      dialogs: initialDialogs,
      quickAddContext: null,
      filters: createDefaultFilters(),

      // Actions
      toggleLock: () =>
        set(
          (state) => {
            const nextLocked = !state.isLocked;
            return {
              isLocked: nextLocked,
              edgeToolMode: nextLocked ? 'select' : state.edgeToolMode,
            };
          },
          false,
          'toggleLock'
        ),

      setLocked: (locked) =>
        set(
          (state) => ({
            isLocked: locked,
            edgeToolMode: locked ? 'select' : state.edgeToolMode,
          }),
          false,
          'setLocked'
        ),

      setEdgeToolMode: (mode) =>
        set({ edgeToolMode: mode }, false, 'setEdgeToolMode'),

      toggleEdgeToolMode: () =>
        set(
          (state) => ({
            edgeToolMode: state.edgeToolMode === 'select' ? 'cut' : 'select',
          }),
          false,
          'toggleEdgeToolMode'
        ),

      toggleAnnotationMode: () =>
        set(
          (state) => ({ annotationMode: !state.annotationMode }),
          false,
          'toggleAnnotationMode'
        ),

      setAnnotationMode: (enabled) =>
        set(
          { annotationMode: enabled },
          false,
          'setAnnotationMode'
        ),

      toggleLocationBadges: () =>
        set(
          (state) => ({ showLocationBadges: !state.showLocationBadges }),
          false,
          'toggleLocationBadges'
        ),

      setLocationBadges: (visible) =>
        set(
          { showLocationBadges: visible },
          false,
          'setLocationBadges'
        ),

      togglePanel: (panel) =>
        set(
          (state) => ({
            panels: { ...state.panels, [panel]: !state.panels[panel] },
          }),
          false,
          `togglePanel/${panel}`
        ),

      setPanel: (panel, visible) =>
        set(
          (state) => ({
            panels: { ...state.panels, [panel]: visible },
          }),
          false,
          `setPanel/${panel}`
        ),

      selectElement: (id) =>
        set({ selectedElementId: id }, false, 'selectElement'),

      toggleDialog: (dialog) =>
        set(
          (state) => ({
            dialogs: { ...state.dialogs, [dialog]: !state.dialogs[dialog] },
          }),
          false,
          `toggleDialog/${dialog}`
        ),

      setDialog: (dialog, open) =>
        set(
          (state) => {
            const nextDialogs = { ...state.dialogs, [dialog]: open };
            if (dialog === 'quickAdd' && !open) {
              return { dialogs: nextDialogs, quickAddContext: null };
            }
            return { dialogs: nextDialogs };
          },
          false,
          `setDialog/${dialog}`
        ),

      openQuickAddDialog: (context) =>
        set(
          (state) => ({
            dialogs: { ...state.dialogs, quickAdd: true },
            quickAddContext: context,
          }),
          false,
          'openQuickAddDialog'
        ),

      closeQuickAddDialog: () =>
        set(
          (state) => ({
            dialogs: { ...state.dialogs, quickAdd: false },
            quickAddContext: null,
          }),
          false,
          'closeQuickAddDialog'
        ),

      setFilters: (filters) =>
        set(
          { filters },
          false,
          'setFilters'
        ),

      resetFilters: () =>
        set(
          { filters: createDefaultFilters() },
          false,
          'resetFilters'
        ),

      reset: () =>
        set(
          {
            isLocked: true,
            edgeToolMode: 'select',
            annotationMode: false,
            showLocationBadges: false,
            panels: initialPanels,
            selectedElementId: null,
            dialogs: initialDialogs,
            quickAddContext: null,
            filters: createDefaultFilters(),
          },
          false,
          'reset'
        ),
    }),
    { name: 'SynopticsUI' }
  )
);
