import React, { useState, useMemo } from 'react';
import {
  FeatureKey,
  SVMKernel,
  AppViewMode,
  HousingRecord,
} from './types';
import { generateHousingDataset, FEATURES_METADATA } from './data/housingDataset';
import { trainSVM } from './utils/svmSolver';
import { SVMVisualizer2D } from './components/SVMVisualizer2D';
import { SVMVisualizer3D } from './components/SVMVisualizer3D';
import { KernelTrickDemo } from './components/KernelTrickDemo';
import { PedagogicalTour } from './components/PedagogicalTour';
import { ChallengesMode } from './components/ChallengesMode';
import { SVMControlPanel } from './components/SVMControlPanel';
import { AITutorPanel } from './components/AITutorPanel';
import { MathGlossaryModal } from './components/MathGlossaryModal';
import { DatasetExplorer } from './components/DatasetExplorer';
import {
  Compass,
  Box,
  Sparkles,
  Database,
  Layers,
  BrainCircuit,
  HelpCircle,
  BarChart3,
  Home,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // Configuración de visualización y dataset
  const [currentView, setCurrentView] = useState<AppViewMode>('2D');
  const [priceThreshold, setPriceThreshold] = useState<number>(350000);
  const [featureX, setFeatureX] = useState<FeatureKey>('median_income');
  const [featureY, setFeatureY] = useState<FeatureKey>('sqft');
  const [featureZ, setFeatureZ] = useState<FeatureKey>('ocean_proximity');

  // Hiperparámetros de SVM
  const [kernel, setKernel] = useState<SVMKernel>('linear');
  const [C, setC] = useState<number>(1.0);
  const [gamma, setGamma] = useState<number>(1.0);
  const [degree, setDegree] = useState<number>(2);

  // Modales y paneles secundarios
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [showDatasetTable, setShowDatasetTable] = useState<boolean>(false);

  // Dataset reactivo ante el umbral de precio
  const records = useMemo(() => {
    return generateHousingDataset(priceThreshold);
  }, [priceThreshold]);

  // Variables activas según el modo (2D usa [X, Y], 3D usa [X, Y, Z])
  const activeFeatures = useMemo(() => {
    if (currentView === '3D') {
      return [featureX, featureY, featureZ];
    }
    return [featureX, featureY];
  }, [currentView, featureX, featureY, featureZ]);

  // Modelo SVM entrenado
  const model = useMemo(() => {
    return trainSVM(records, activeFeatures, {
      kernel,
      C,
      gamma,
      degree,
    });
  }, [records, activeFeatures, kernel, C, gamma, degree]);

  const handleResetDefaults = () => {
    setFeatureX('median_income');
    setFeatureY('sqft');
    setFeatureZ('ocean_proximity');
    setKernel('linear');
    setC(1.0);
    setGamma(1.0);
    setPriceThreshold(350000);
  };

  const handleApplyPreset = (config: {
    featureX: FeatureKey;
    featureY: FeatureKey;
    featureZ?: FeatureKey;
    C: number;
    kernel: 'linear' | 'rbf' | 'poly';
  }) => {
    setFeatureX(config.featureX);
    setFeatureY(config.featureY);
    if (config.featureZ) setFeatureZ(config.featureZ);
    setC(config.C);
    setKernel(config.kernel);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/90 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-100 tracking-tight">
                Simulador SVM: Housing Dataset (EE.UU.)
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Máquinas de Soporte Vectorial
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Laboratorio interactivo y pedagógico en 2D y 3D con datos reales de viviendas
            </p>
          </div>
        </div>

        {/* Métricas en vivo en la barra superior */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Precisión:</span>
            <span className="font-mono font-bold text-emerald-400">
              {(model.accuracy * 100).toFixed(1)}%
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Margen (2/||w||):</span>
            <span className="font-mono font-bold text-amber-400">
              {model.marginWidth.toFixed(4)}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Vectores de Soporte:</span>
            <span className="font-mono font-bold text-indigo-400">
              {model.totalSupportVectors} / {records.length}
            </span>
          </div>

          <button
            onClick={() => setShowDatasetTable(!showDatasetTable)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showDatasetTable
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Dataset ({records.length})
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Panel de Control de Variables, Hiperparámetros y Vistas */}
        <SVMControlPanel
          currentView={currentView}
          onViewChange={setCurrentView}
          featureX={featureX}
          onFeatureXChange={setFeatureX}
          featureY={featureY}
          onFeatureYChange={setFeatureY}
          featureZ={featureZ}
          onFeatureZChange={setFeatureZ}
          kernel={kernel}
          onKernelChange={setKernel}
          C={C}
          onCChange={setC}
          gamma={gamma}
          onGammaChange={setGamma}
          priceThreshold={priceThreshold}
          onPriceThresholdChange={setPriceThreshold}
          onOpenGlossary={() => setIsGlossaryOpen(true)}
          onResetDefaults={handleResetDefaults}
        />

        {/* Tabla exploradora de dataset desplegable */}
        {showDatasetTable && (
          <DatasetExplorer
            records={records}
            model={model}
            priceThreshold={priceThreshold}
          />
        )}

        {/* Renderizado de la Vista Seleccionada */}
        <div className="w-full">
          {currentView === '2D' && (
            <SVMVisualizer2D
              records={records}
              model={model}
              featureX={featureX}
              featureY={featureY}
              priceThreshold={priceThreshold}
            />
          )}

          {currentView === '3D' && (
            <SVMVisualizer3D
              records={records}
              model={model}
              featureX={featureX}
              featureY={featureY}
              featureZ={featureZ}
              priceThreshold={priceThreshold}
            />
          )}

          {currentView === 'kernel_trick' && <KernelTrickDemo />}

          {currentView === 'tour' && <PedagogicalTour />}

          {currentView === 'challenges' && (
            <ChallengesMode
              model={model}
              featureX={featureX}
              featureY={featureY}
              featureZ={featureZ}
              onApplyPreset={handleApplyPreset}
            />
          )}
        </div>

        {/* Tutor Pedagógico con Inteligencia Artificial (Google Gemini) */}
        <AITutorPanel
          model={model}
          featureX={featureX}
          featureY={featureY}
          featureZ={currentView === '3D' ? featureZ : undefined}
          priceThreshold={priceThreshold}
          totalPoints={records.length}
          mode={currentView}
        />
      </main>

      {/* Modal del Glosario Matemático y Fórmulas */}
      <MathGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Pie de Página */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>Desarrollado con Google AI Studio</span>
          <span>•</span>
          <span>Dataset: Precios de Viviendas en EE.UU.</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Hiperplano w·x + b = 0</span>
          <span>Margen = 2/||w||</span>
          <span>Dualidad de Lagrange</span>
        </div>
      </footer>
    </div>
  );
}
