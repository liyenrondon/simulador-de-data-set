import React, { useState, useRef } from 'react';
import { FeatureKey, HousingRecord, SVMModelResult } from '../types';
import { FEATURES_METADATA, normalizeFeature } from '../data/housingDataset';
import { Eye, Info, Sparkles, MapPin, DollarSign, Home, CheckCircle2 } from 'lucide-react';

interface SVMVisualizer2DProps {
  records: HousingRecord[];
  model: SVMModelResult;
  featureX: FeatureKey;
  featureY: FeatureKey;
  priceThreshold: number;
}

interface TestPoint {
  xVal: number;
  yVal: number;
  score: number;
  label: 1 | -1;
  dist: number;
}

export const SVMVisualizer2D: React.FC<SVMVisualizer2DProps> = ({
  records,
  model,
  featureX,
  featureY,
  priceThreshold,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRecord, setHoveredRecord] = useState<HousingRecord | null>(null);
  const [testPoint, setTestPoint] = useState<TestPoint | null>(null);
  const [showOnlySVs, setShowOnlySVs] = useState<boolean>(false);
  const [showMarginCorridor, setShowMarginCorridor] = useState<boolean>(true);
  const [showProjections, setShowProjections] = useState<boolean>(true);

  const metaX = FEATURES_METADATA[featureX];
  const metaY = FEATURES_METADATA[featureY];

  const width = 720;
  const height = 480;
  const padding = { top: 40, right: 40, bottom: 60, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Mapear valor humano a coordenadas de pixel SVG
  const scaleX = (val: number) => {
    const fraction = (val - metaX.min) / (metaX.max - metaX.min);
    return padding.left + fraction * plotWidth;
  };

  const scaleY = (val: number) => {
    const fraction = (val - metaY.min) / (metaY.max - metaY.min);
    return padding.top + (1 - fraction) * plotHeight;
  };

  // Inverso para convertir clicks en valores de características
  const invertX = (px: number) => {
    const fraction = Math.max(0, Math.min(1, (px - padding.left) / plotWidth));
    return metaX.min + fraction * (metaX.max - metaX.min);
  };

  const invertY = (py: number) => {
    const fraction = Math.max(0, Math.min(1, 1 - (py - padding.top) / plotHeight));
    return metaY.min + fraction * (metaY.max - metaY.min);
  };

  // Mapear punto normalizado [-1, 1] a pixel SVG
  const normToPixel = (normX: number, normY: number) => {
    const fractionX = (normX + 1) / 2;
    const fractionY = (normY + 1) / 2;
    return {
      x: padding.left + fractionX * plotWidth,
      y: padding.top + (1 - fractionY) * plotHeight,
    };
  };

  // Evaluar líneas del hiperplano lineal: w0*x_norm + w1*y_norm + b = target
  // target = 0 (hiperplano), +1 (margen positivo), -1 (margen negativo)
  const computeBoundaryLine = (target: number) => {
    if (model.kernel !== 'linear' || model.weights.length < 2) return null;
    const w0 = model.weights[0];
    const w1 = model.weights[1];
    const b = model.bias;

    if (Math.abs(w1) < 1e-6) {
      // Línea vertical
      const normX = (target - b) / w0;
      if (normX < -1.5 || normX > 1.5) return null;
      const p1 = normToPixel(normX, -1);
      const p2 = normToPixel(normX, 1);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }

    // Calcular en los extremos normX = -1 y normX = +1
    const normY_at_left = (target - b - w0 * -1) / w1;
    const normY_at_right = (target - b - w0 * 1) / w1;

    const pLeft = normToPixel(-1, normY_at_left);
    const pRight = normToPixel(1, normY_at_right);

    return {
      x1: pLeft.x,
      y1: pLeft.y,
      x2: pRight.x,
      y2: pRight.y,
    };
  };

  const lineCenter = computeBoundaryLine(0);
  const linePos = computeBoundaryLine(1);
  const lineNeg = computeBoundaryLine(-1);

  // Generar contornos discretos para Kernel RBF o Poly si no es lineal
  const renderKernelGridContours = () => {
    if (model.kernel === 'linear') return null;

    const gridRes = 30;
    const cells: React.ReactNode[] = [];
    const cellW = plotWidth / gridRes;
    const cellH = plotHeight / gridRes;

    for (let i = 0; i < gridRes; i++) {
      for (let j = 0; j < gridRes; j++) {
        const normX = -1 + (i / gridRes) * 2;
        const normY = -1 + (j / gridRes) * 2;
        const pred = model.predict([normX, normY]);
        const px = padding.left + i * cellW;
        const py = padding.top + (gridRes - 1 - j) * cellH;

        let fill = 'transparent';
        if (Math.abs(pred.score) < 0.25) {
          fill = 'rgba(234, 179, 8, 0.25)'; // Franja de frontera
        } else if (pred.score > 0) {
          fill = `rgba(16, 185, 129, ${Math.min(0.22, Math.abs(pred.score) * 0.08)})`;
        } else {
          fill = `rgba(249, 115, 22, ${Math.min(0.22, Math.abs(pred.score) * 0.08)})`;
        }

        cells.push(
          <rect
            key={`grid-${i}-${j}`}
            x={px}
            y={py}
            width={cellW + 0.5}
            height={cellH + 0.5}
            fill={fill}
          />
        );
      }
    }
    return <g id="svm-kernel-background-mesh">{cells}</g>;
  };

  // Click en el gráfico para probar un nuevo punto
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
      clickX < padding.left ||
      clickX > width - padding.right ||
      clickY < padding.top ||
      clickY > height - padding.bottom
    ) {
      return;
    }

    const humanX = invertX(clickX);
    const humanY = invertY(clickY);

    const normX = normalizeFeature(humanX, featureX);
    const normY = normalizeFeature(humanY, featureY);

    const pred = model.predict([normX, normY]);
    const normW = Math.sqrt(
      model.weights.reduce((sum, val) => sum + val * val, 0) || 1
    );

    setTestPoint({
      xVal: humanX,
      yVal: humanY,
      score: pred.score,
      label: pred.label,
      dist: Math.abs(pred.score) / normW,
    });
  };

  const isSV = (recId: string) =>
    model.supportVectors.some((sv) => sv.id === recId);

  return (
    <div className="w-full flex flex-col gap-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Controles de visualización superiores */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Plano 2D: {metaX.name} vs {metaY.name}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold border border-indigo-500/30">
            Kernel: {model.kernel.toUpperCase()}
          </span>
        </div>

        {/* Toggles pedagógicos */}
        <div className="flex items-center gap-2 text-xs">
          <button
            id="toggle-margin-btn"
            onClick={() => setShowMarginCorridor(!showMarginCorridor)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showMarginCorridor
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Muestra el corredor del margen w·x + b = ±1"
          >
            <Eye className="w-3.5 h-3.5" />
            Corredor del Margen
          </button>

          <button
            id="toggle-projections-btn"
            onClick={() => setShowProjections(!showProjections)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showProjections
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Muestra líneas perpendiculares desde los vectores de soporte a la frontera"
          >
            Proyecciones SV
          </button>

          <button
            id="toggle-only-svs-btn"
            onClick={() => setShowOnlySVs(!showOnlySVs)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showOnlySVs
                ? 'bg-purple-500/25 border-purple-500/50 text-purple-300 font-semibold'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Oculta las casas que no son vectores de soporte para mostrar que no afectan el hiperplano"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Aislar Vectores Soporte ({model.totalSupportVectors})
          </button>
        </div>
      </div>

      {/* Canvas SVG Interactivo */}
      <div
        ref={containerRef}
        className="relative w-full overflow-x-auto flex justify-center bg-slate-950/90 rounded-xl p-2 border border-slate-800/60 shadow-inner"
      >
        <svg
          id="svm-2d-canvas-svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onClick={handleSvgClick}
          className="cursor-crosshair select-none"
        >
          <defs>
            {/* Gradiente para corredor de margen */}
            <linearGradient id="marginCorridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
              <stop offset="100%" stopColor="rgba(217, 119, 6, 0.08)" />
            </linearGradient>

            {/* Marcador de flecha para el vector normal w */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Malla de fondo para kernels no lineales */}
          {renderKernelGridContours()}

          {/* Rejilla de coordenadas y ticks */}
          <g id="grid-lines" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3">
            {[0.25, 0.5, 0.75].map((t, idx) => {
              const gx = padding.left + t * plotWidth;
              const gy = padding.top + t * plotHeight;
              return (
                <g key={`grid-${idx}`}>
                  <line x1={gx} y1={padding.top} x2={gx} y2={height - padding.bottom} />
                  <line x1={padding.left} y1={gy} x2={width - padding.right} y2={gy} />
                </g>
              );
            })}
          </g>

          {/* Corredor de margen en modo lineal */}
          {model.kernel === 'linear' && showMarginCorridor && linePos && lineNeg && (
            <polygon
              id="margin-corridor-polygon"
              points={`${linePos.x1},${linePos.y1} ${linePos.x2},${linePos.y2} ${lineNeg.x2},${lineNeg.y2} ${lineNeg.x1},${lineNeg.y1}`}
              fill="url(#marginCorridorGrad)"
            />
          )}

          {/* Líneas del hiperplano y márgenes (modo lineal) */}
          {model.kernel === 'linear' && (
            <g id="svm-linear-lines">
              {/* Margen Positivo: w·x + b = +1 */}
              {showMarginCorridor && linePos && (
                <line
                  id="line-positive-margin"
                  x1={linePos.x1}
                  y1={linePos.y1}
                  x2={linePos.x2}
                  y2={linePos.y2}
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity="0.85"
                />
              )}

              {/* Margen Negativo: w·x + b = -1 */}
              {showMarginCorridor && lineNeg && (
                <line
                  id="line-negative-margin"
                  x1={lineNeg.x1}
                  y1={lineNeg.y1}
                  x2={lineNeg.x2}
                  y2={lineNeg.y2}
                  stroke="#fb923c"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity="0.85"
                />
              )}

              {/* Hiperplano de decisión principal: w·x + b = 0 */}
              {lineCenter && (
                <line
                  id="line-hyperplane-decision"
                  x1={lineCenter.x1}
                  y1={lineCenter.y1}
                  x2={lineCenter.x2}
                  y2={lineCenter.y2}
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  className="drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                />
              )}
            </g>
          )}

          {/* Proyecciones perpendiculares desde los Vectores de Soporte hacia la frontera */}
          {showProjections &&
            model.kernel === 'linear' &&
            lineCenter &&
            model.supportVectors.map((sv) => {
              const px = scaleX(sv.raw[featureX]);
              const py = scaleY(sv.raw[featureY]);

              // Proyección matemática al hiperplano
              const w0 = model.weights[0];
              const w1 = model.weights[1];
              const normSq = w0 * w0 + w1 * w1;
              if (normSq < 1e-6) return null;

              const normX = normalizeFeature(sv.raw[featureX], featureX);
              const normY = normalizeFeature(sv.raw[featureY], featureY);
              const distNorm = (w0 * normX + w1 * normY + model.bias) / normSq;
              const projNormX = normX - distNorm * w0;
              const projNormY = normY - distNorm * w1;
              const projPixel = normToPixel(projNormX, projNormY);

              return (
                <line
                  key={`proj-${sv.id}`}
                  x1={px}
                  y1={py}
                  x2={projPixel.x}
                  y2={projPixel.y}
                  stroke={sv.label === 1 ? '#34d399' : '#fb923c'}
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                  opacity="0.65"
                />
              );
            })}

          {/* Puntos de datos del mercado inmobiliario */}
          <g id="housing-data-points">
            {records.map((rec) => {
              const sv = isSV(rec.id);
              if (showOnlySVs && !sv) return null;

              const cx = scaleX(rec[featureX]);
              const cy = scaleY(rec[featureY]);
              const isPositive = rec.label === 1;

              return (
                <g
                  key={rec.id}
                  id={`point-${rec.id}`}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={() => setHoveredRecord(rec)}
                  onMouseLeave={() => setHoveredRecord(null)}
                >
                  {/* Halo especial pulsante si es Vector de Soporte */}
                  {sv && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="10"
                      fill="none"
                      stroke={isPositive ? '#10b981' : '#f97316'}
                      strokeWidth="2.5"
                      strokeDasharray="3,2"
                      className="animate-spin-slow opacity-90"
                    />
                  )}

                  {/* Círculo base de la vivienda */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={sv ? 6 : 4.5}
                    fill={isPositive ? '#10b981' : '#f97316'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className="drop-shadow-sm"
                  />
                </g>
              );
            })}
          </g>

          {/* Punto de prueba interactivo ingresado por el usuario */}
          {testPoint && (
            <g id="interactive-test-point">
              <circle
                cx={scaleX(testPoint.xVal)}
                cy={scaleY(testPoint.yVal)}
                r="14"
                fill="none"
                stroke="#ec4899"
                strokeWidth="2"
                strokeDasharray="4,2"
                className="animate-ping opacity-60"
              />
              <circle
                cx={scaleX(testPoint.xVal)}
                cy={scaleY(testPoint.yVal)}
                r="7"
                fill="#ec4899"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Ejes X e Y con etiquetas */}
          <g id="axes" stroke="#475569" strokeWidth="1.5">
            {/* Eje X */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
            />
            {/* Eje Y */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
            />
          </g>

          {/* Etiquetas de valores en los ejes */}
          <g id="axis-labels" fill="#94a3b8" fontSize="11" fontFamily="monospace">
            {/* Eje X min, medio, max */}
            <text x={padding.left} y={height - padding.bottom + 18} textAnchor="start">
              {metaX.min} {metaX.unit}
            </text>
            <text
              x={padding.left + plotWidth / 2}
              y={height - padding.bottom + 18}
              textAnchor="middle"
            >
              {Math.round((metaX.min + metaX.max) / 2)}
            </text>
            <text x={width - padding.right} y={height - padding.bottom + 18} textAnchor="end">
              {metaX.max} {metaX.unit}
            </text>

            {/* Título de eje X */}
            <text
              x={padding.left + plotWidth / 2}
              y={height - 12}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
              fontWeight="bold"
            >
              {metaX.name} ({metaX.unit})
            </text>

            {/* Eje Y min, medio, max */}
            <text x={padding.left - 10} y={height - padding.bottom} textAnchor="end">
              {metaY.min}
            </text>
            <text x={padding.left - 10} y={padding.top + plotHeight / 2} textAnchor="end">
              {Math.round((metaY.min + metaY.max) / 2)}
            </text>
            <text x={padding.left - 10} y={padding.top + 5} textAnchor="end">
              {metaY.max} {metaY.unit}
            </text>

            {/* Título de eje Y (rotado) */}
            <text
              transform={`translate(18, ${padding.top + plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
              fontWeight="bold"
            >
              {metaY.name} ({metaY.unit})
            </text>
          </g>
        </svg>

        {/* Leyenda flotante dentro del canvas */}
        <div className="absolute top-4 right-6 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs shadow-xl backdrop-blur-sm pointer-events-none flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-slate-200">Alta Gama (&gt; ${priceThreshold.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span className="text-slate-200">Estándar (&le; ${priceThreshold.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-amber-400 inline-block" />
            <span className="text-amber-300 font-semibold">Vector de Soporte (SV)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-sky-400 inline-block shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            <span className="text-sky-300">Hiperplano: w·x + b = 0</span>
          </div>
        </div>

        {/* Tooltip flotante al pasar el mouse por una vivienda */}
        {hoveredRecord && (
          <div className="absolute bottom-4 left-6 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs text-slate-200 max-w-xs pointer-events-none backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-400" />
                {hoveredRecord.city}, {hoveredRecord.state}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  hoveredRecord.label === 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}
              >
                {hoveredRecord.label === 1 ? 'Alta Gama' : 'Estándar'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-slate-300 mb-2">
              <div>
                <span className="text-slate-500 block">Precio:</span>
                <span className="font-semibold text-emerald-400">${hoveredRecord.price.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ingreso Medio:</span>
                <span>{hoveredRecord.median_income}k USD</span>
              </div>
              <div>
                <span className="text-slate-500 block">Metraje:</span>
                <span>{hoveredRecord.sqft.toLocaleString()} ft²</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ubicación:</span>
                <span>{hoveredRecord.ocean_proximity}/10</span>
              </div>
            </div>

            {isSV(hoveredRecord.id) ? (
              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>¡Es un Vector de Soporte activo! (Fija la frontera)</span>
              </div>
            ) : (
              <div className="pt-1.5 border-t border-slate-800 text-slate-400 text-[11px]">
                Punto interior: mover o eliminar esta casa <strong className="text-slate-200">no moverá el hiperplano</strong>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner interactivo si se clickea un punto de prueba */}
      {testPoint && (
        <div
          id="test-point-result-banner"
          className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
            <div>
              <span className="text-slate-300 font-semibold">Casa de Prueba Simulada: </span>
              <span className="text-slate-100">
                {metaX.name} = {Math.round(testPoint.xVal)} {metaX.unit} | {metaY.name} = {Math.round(testPoint.yVal)} {metaY.unit}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Puntaje f(x):</span>
              <span className="font-mono font-bold text-slate-100">{testPoint.score.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Predicción SVM:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  testPoint.label === 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                }`}
              >
                {testPoint.label === 1 ? 'Alta Gama (+1)' : 'Estándar (-1)'}
              </span>
            </div>
            <button
              onClick={() => setTestPoint(null)}
              className="text-slate-400 hover:text-slate-200 underline text-[11px]"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Indicador pedagógico inferior: El valor del margen 2 / ||w|| */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 flex items-center justify-between mb-1">
            <span>Ancho del Margen (2 / ||w||)</span>
            <span className="font-mono text-amber-400 font-bold">
              {model.marginWidth.toFixed(4)}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Distancia entre las dos calles de separación. Un margen más ancho proporciona mayor robustez para nuevas casas.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 flex items-center justify-between mb-1">
            <span>Vectores de Soporte Activos</span>
            <span className="font-mono text-indigo-400 font-bold">
              {model.totalSupportVectors} de {records.length}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Solo el{' '}
            <strong className="text-slate-200">
              {((model.totalSupportVectors / records.length) * 100).toFixed(0)}%
            </strong>{' '}
            de las viviendas definen el límite de precio; el resto no tiene impacto directo.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 flex items-center justify-between mb-1">
            <span>Precisión de Clasificación</span>
            <span className="font-mono text-emerald-400 font-bold">
              {(model.accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Porcentaje de viviendas clasificadas correctamente en base al umbral de ${priceThreshold.toLocaleString()}.
          </p>
        </div>
      </div>
    </div>
  );
};
