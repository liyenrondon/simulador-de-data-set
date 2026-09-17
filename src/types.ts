export type FeatureKey = 'median_income' | 'sqft' | 'house_age' | 'total_rooms' | 'ocean_proximity';

export interface HousingRecord {
  id: string;
  city: string;
  state: string;
  median_income: number; // en miles de USD (ej: 45 = $45,000/año)
  sqft: number; // pies cuadrados (ej: 1800)
  house_age: number; // años de antigüedad (ej: 15)
  total_rooms: number; // número promedio de habitaciones (ej: 6)
  ocean_proximity: number; // índice 1-10 (1 = interior rural, 10 = frente a costa / prime)
  price: number; // valor en USD (ej: 340000)
  label: 1 | -1; // 1 = Alta Gama / Premium, -1 = Estándar / Accesible
}

export interface FeatureMeta {
  key: FeatureKey;
  name: string;
  unit: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

export type SVMKernel = 'linear' | 'rbf' | 'poly';

export interface SVMPoint {
  id: string;
  raw: HousingRecord;
  features: number[]; // normalizadas en [-1, 1]
  label: 1 | -1;
}

export interface SupportVectorInfo {
  id: string;
  features: number[];
  label: number;
  alpha: number;
  raw: HousingRecord;
  distanceToPlane: number;
}

export interface SVMModelResult {
  weights: number[]; // w en espacio normalizado (para lineal)
  bias: number; // b
  marginWidth: number; // 2 / ||w||
  supportVectors: SupportVectorInfo[];
  totalSupportVectors: number;
  accuracy: number;
  precision: number;
  recall: number;
  confusionMatrix: { tp: number; fp: number; fn: number; tn: number };
  predict: (features: number[]) => { score: number; label: 1 | -1 };
  kernel: SVMKernel;
  C: number;
  gamma: number;
  degree: number;
}

export type AppViewMode = '2D' | '3D' | 'kernel_trick' | 'tour' | 'challenges';

export interface ChallengeTask {
  id: string;
  title: string;
  badge: string;
  scenario: string;
  objective: string;
  targetAccuracy: number;
  maxSupportVectors?: number;
  hint: string;
  recommendedVariables: [FeatureKey, FeatureKey];
}
