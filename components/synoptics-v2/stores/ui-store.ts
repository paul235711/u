/**
 * Zustand store for UI state management
 * Manages editor mode, panel visibility, and selection state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Editor state
  isLocked: boolean;
  isFullscreen: boolean;
  
  // Panel visibility
  panels: {
    stats: boolean;
    filters: boolean;
    legend: boolean;
    locationFilter: boolean;
    valveImpact: boolean;
    shortcuts: boolean;
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
  
  // Actions
  toggleLock: () => void;
  setLocked: (locked: boolean) => void;
  toggleFullscreen: () => void;
  togglePanel: (panel: keyof UIState['panels']) => void;
  setPanel: (panel: keyof UIState['panels'], visible: boolean) => void;
  selectElement: (id: string | null) => void;
  toggleDialog: (dialog: keyof UIState['dialogs']) => void;
  setDialog: (dialog: keyof UIState['dialogs'], open: boolean) => void;
  reset: () => void;
}

const initialPanels = {
  stats: false,
  filters: false,
  legend: true,
  locationFilter: false,
  valveImpact: false,
  shortcuts: false,
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
      isFullscreen: false,
      panels: initialPanels,
      selectedElementId: null,
      dialogs: initialDialogs,

      // Actions
      toggleLock: () =>
        set((state) => ({ isLocked: !state.isLocked }), false, 'toggleLock'),

      setLocked: (locked) =>
        set({ isLocked: locked }, false, 'setLocked'),

      toggleFullscreen: () =>
        set(
          (state) => ({ isFullscreen: !state.isFullscreen }),
          false,
          'toggleFullscreen'
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
          (state) => ({
            dialogs: { ...state.dialogs, [dialog]: open },
          }),
          false,
          `setDialog/${dialog}`
        ),

      reset: () =>
        set(
          {
            isLocked: true,
            isFullscreen: false,
            panels: initialPanels,
            selectedElementId: null,
            dialogs: initialDialogs,
          },
          false,
          'reset'
        ),
    }),
    { name: 'SynopticsUI' }
  )
);
