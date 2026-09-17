import React, { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Compass,
  Layers,
  Scale,
  Target,
  CheckCircle2,
  Sliders,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepContent {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  mathFormula: string;
  analogy: string;
  coreConcepts: string[];
  experimentTask: string;
}

const TOUR_STEPS: StepContent[] = [
  {
    stepNumber: 1,
    title: 'El Hiperplano de Decisión',
    subtitle: 'La frontera geométrica que clasifica el valor de las viviendas',
    icon: Compass,
    mathFormula: 'w₁·x₁ + w₂·x₂ + ... + wₙ·xₙ + b = 0  ⇒  w · x + b = 0',
    analogy:
      'Imagina una cerca recta construida en un terreno. A un lado quedan las casas de alta gama (precio > umbral) y al otro lado las casas estándar. El vector normal w indica hacia dónde apunta el lado positivo (más costoso).',
    coreConcepts: [
      'En 2D, el hiperplano es una línea recta (dimensión 1).',
      'En 3D, el hiperplano es una lámina o superficie plana (dimensión 2).',
      'En N dimensiones, tiene siempre dimensión N - 1.',
      'w determina la inclinación u orientación y b determina el desplazamiento respecto al origen.',
    ],
    experimentTask: 'Ve a la pestaña 2D y observa la línea azul brillante central: separa las viviendas verdes de las naranjas.',
  },
  {
    stepNumber: 2,
    title: 'Los Vectores de Soporte (Support Vectors)',
    subtitle: 'Los guardianes críticos que sostienen la frontera',
    icon: Sparkles,
    mathFormula: 'yᵢ(w · xᵢ + b) = 1  con  αᵢ > 0',
    analogy:
      'Imagina que estás tensando una lona gigante entre dos grupos de personas: solo las personas que están justo en el borde tocan la lona. Si las personas del fondo caminan o se van, ¡la lona no se mueve en absoluto!',
    coreConcepts: [
      'Solo las viviendas ubicadas en el margen crítico definen w y b.',
      'El 90%+ de las casas en el dataset tienen multiplicador de Lagrange αᵢ = 0 (no influyen).',
      'Esto otorga a las SVM una propiedad matemática formidable: la escasez (sparsity) y resistencia a datos irrelevantes lejanos.',
    ],
    experimentTask: 'Activa el botón "Aislar Vectores Soporte" en el gráfico 2D. Observa cómo solo un puñado de casas determina todo el modelo.',
  },
  {
    stepNumber: 3,
    title: 'El Margen Máximo (2 / ||w||)',
    subtitle: 'Por qué no cualquier línea recta sirve',
    icon: Scale,
    mathFormula: 'Margen = 2 / ||w||  ⇒  Minimizar 1/2 ||w||²',
    analogy:
      'Podrías trazar muchas líneas distintas que separen las casas, pero si trazas una línea pegadita a una casa, la próxima casa que se venda podría quedar del lado equivocado. SVM busca construir la "avenida más ancha posible" entre ambos vecindarios.',
    coreConcepts: [
      'Al maximizar la distancia entre las clases, se minimiza el riesgo de error con viviendas nuevas (alta generalización).',
      'La franja sombreada entre las líneas discontinuas verde y naranja es la "calle del margen".',
      'En el margen ideal no debería haber ninguna vivienda (margen duro / hard margin).',
    ],
    experimentTask: 'Juega en el mini-juego interactivo de abajo intentando alinear manualmente una frontera para maximizar el margen.',
  },
  {
    stepNumber: 4,
    title: 'Margen Blando y el Parámetro C',
    subtitle: 'El dilema de tolerar viviendas atípicas vs sobreajuste',
    icon: Sliders,
    mathFormula: 'Minimizar  1/2 ||w||² + C · Σ ξᵢ',
    analogy:
      '¿Qué pasa si en un barrio popular alguien construye una mansión de 1 millón de dólares? Si la SVM fuera inflexible (C infinito), torcería toda la frontera para complacer esa casa rara, arruinando la predicción de las demás.',
    coreConcepts: [
      'C grande (Margen Duro): Castiga con severidad cada casa mal clasificada. Riesgo de sobreajuste (overfitting).',
      'C pequeño (Margen Blando): Es más flexible, acepta que algunas casas queden dentro de la calle del margen con tal de mantener una frontera simple y robusta.',
      'Las variables de holgura ξᵢ miden la distancia que una casa transgresora penetra dentro del margen.',
    ],
    experimentTask: 'Mueve el control deslizante de C en el panel de control: con C=0.01 el margen se ensancha; con C=50 se vuelve sumamente estricto.',
  },
  {
    stepNumber: 5,
    title: 'El Truco del Núcleo (Kernel Trick)',
    subtitle: 'La magia de curvar fronteras proyectando a altas dimensiones',
    icon: Layers,
    mathFormula: 'K(x, z) = ⟨Φ(x), Φ(z)⟩   (ej: Gaussiano RBF, Polinomial)',
    analogy:
      'Si tienes una mancha circular de viviendas de lujo en el centro de la ciudad rodeada de suburbios, ninguna línea recta puede separarlas en un mapa plano. ¡Pero si levantas el centro como un domo en 3D, una hoja plana corta a la perfección!',
    coreConcepts: [
      'Calcula relaciones no lineales sin necesidad de calcular explícitamente coordenadas de dimensiones gigantescas.',
      'Kernel RBF: Excelente para islas o vecindarios con formas orgánicas complejas.',
      'Parámetro Gamma (γ): Controla qué tan localizada es la campana de influencia de cada vector de soporte.',
    ],
    experimentTask: 'Abre la pestaña "Truco del Núcleo" para ver la animación 3D de las casas levantándose como un domo.',
  },
];

export const PedagogicalTour: React.FC = () => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [manualAngle, setManualAngle] = useState<number>(45);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [minigameScore, setMinigameScore] = useState<number | null>(null);

  const step = TOUR_STEPS[currentStepIdx];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const evaluateMinigame = () => {
    // La solución óptima teórica para el mini-juego de orientación está en ~52° con offset 12
    const angleDiff = Math.abs(manualAngle - 52);
    const offsetDiff = Math.abs(manualOffset - 12);
    const totalError = angleDiff * 1.5 + offsetDiff * 2.0;
    const score = Math.max(10, Math.round(100 - totalError));
    setMinigameScore(score);

    if (score >= 80) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Barra de progreso de la ruta pedagógica */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              Ruta de Aprendizaje: Máquinas de Soporte Vectorial (SVM)
            </h2>
            <p className="text-xs text-slate-400">
              Módulo interactivo guiado: comprende cada componente matemático con analogías prácticas inmobiliarias.
            </p>
          </div>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => setCurrentStepIdx(idx)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                currentStepIdx === idx
                  ? 'bg-indigo-600 text-white shadow-md'
                  : currentStepIdx > idx
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.stepNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal del paso */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna izquierda: Explicación y Conceptos (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Paso {step.stepNumber} de {TOUR_STEPS.length}
              </span>
              <h3 className="text-xl font-bold text-slate-100">{step.title}</h3>
              <p className="text-xs text-slate-400">{step.subtitle}</p>
            </div>
          </div>

          {/* Tarjeta de la Fórmula Matemática */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              Ecuación Fundamental:
            </div>
            <div className="font-mono text-sm text-sky-300 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800/80 overflow-x-auto">
              {step.mathFormula}
            </div>
          </div>

          {/* Tarjeta de Analogía Didáctica Inmobiliaria */}
          <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 text-xs">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Analogía Intuitiva:
            </div>
            <p className="text-slate-300 leading-relaxed">{step.analogy}</p>
          </div>

          {/* Viñetas clave */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-200 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Principios que debes recordar:
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {step.coreConcepts.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Columna derecha: Tarea de Experimentación o Mini-juego (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-slate-950/60 border border-slate-800/90 rounded-xl p-5">
          {step.stepNumber === 3 ? (
            /* Mini-juego interactivo: El Reto del Agrimensor */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Scale className="w-4 h-4" />
                Mini-Juego: Encuentra la Frontera de Margen Máximo
              </div>
              <p className="text-xs text-slate-400">
                Usa los controles para orientar la línea manual. Tu objetivo es separar las casas y dejar el mayor espacio vacío posible entre ambas.
              </p>

              <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Ángulo de Inclinación:</span>
                    <span className="font-mono text-sky-400 font-bold">{manualAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    value={manualAngle}
                    onChange={(e) => setManualAngle(parseInt(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Desplazamiento b (Offset):</span>
                    <span className="font-mono text-purple-400 font-bold">{manualOffset}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={manualOffset}
                    onChange={(e) => setManualOffset(parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={evaluateMinigame}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-md mt-1"
                >
                  ¡Evaluar mi Margen Manual vs SVM!
                </button>

                {minigameScore !== null && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex flex-col gap-1 text-center ${
                      minigameScore >= 80
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <span className="font-bold text-sm">
                      Tu Puntuación: {minigameScore} / 100
                    </span>
                    <span className="text-[11px]">
                      {minigameScore >= 80
                        ? '¡Excelente ojo geométrico! Tu línea coincide casi al milímetro con el vector w calculado por la optimización de Lagrange.'
                        : 'Tu línea clasifica, pero está muy cercana a una de las casas. ¡El algoritmo cuadrático del SVM logra un margen más despejado!'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tarea de laboratorio para los otros pasos */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                <HelpCircle className="w-4 h-4" />
                Misión de Observación:
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {step.experimentTask}
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Consejo: Cambia en cualquier momento a la vista 2D o 3D para probar lo aprendido con las viviendas de EE.UU.
                </span>
              </div>
            </div>
          )}

          {/* Navegación anterior / siguiente */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentStepIdx === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-600 bg-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {currentStepIdx + 1} / {TOUR_STEPS.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentStepIdx === TOUR_STEPS.length - 1}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentStepIdx === TOUR_STEPS.length - 1
                  ? 'opacity-30 cursor-not-allowed text-slate-600 bg-slate-900'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
