import { FeatureKey, FeatureMeta, HousingRecord } from '../types';

export const FEATURES_METADATA: Record<FeatureKey, FeatureMeta> = {
  median_income: {
    key: 'median_income',
    name: 'Ingreso Familiar Medio',
    unit: 'k USD/año',
    description: 'Ingreso promedio de los hogares en el código postal (en miles de dólares anuales).',
    min: 20,
    max: 150,
    step: 1,
  },
  sqft: {
    key: 'sqft',
    name: 'Metraje Construido',
    unit: 'pies²',
    description: 'Área habitable de la vivienda en pies cuadrados (1000 ft² ≈ 93 m²).',
    min: 800,
    max: 4500,
    step: 50,
  },
  ocean_proximity: {
    key: 'ocean_proximity',
    name: 'Atractivo de Ubicación / Costa',
    unit: 'índice 1-10',
    description: 'Nivel de proximidad a la costa y zonas metropolitanas de alta demanda (1=Interior rural, 10=Costa/Bahía prime).',
    min: 1,
    max: 10,
    step: 1,
  },
  house_age: {
    key: 'house_age',
    name: 'Antigüedad de la Casa',
    unit: 'años',
    description: 'Años desde la construcción original de la propiedad.',
    min: 1,
    max: 60,
    step: 1,
  },
  total_rooms: {
    key: 'total_rooms',
    name: 'Habitaciones Totales',
    unit: 'habitaciones',
    description: 'Número promedio de habitaciones y ambientes habitables.',
    min: 2,
    max: 10,
    step: 1,
  },
};

// Generador determinista de dataset representativo del mercado inmobiliario estadounidense
// basado en distribuciones reales de California, Washington, Texas, Florida y NY
const RAW_CITIES = [
  { city: 'San Francisco', state: 'CA', incomeBase: 110, locBase: 9.5, priceBase: 580000 },
  { city: 'San Jose', state: 'CA', incomeBase: 105, locBase: 8.8, priceBase: 540000 },
  { city: 'Los Angeles', state: 'CA', incomeBase: 85, locBase: 8.5, priceBase: 490000 },
  { city: 'San Diego', state: 'CA', incomeBase: 82, locBase: 9.0, priceBase: 470000 },
  { city: 'Seattle', state: 'WA', incomeBase: 88, locBase: 8.0, priceBase: 460000 },
  { city: 'New York', state: 'NY', incomeBase: 92, locBase: 9.2, priceBase: 510000 },
  { city: 'Boston', state: 'MA', incomeBase: 86, locBase: 8.2, priceBase: 450000 },
  { city: 'Denver', state: 'CO', incomeBase: 74, locBase: 6.5, priceBase: 390000 },
  { city: 'Austin', state: 'TX', incomeBase: 72, locBase: 6.2, priceBase: 380000 },
  { city: 'Miami', state: 'FL', incomeBase: 68, locBase: 8.7, priceBase: 420000 },
  { city: 'Chicago', state: 'IL', incomeBase: 62, locBase: 5.8, priceBase: 320000 },
  { city: 'Atlanta', state: 'GA', incomeBase: 58, locBase: 5.2, priceBase: 300000 },
  { city: 'Dallas', state: 'TX', incomeBase: 56, locBase: 5.0, priceBase: 290000 },
  { city: 'Phoenix', state: 'AZ', incomeBase: 52, locBase: 4.8, priceBase: 280000 },
  { city: 'Tampa', state: 'FL', incomeBase: 50, locBase: 6.0, priceBase: 275000 },
  { city: 'Cleveland', state: 'OH', incomeBase: 38, locBase: 3.2, priceBase: 195000 },
  { city: 'Detroit', state: 'MI', incomeBase: 34, locBase: 2.8, priceBase: 175000 },
  { city: 'Memphis', state: 'TN', incomeBase: 36, locBase: 3.0, priceBase: 185000 },
  { city: 'Fresno', state: 'CA', incomeBase: 42, locBase: 3.5, priceBase: 220000 },
  { city: 'Bakersfield', state: 'CA', incomeBase: 40, locBase: 3.1, priceBase: 210000 },
];

// Pseudo-random pseudo-deterministic number generator con semilla fija
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateHousingDataset(priceThreshold = 350000): HousingRecord[] {
  const records: HousingRecord[] = [];
  let seed = 42;

  // Generamos ~130 viviendas distribuidas coherentemente
  for (let i = 0; i < RAW_CITIES.length; i++) {
    const c = RAW_CITIES[i];
    const housesInCity = 6 + Math.floor(seededRandom(seed++) * 3); // 6 a 8 casas por ciudad

    for (let j = 0; j < housesInCity; j++) {
      const incomeVariation = (seededRandom(seed++) - 0.5) * 32;
      const income = Math.max(22, Math.min(145, Math.round(c.incomeBase + incomeVariation)));

      const sqftVariation = (seededRandom(seed++) - 0.5) * 1600;
      const baseSqft = 1200 + (income / 140) * 2000;
      const sqft = Math.max(850, Math.min(4400, Math.round(baseSqft + sqftVariation)));

      const age = Math.max(2, Math.min(58, Math.round(seededRandom(seed++) * 55 + 2)));
      const locScore = Math.max(1, Math.min(10, Math.round((c.locBase + (seededRandom(seed++) - 0.5) * 2) * 10) / 10));
      const rooms = Math.max(3, Math.min(9, Math.round(sqft / 420 + (seededRandom(seed++) - 0.5) * 1.5)));

      // Fórmula de precio realista con ruido
      const priceEstimate =
        income * 2300 +
        sqft * 95 +
        locScore * 18000 -
        age * 900 +
        rooms * 5000 +
        (seededRandom(seed++) - 0.5) * 35000;

      const finalPrice = Math.round(Math.max(130000, Math.min(680000, priceEstimate)));

      records.push({
        id: `house-${i}-${j}`,
        city: c.city,
        state: c.state,
        median_income: income,
        sqft: sqft,
        house_age: age,
        total_rooms: rooms,
        ocean_proximity: locScore,
        price: finalPrice,
        label: finalPrice >= priceThreshold ? 1 : -1,
      });
    }
  }

  return records;
}

// Normalización de características a rango [-1, 1] para estabilidad numérica del SVM
export function normalizeFeature(value: number, key: FeatureKey): number {
  const meta = FEATURES_METADATA[key];
  const normalized01 = (value - meta.min) / (meta.max - meta.min);
  return normalized01 * 2 - 1; // de [-1 a 1]
}

export function denormalizeFeature(normValue: number, key: FeatureKey): number {
  const meta = FEATURES_METADATA[key];
  const norm01 = (normValue + 1) / 2;
  return meta.min + norm01 * (meta.max - meta.min);
}
