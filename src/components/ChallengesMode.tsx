import React, { useState } from 'react';
import { ChallengeTask, FeatureKey, SVMModelResult } from '../types';
import { Trophy, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChallengesModeProps {
  model: SVMModelResult;
  featureX: FeatureKey;
  featureY: FeatureKey;
  featureZ: FeatureKey;
  onApplyPreset: (config: {
    featureX: FeatureKey;
    featureY: FeatureKey;
    featureZ?: FeatureKey;
    C: number;
    kernel: 'linear' | 'rbf' | 'poly';
  }) => void;
}

const CHALLENGES: ChallengeTask[] = [
  {
    id: 'ch-1',
    title: 'Misión 1: Las Dos Grandes Fuerzas',
    badge: 'Principiante',
    scenario:
      'Un fondo de inversión inmobiliario necesita un modelo lineal veloz para identificar propiedades premium. Sospechan que el Ingreso Medio del vecindario y los Metros Cuadrados son los dos factores decisivos.',
    objective: 'Selecciona Ingreso Medio y Metraje Cuadrado con Kernel Lineal y alcanza una precisión superior al 82%.',
    targetAccuracy: 0.82,
    hint: 'Configura Variable X = Ingreso Familiar Medio, Variable Y = Metraje Construido, y Kernel = Lineal.',
    recommendedVariables: ['median_income', 'sqft'],
  },
  {
    id: 'ch-2',
    title: 'Misión 2: Domar el Sobreajuste (Soft Margin)',
    badge: 'Intermedio',
    scenario:
      'Hay algunas casas atípicas (casas pequeñas pero carísimas por reformas de lujo). Si fijas un C muy alto, el margen colapsará tratando de clasificar todas a la fuerza.',
    objective: 'Ajusta el parámetro C a un valor moderado (entre 0.1 y 2.0) logrando un margen ancho (> 0.05) con precisión > 80%.',
    targetAccuracy: 0.80,
    hint: 'Baja el valor de C para permitir un margen blando que tolere anomalías sin perder la tendencia general.',
    recommendedVariables: ['median_income', 'ocean_proximity'],
  },
  {
    id: 'ch-3',
    title: 'Misión 3: El Arte de la Escasez (Sparsity)',
    badge: 'Avanzado',
    scenario:
      'Cuantos menos vectores de soporte tenga un SVM, más rápida es la predicción en tiempo real y menor la memoria requerida.',
    objective: 'Consigue clasificar el mercado con MENOS de 25 Vectores de Soporte activos y más del 78% de precisión.',
    targetAccuracy: 0.78,
    maxSupportVectors: 25,
    hint: 'Utiliza variables altamente separables (Ingreso vs Ubicación Costa) y regularización C equilibrada.',
    recommendedVariables: ['median_income', 'ocean_proximity'],
  },
  {
    id: 'ch-4',
    title: 'Misión 4: El Escudo Tridimensional',
    badge: 'Experto',
    scenario:
      'Dos variables no son suficientes para captar vecindarios históricos que son costosos pese a ser antiguos. ¡Necesitamos la 3ª dimensión (Antigüedad o Ubicación)!',
    objective: 'Logra más del 85% de precisión combinando 3 variables en el hiperplano 3D.',
    targetAccuracy: 0.85,
    hint: 'Cambia al modo 3D y selecciona Ingreso, Metraje y Ubicación Costa.',
    recommendedVariables: ['median_income', 'sqft'],
  },
];

export const ChallengesMode: React.FC<ChallengesModeProps> = ({
  model,
  featureX,
  featureY,
  onApplyPreset,
}) => {
  const [activeChallengeId, setActiveChallengeId] = useState<string>('ch-1');
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());

  const activeChallenge = CHALLENGES.find((c) => c.id === activeChallengeId) || CHALLENGES[0];

  const evaluateCurrentState = (ch: ChallengeTask) => {
    const accuracyMet = model.accuracy >= ch.targetAccuracy;
    const svsMet = ch.maxSupportVectors ? model.totalSupportVectors <= ch.maxSupportVectors : true;
    return accuracyMet && svsMet;
  };

  const isCurrentPassed = evaluateCurrentState(activeChallenge);

  const handleClaimVictory = () => {
    if (isCurrentPassed && !completedChallenges.has(activeChallenge.id)) {
      const nextSet = new Set(completedChallenges);
      nextSet.add(activeChallenge.id);
      setCompletedChallenges(nextSet);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Desafíos y Retos Lúdicos de Clasificación SVM
            </h2>
            <p className="text-xs text-slate-400">
              Pon a prueba tu intuición como científico de datos ajustando variables, kernels y regularización C.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Completados:</span>
          <span className="font-bold text-emerald-400 font-mono">
            {completedChallenges.size} / {CHALLENGES.length}
          </span>
        </div>
      </div>

      {/* Grid de desafíos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {CHALLENGES.map((ch, idx) => {
          const isDone = completedChallenges.has(ch.id);
          const isSelected = activeChallengeId === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => setActiveChallengeId(ch.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {ch.badge}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-100">{ch.title}</div>
              <div className="text-[11px] text-slate-400">Obj: &gt; {(ch.targetAccuracy * 100).toFixed(0)}% Precisión</div>
            </button>
          );
        })}
      </div>

      {/* Panel del Desafío Activo */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {activeChallenge.title}
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            Dificultad: <strong className="text-amber-400">{activeChallenge.badge}</strong>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
          <strong className="text-slate-200 block mb-1">Contexto del Mercado:</strong>
          {activeChallenge.scenario}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-xl p-4 text-xs">
            <span className="text-indigo-400 font-bold block mb-1">🎯 Objetivo a Lograr:</span>
            <p className="text-slate-300">{activeChallenge.objective}</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() =>
                  onApplyPreset({
                    featureX: activeChallenge.recommendedVariables[0],
                    featureY: activeChallenge.recommendedVariables[1],
                    C: 1.0,
                    kernel: 'linear',
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3 h-3" />
                Cargar Variables Sugeridas
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-xs flex flex-col justify-between gap-2">
            <div>
              <span className="text-slate-400 font-bold block mb-1">Estado de tu Modelo Actual:</span>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Precisión obtenida:</span>
                <span
                  className={`font-mono font-bold ${
                    model.accuracy >= activeChallenge.targetAccuracy
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {(model.accuracy * 100).toFixed(1)}% / {(activeChallenge.targetAccuracy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Vectores de soporte:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {model.totalSupportVectors} {activeChallenge.maxSupportVectors ? `(Meta: ≤ ${activeChallenge.maxSupportVectors})` : ''}
                </span>
              </div>
            </div>

            <button
              id="claim-victory-btn"
              onClick={handleClaimVictory}
              disabled={!isCurrentPassed}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isCurrentPassed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isCurrentPassed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Completar y Reclamar Medalla!
                </>
              ) : (
                'Objetivo aún no alcanzado (Ajusta variables o C)'
              )}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-start gap-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">Pista didáctica: </strong>
            {activeChallenge.hint}
          </span>
        </div>
      </div>
    </div>
  );
};
