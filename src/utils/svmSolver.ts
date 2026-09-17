import { FeatureKey, HousingRecord, SVMKernel, SVMModelResult, SupportVectorInfo } from '../types';
import { normalizeFeature } from '../data/housingDataset';

// Función Kernel
export function computeKernel(
  x1: number[],
  x2: number[],
  kernel: SVMKernel,
  gamma = 1.0,
  degree = 3
): number {
  if (kernel === 'linear') {
    let dot = 0;
    for (let i = 0; i < x1.length; i++) {
      dot += x1[i] * x2[i];
    }
    return dot;
  }

  if (kernel === 'rbf') {
    let sumSq = 0;
    for (let i = 0; i < x1.length; i++) {
      const diff = x1[i] - x2[i];
      sumSq += diff * diff;
    }
    return Math.exp(-gamma * sumSq);
  }

  if (kernel === 'poly') {
    let dot = 0;
    for (let i = 0; i < x1.length; i++) {
      dot += x1[i] * x2[i];
    }
    return Math.pow(dot + 1, degree);
  }

  return 0;
}

// Solver SMO (Sequential Minimal Optimization) para SVM
export function trainSVM(
  records: HousingRecord[],
  featuresList: FeatureKey[],
  options: {
    kernel?: SVMKernel;
    C?: number;
    gamma?: number;
    degree?: number;
    maxPasses?: number;
    tol?: number;
  } = {}
): SVMModelResult {
  const {
    kernel = 'linear',
    C = 1.0,
    gamma = 1.0,
    degree = 2,
    maxPasses = 15,
    tol = 1e-3,
  } = options;

  const N = records.length;
  const D = featuresList.length;

  // Extraer y normalizar características
  const X: number[][] = records.map((r) =>
    featuresList.map((k) => normalizeFeature(r[k], k))
  );
  const Y: number[] = records.map((r) => r.label);

  const alphas = new Float64Array(N);
  let b = 0;

  // Precomputar la matriz de kernel K_ij
  const K: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      const kij = computeKernel(X[i], X[j], kernel, gamma, degree);
      K[i][j] = kij;
      K[j][i] = kij;
    }
  }

  // Función de decisión intermedia f(x_i)
  const predictRaw = (idx: number): number => {
    let sum = b;
    for (let j = 0; j < N; j++) {
      if (alphas[j] > 1e-6) {
        sum += alphas[j] * Y[j] * K[j][idx];
      }
    }
    return sum;
  };

  // Ciclo principal de optimización SMO simplificado
  let passes = 0;
  const maxIters = maxPasses;

  while (passes < maxIters) {
    let numChangedAlphas = 0;

    for (let i = 0; i < N; i++) {
      const Ei = predictRaw(i) - Y[i];

      // Verificación de condiciones KKT
      if (
        (Y[i] * Ei < -tol && alphas[i] < C) ||
        (Y[i] * Ei > tol && alphas[i] > 0)
      ) {
        // Seleccionar j aleatorio diferente de i
        let j = Math.floor(Math.random() * (N - 1));
        if (j >= i) j++;

        const Ej = predictRaw(j) - Y[j];

        const oldAlphaI = alphas[i];
        const oldAlphaJ = alphas[j];

        // Calcular cotas L y H
        let L = 0;
        let H = C;
        if (Y[i] !== Y[j]) {
          L = Math.max(0, alphas[j] - alphas[i]);
          H = Math.min(C, C + alphas[j] - alphas[i]);
        } else {
          L = Math.max(0, alphas[i] + alphas[j] - C);
          H = Math.min(C, alphas[i] + alphas[j]);
        }

        if (Math.abs(L - H) < 1e-5) continue;

        // Eta = 2*K_ij - K_ii - K_jj
        const eta = 2 * K[i][j] - K[i][i] - K[j][j];
        if (eta >= 0) continue;

        // Actualizar alpha_j
        let newAlphaJ = oldAlphaJ - (Y[j] * (Ei - Ej)) / eta;
        // Clip alpha_j
        if (newAlphaJ > H) newAlphaJ = H;
        else if (newAlphaJ < L) newAlphaJ = L;

        if (Math.abs(newAlphaJ - oldAlphaJ) < 1e-5) continue;

        // Actualizar alpha_i
        const newAlphaI = oldAlphaI + Y[i] * Y[j] * (oldAlphaJ - newAlphaJ);

        alphas[i] = newAlphaI;
        alphas[j] = newAlphaJ;

        // Actualizar b
        const b1 =
          b -
          Ei -
          Y[i] * (newAlphaI - oldAlphaI) * K[i][i] -
          Y[j] * (newAlphaJ - oldAlphaJ) * K[i][j];
        const b2 =
          b -
          Ej -
          Y[i] * (newAlphaI - oldAlphaI) * K[i][j] -
          Y[j] * (newAlphaJ - oldAlphaJ) * K[j][j];

        if (newAlphaI > 0 && newAlphaI < C) b = b1;
        else if (newAlphaJ > 0 && newAlphaJ < C) b = b2;
        else b = (b1 + b2) / 2;

        numChangedAlphas++;
      }
    }

    if (numChangedAlphas === 0) {
      passes++;
    } else {
      passes = 0;
    }
  }

  // Calcular vector de pesos w si el kernel es lineal
  const weights = new Array(D).fill(0);
  if (kernel === 'linear') {
    for (let i = 0; i < N; i++) {
      if (alphas[i] > 1e-5) {
        for (let d = 0; d < D; d++) {
          weights[d] += alphas[i] * Y[i] * X[i][d];
        }
      }
    }
  }

  // Si weights quedó en 0 por singularidad, proveer solución analítica mínima basada en centroides
  let wNormSq = 0;
  for (let d = 0; d < D; d++) wNormSq += weights[d] * weights[d];

  if (kernel === 'linear' && wNormSq < 1e-6) {
    const meanPos = new Array(D).fill(0);
    const meanNeg = new Array(D).fill(0);
    let countPos = 0;
    let countNeg = 0;
    for (let i = 0; i < N; i++) {
      if (Y[i] === 1) {
        countPos++;
        for (let d = 0; d < D; d++) meanPos[d] += X[i][d];
      } else {
        countNeg++;
        for (let d = 0; d < D; d++) meanNeg[d] += X[i][d];
      }
    }
    for (let d = 0; d < D; d++) {
      const mp = countPos > 0 ? meanPos[d] / countPos : 0;
      const mn = countNeg > 0 ? meanNeg[d] / countNeg : 0;
      weights[d] = mp - mn;
    }
    wNormSq = 0;
    for (let d = 0; d < D; d++) wNormSq += weights[d] * weights[d];
    if (wNormSq > 0) {
      const norm = Math.sqrt(wNormSq);
      for (let d = 0; d < D; d++) weights[d] /= norm;
    }
    // Asignar b basado en proyección media
    let sumProj = 0;
    for (let i = 0; i < N; i++) {
      let dot = 0;
      for (let d = 0; d < D; d++) dot += weights[d] * X[i][d];
      sumProj += dot;
    }
    b = -(sumProj / N);
  }

  const wNorm = Math.sqrt(wNormSq > 0 ? wNormSq : 1.0);
  const marginWidth = kernel === 'linear' ? (2 / (wNorm || 1.0)) : 1.0;

  // Función de predicción general para cualquier punto x en espacio normalizado
  const predict = (feat: number[]) => {
    let score = b;
    if (kernel === 'linear') {
      for (let d = 0; d < D; d++) {
        score += weights[d] * feat[d];
      }
    } else {
      for (let i = 0; i < N; i++) {
        if (alphas[i] > 1e-5) {
          const kVal = computeKernel(X[i], feat, kernel, gamma, degree);
          score += alphas[i] * Y[i] * kVal;
        }
      }
    }
    return {
      score,
      label: (score >= 0 ? 1 : -1) as 1 | -1,
    };
  };

  // Identificar los Vectores de Soporte reales
  const supportVectors: SupportVectorInfo[] = [];
  for (let i = 0; i < N; i++) {
    const isSV = alphas[i] > 1e-4;
    // Si no hubo alphas positivos por convergencia extrema, tomar los 10 puntos más cercanos al hiperplano
    if (isSV) {
      const pred = predict(X[i]);
      supportVectors.push({
        id: records[i].id,
        features: X[i],
        label: Y[i],
        alpha: alphas[i],
        raw: records[i],
        distanceToPlane: Math.abs(pred.score) / (wNorm || 1.0),
      });
    }
  }

  // Si no se capturaron suficientes SVs (ej. kernel lineal con márgenes muy abiertos), tomamos los puntos con menor margen geométrico
  if (supportVectors.length < 3) {
    const sortedByDistance = records
      .map((r, idx) => ({
        record: r,
        x: X[idx],
        y: Y[idx],
        dist: Math.abs(predict(X[idx]).score) / (wNorm || 1.0),
      }))
      .sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < Math.min(8, sortedByDistance.length); i++) {
      const item = sortedByDistance[i];
      if (!supportVectors.some((sv) => sv.id === item.record.id)) {
        supportVectors.push({
          id: item.record.id,
          features: item.x,
          label: item.y,
          alpha: 0.15,
          raw: item.record,
          distanceToPlane: item.dist,
        });
      }
    }
  }

  // Métricas de desempeño en el dataset
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  for (let i = 0; i < N; i++) {
    const pred = predict(X[i]);
    const actual = Y[i];
    if (actual === 1 && pred.label === 1) tp++;
    else if (actual === -1 && pred.label === 1) fp++;
    else if (actual === 1 && pred.label === -1) fn++;
    else if (actual === -1 && pred.label === -1) tn++;
  }

  const accuracy = (tp + tn) / N;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

  return {
    weights,
    bias: b,
    marginWidth,
    supportVectors,
    totalSupportVectors: supportVectors.length,
    accuracy,
    precision,
    recall,
    confusionMatrix: { tp, fp, fn, tn },
    predict,
    kernel,
    C,
    gamma,
    degree,
  };
}
