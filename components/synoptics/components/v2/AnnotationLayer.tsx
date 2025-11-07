export interface Annotation {
  id: string;
  type: 'building' | 'floor' | 'zone' | 'service' | 'label';
  title: string;
  subtitle?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: 'minimal' | 'box' | 'layer';
  color?: string;
  interactive?: boolean;
}
