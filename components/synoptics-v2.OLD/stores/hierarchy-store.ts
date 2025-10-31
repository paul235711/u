/**
 * Zustand store for Site Hierarchy Manager
 * Manages UI state for buildings, floors, zones, and dialogs
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ValveDialogState {
  open: boolean;
  type: 'create' | 'edit' | 'view' | null;
  targetId: string | null;
  targetType: 'building' | 'floor' | 'zone' | null;
  valveId?: string;
  gasType?: string;
}

interface HierarchyState {
  // Expanded state
  expandedBuildings: Set<string>;
  expandedFloors: Set<string>;
  
  // Edit mode
  isEditMode: boolean;
  
  // Adding forms
  addingBuilding: boolean;
  addingFloorTo: string | null;
  addingZoneTo: string | null;
  
  // Valve dialog
  valveDialog: ValveDialogState;
  
  // Selected valve for viewing
  selectedValve: any | null;
  
  // Actions - Expand/Collapse
  toggleBuilding: (id: string) => void;
  toggleFloor: (id: string) => void;
  expandAll: (buildingIds: string[], floorIds: string[]) => void;
  collapseAll: () => void;
  
  // Actions - Edit Mode
  setEditMode: (enabled: boolean) => void;
  
  // Actions - Adding Forms
  setAddingBuilding: (adding: boolean) => void;
  setAddingFloorTo: (buildingId: string | null) => void;
  setAddingZoneTo: (floorId: string | null) => void;
  cancelAllForms: () => void;
  
  // Actions - Valve Dialog
  openValveDialog: (type: 'create' | 'edit' | 'view', targetId: string, targetType: 'building' | 'floor' | 'zone', valveId?: string, gasType?: string) => void;
  closeValveDialog: () => void;
  
  // Actions - Selected Valve
  setSelectedValve: (valve: any | null) => void;
  
  // Reset
  reset: () => void;
}

const initialValveDialog: ValveDialogState = {
  open: false,
  type: null,
  targetId: null,
  targetType: null,
};

export const useHierarchyStore = create<HierarchyState>()(
  devtools(
    (set) => ({
      // Initial state
      expandedBuildings: new Set(),
      expandedFloors: new Set(),
      isEditMode: false,
      addingBuilding: false,
      addingFloorTo: null,
      addingZoneTo: null,
      valveDialog: initialValveDialog,
      selectedValve: null,

      // Expand/Collapse
      toggleBuilding: (id) =>
        set((state) => {
          const newSet = new Set(state.expandedBuildings);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { expandedBuildings: newSet };
        }, false, 'toggleBuilding'),

      toggleFloor: (id) =>
        set((state) => {
          const newSet = new Set(state.expandedFloors);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { expandedFloors: newSet };
        }, false, 'toggleFloor'),

      expandAll: (buildingIds, floorIds) =>
        set(
          {
            expandedBuildings: new Set(buildingIds),
            expandedFloors: new Set(floorIds),
          },
          false,
          'expandAll'
        ),

      collapseAll: () =>
        set(
          { expandedBuildings: new Set(), expandedFloors: new Set() },
          false,
          'collapseAll'
        ),

      // Edit Mode
      setEditMode: (enabled) =>
        set({ isEditMode: enabled }, false, 'setEditMode'),

      // Adding Forms
      setAddingBuilding: (adding) =>
        set({ addingBuilding: adding }, false, 'setAddingBuilding'),

      setAddingFloorTo: (buildingId) =>
        set({ addingFloorTo: buildingId }, false, 'setAddingFloorTo'),

      setAddingZoneTo: (floorId) =>
        set({ addingZoneTo: floorId }, false, 'setAddingZoneTo'),

      cancelAllForms: () =>
        set(
          {
            addingBuilding: false,
            addingFloorTo: null,
            addingZoneTo: null,
          },
          false,
          'cancelAllForms'
        ),

      // Valve Dialog
      openValveDialog: (type, targetId, targetType, valveId, gasType) =>
        set(
          {
            valveDialog: {
              open: true,
              type,
              targetId,
              targetType,
              valveId,
              gasType,
            },
          },
          false,
          'openValveDialog'
        ),

      closeValveDialog: () =>
        set(
          { valveDialog: initialValveDialog },
          false,
          'closeValveDialog'
        ),

      // Selected Valve
      setSelectedValve: (valve) =>
        set({ selectedValve: valve }, false, 'setSelectedValve'),

      // Reset
      reset: () =>
        set(
          {
            expandedBuildings: new Set(),
            expandedFloors: new Set(),
            isEditMode: false,
            addingBuilding: false,
            addingFloorTo: null,
            addingZoneTo: null,
            valveDialog: initialValveDialog,
            selectedValve: null,
          },
          false,
          'reset'
        ),
    }),
    { name: 'HierarchyManager' }
  )
);
