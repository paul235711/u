import type { GasType } from './gas-indicators';

/**
 * Centralized gas type configuration
 * Used across all components for consistent gas type display
 */
export const GAS_CONFIG: Record<GasType, { 
  label: string;
  shortLabel: string;
  bgColor: string;
  textColor: string;
  description: string;
}> = {
  oxygen: {
    label: 'Oxygen',
    shortLabel: 'O₂',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    description: 'Medical oxygen supply',
  },
  medical_air: {
    label: 'Medical Air',
    shortLabel: 'Air',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    description: 'Compressed medical air',
  },
  vacuum: {
    label: 'Vacuum',
    shortLabel: 'VAC',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    description: 'Medical suction system',
  },
  nitrous_oxide: {
    label: 'Nitrous Oxide',
    shortLabel: 'N₂O',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    description: 'Anesthetic gas',
  },
  nitrogen: {
    label: 'Nitrogen',
    shortLabel: 'N₂',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    description: 'Instrument air',
  },
  carbon_dioxide: {
    label: 'Carbon Dioxide',
    shortLabel: 'CO₂',
    bgColor: 'bg-gray-600',
    textColor: 'text-white',
    description: 'Surgical gas',
  },
};

/**
 * Primary gases that should always be shown in indicators
 */
export const PRIMARY_GASES: GasType[] = ['oxygen', 'medical_air', 'vacuum'];

/**
 * All available gas options for dropdowns
 */
export const GAS_OPTIONS = Object.entries(GAS_CONFIG).map(([value, config]) => ({
  value: value as GasType,
  label: config.label,
  shortLabel: config.shortLabel,
  description: config.description,
}));

/**
 * Helper to get gas configuration safely
 */
export function getGasConfig(gasType: string) {
  return GAS_CONFIG[gasType as GasType] || {
    label: gasType,
    shortLabel: gasType.toUpperCase(),
    bgColor: 'bg-gray-500',
    textColor: 'text-white',
    description: 'Unknown gas type',
  };
}
