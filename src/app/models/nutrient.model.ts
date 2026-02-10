export type NutrientType = 'common' | 'rich' | 'toxic' | 'golden';

export interface Nutrient {
  id: string;
  x: number;
  y: number;
  energy: number;
  type: NutrientType;
  pulsePhase: number;
  createdAt: number;
  decayRate: number;
}

export const NUTRIENT_CONFIG: Record<NutrientType, { color: string; glow: string; energyRange: [number, number]; decayRate: number; spawnWeight: number }> = {
  common: {
    color: '#4ade80',
    glow: '#22c55e',
    energyRange: [15, 30],
    decayRate: 0.01,
    spawnWeight: 60,
  },
  rich: {
    color: '#60a5fa',
    glow: '#3b82f6',
    energyRange: [35, 50],
    decayRate: 0.02,
    spawnWeight: 25,
  },
  toxic: {
    color: '#f472b6',
    glow: '#ec4899',
    energyRange: [-20, -10],
    decayRate: 0.005,
    spawnWeight: 10,
  },
  golden: {
    color: '#fbbf24',
    glow: '#f59e0b',
    energyRange: [60, 80],
    decayRate: 0.05,
    spawnWeight: 5,
  },
};

function selectNutrientType(): NutrientType {
  const total = Object.values(NUTRIENT_CONFIG).reduce((sum, c) => sum + c.spawnWeight, 0);
  let roll = Math.random() * total;

  for (const [type, config] of Object.entries(NUTRIENT_CONFIG)) {
    roll -= config.spawnWeight;
    if (roll <= 0) return type as NutrientType;
  }
  return 'common';
}

export function createNutrient(x: number, y: number, type?: NutrientType): Nutrient {
  const nutrientType = type ?? selectNutrientType();
  const config = NUTRIENT_CONFIG[nutrientType];
  const [minEnergy, maxEnergy] = config.energyRange;

  return {
    id: crypto.randomUUID(),
    x,
    y,
    type: nutrientType,
    energy: minEnergy + Math.random() * (maxEnergy - minEnergy),
    pulsePhase: Math.random() * Math.PI * 2,
    createdAt: Date.now(),
    decayRate: config.decayRate,
  };
}

export function updateNutrient(nutrient: Nutrient, deltaTime: number): Nutrient {
  const newEnergy = nutrient.type === 'toxic'
    ? nutrient.energy
    : nutrient.energy - nutrient.decayRate * deltaTime;

  return { ...nutrient, energy: newEnergy };
}

export function isNutrientDepleted(nutrient: Nutrient): boolean {
  if (nutrient.type === 'toxic') return false;
  return Math.abs(nutrient.energy) < 1;
}
