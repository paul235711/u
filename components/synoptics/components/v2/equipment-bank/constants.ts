export const GAS_OPTIONS = [
  { value: 'oxygen', label: 'O₂', color: 'bg-red-500' },
  { value: 'medical_air', label: 'Air', color: 'bg-yellow-500' },
  { value: 'nitrous_oxide', label: 'N₂O', color: 'bg-blue-500' },
  { value: 'carbon_dioxide', label: 'CO₂', color: 'bg-green-500' },
  { value: 'nitrogen', label: 'N₂', color: 'bg-gray-500' },
  { value: 'vacuum', label: 'Vac', color: 'bg-purple-500' },
] as const;

export type GasOptionValue = (typeof GAS_OPTIONS)[number]['value'];
