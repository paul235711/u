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
    bgColor: 'bg-emerald-400',
    textColor: 'text-white',
    description: 'Medical suction system',
  },
  nitrous_oxide: {
    label: 'Nitrous Oxide',
    shortLabel: 'N₂O',
    bgColor: 'bg-teal-400',
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
    bgColor: 'bg-amber-900',
    textColor: 'text-white',
    description: 'Surgical gas',
  },
};

export const GAS_LINE_COLORS: Record<string, string> = {
  oxygen: '#ef4444', // OXYGENE → Red
  medical_air: '#9333ea', // AIR → Purple
  vacuum: '#6ee7b7', // VACCUM → Light green
  nitrous_oxide: '#2dd4bf', // PROTOXYDE → Light turquoise
  nitrogen: '#1d4ed8',
  carbon_dioxide: '#4b2e2b', // DIOXIDE → Dark brown
  co2: '#4b2e2b',
  compressed_air: '#9333ea',
  air_med_8b: '#1d4ed8', // AIR MED. 8b → Dark blue
  air_sega: '#38bdf8', // AIR SEGA → Light blue
  rejection_sega: '#9ca3af', // rejection SEGA → Grey line
  rejection_prod: '#4b5563', // rejection PROD. → Dark grey line
  vacuum_prod: '#1e40af', // vaccum. PROD. → Bright/deep blue
  default: '#000000',
};

export function getGasLineColor(gasType: string): string {
  if (!gasType) return GAS_LINE_COLORS.default;
  const normalized = gasType.toLowerCase().replace(/\s+/g, '_');
  return GAS_LINE_COLORS[normalized] || GAS_LINE_COLORS.default;
}

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
