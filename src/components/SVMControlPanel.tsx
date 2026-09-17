import React from 'react';
import { FeatureKey, SVMKernel, AppViewMode } from '../types';
import { FEATURES_METADATA } from '../data/housingDataset';
import {
  Sliders,
  Layers,
  Box,
  Compass,
  Trophy,
  BookMarked,
  DollarSign,
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';

interface SVMControlPanelProps {
  currentView: AppViewMode;
  onViewChange: (view: AppViewMode) => void;
  featureX: FeatureKey;
  onFeatureXChange: (key: FeatureKey) => void;
  featureY: FeatureKey;
  onFeatureYChange: (key: FeatureKey) => void;
  featureZ: FeatureKey;
  onFeatureZChange: (key: FeatureKey) => void;
  kernel: SVMKernel;
  onKernelChange: (k: SVMKernel) => void;
  C: number;
  onCChange: (val: number) => void;
  gamma: number;
  onGammaChange: (val: number) => void;
  priceThreshold: number;
  onPriceThresholdChange: (val: number) => void;
  onOpenGlossary: () => void;
  onResetDefaults: () => void;
}

export const SVMControlPanel: React.FC<SVMControlPanelProps> = ({
  currentView,
  onViewChange,
  featureX,
  onFeatureXChange,
  featureY,
  onFeatureYChange,
  featureZ,
  onFeatureZChange,
  kernel,
  onKernelChange,
  C,
  onCChange,
  gamma,
  onGammaChange,
  priceThreshold,
  onPriceThresholdChange,
  onOpenGlossary,
  onResetDefaults,
}) => {
  const featureKeys = Object.keys(FEATURES_METADATA) as FeatureKey[];

  return (
    <div className="w-full flex flex-col gap-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Selector de Pestañas de Vista */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            id="tab-2d-btn"
            onClick={() => onViewChange('2D')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              currentView === '2D'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Simulador 2D
          </button>

          <button
            id="tab-3d-btn"
            onClick={() => onViewChange('3D')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              currentView === '3D'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Simulador 3D
          </button>

          <button
            id="tab-kernel-trick-btn"
            onClick={() => onViewChange('kernel_trick')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'kernel_trick'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Truco del Núcleo
          </button>

          <button
            id="tab-tour-btn"
            onClick={() => onViewChange('tour')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'tour'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Ruta Didáctica
          </button>

          <button
            id="tab-challenges-btn"
            onClick={() => onViewChange('challenges')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'challenges'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Retos Lúdicos
          </button>
        </div>

        {/* Botón de Glosario */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGlossary}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            Glosario Matemático
          </button>

          <button
            onClick={onResetDefaults}
            title="Restablecer valores predeterminados"
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controles de Variables y Parámetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Selección de Variables X & Y (y Z en 3D) */}
        <div className="flex flex-col gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            Variables del Dataset:
          </span>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Eje X:</label>
            <select
              id="select-feature-x"
              value={featureX}
              onChange={(e) => onFeatureXChange(e.target.value as FeatureKey)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-sky-500"
            >
              {featureKeys.map((k) => (
                <option key={`x-${k}`} value={k} disabled={k === featureY || k === featureZ}>
                  {FEATURES_METADATA[k].name} ({FEATURES_METADATA[k].unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Eje Y:</label>
            <select
              id="select-feature-y"
              value={featureY}
              onChange={(e) => onFeatureYChange(e.target.value as FeatureKey)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-sky-500"
            >
              {featureKeys.map((k) => (
                <option key={`y-${k}`} value={k} disabled={k === featureX || k === featureZ}>
                  {FEATURES_METADATA[k].name} ({FEATURES_METADATA[k].unit})
                </option>
              ))}
            </select>
          </div>

          {currentView === '3D' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Eje Z (3D):</label>
              <select
                id="select-feature-z"
                value={featureZ}
                onChange={(e) => onFeatureZChange(e.target.value as FeatureKey)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-purple-500"
              >
                {featureKeys.map((k) => (
                  <option key={`z-${k}`} value={k} disabled={k === featureX || k === featureY}>
                    {FEATURES_METADATA[k].name} ({FEATURES_METADATA[k].unit})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selección de Kernel */}
        <div className="flex flex-col gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Función Kernel:
          </span>

          <div className="flex flex-col gap-1.5">
            {(['linear', 'rbf', 'poly'] as SVMKernel[]).map((k) => (
              <label
                key={k}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  kernel === k
                    ? 'bg-indigo-950/40 border-indigo-500 text-white font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="svm-kernel"
                  value={k}
                  checked={kernel === k}
                  onChange={() => onKernelChange(k)}
                  className="accent-indigo-500"
                />
                <div>
                  <span className="capitalize">{k === 'linear' ? 'Lineal' : k === 'rbf' ? 'RBF (Gaussiano)' : 'Polinomial'}</span>
                  <span className="block text-[10px] text-slate-500">
                    {k === 'linear'
                      ? 'Frontera plana sin curvatura'
                      : k === 'rbf'
                      ? 'Campanas radiales flexibles'
                      : 'Curvas de grado 2'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Regularización C y Gamma */}
        <div className="flex flex-col gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <span className="font-bold text-slate-200 flex items-center justify-between">
            <span>Regularización C:</span>
            <span className="font-mono text-indigo-400 font-bold">{C.toFixed(2)}</span>
          </span>

          <input
            id="input-param-c"
            type="range"
            min="0.05"
            max="20"
            step="0.05"
            value={C}
            onChange={(e) => onCChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.05 (Margen Blando)</span>
            <span>20 (Margen Duro)</span>
          </div>

          {kernel === 'rbf' && (
            <div className="mt-1 pt-2 border-t border-slate-800/80">
              <span className="font-bold text-slate-200 flex items-center justify-between">
                <span>Gamma (γ):</span>
                <span className="font-mono text-purple-400 font-bold">{gamma.toFixed(2)}</span>
              </span>
              <input
                id="input-param-gamma"
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={gamma}
                onChange={(e) => onGammaChange(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer mt-1"
              />
            </div>
          )}
        </div>

        {/* Umbral de Precio de Vivienda */}
        <div className="flex flex-col gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <span className="font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Umbral Alta Gama:
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              ${priceThreshold.toLocaleString()}
            </span>
          </span>

          <input
            id="input-price-threshold"
            type="range"
            min="220000"
            max="480000"
            step="10000"
            value={priceThreshold}
            onChange={(e) => onPriceThresholdChange(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Las casas con precio mayor son etiqueta <span className="text-emerald-400 font-bold">+1 (Alta Gama)</span> y las menores o iguales son <span className="text-orange-400 font-bold">-1 (Estándar)</span>.
          </p>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => onPriceThresholdChange(300000)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              $300k
            </button>
            <button
              onClick={() => onPriceThresholdChange(350000)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              $350k (Defecto)
            </button>
            <button
              onClick={() => onPriceThresholdChange(420000)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              $420k
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
