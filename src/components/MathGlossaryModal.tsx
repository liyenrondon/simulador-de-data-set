import React from 'react';
import { X, BookMarked, Sparkles } from 'lucide-react';

interface MathGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MathGlossaryModal: React.FC<MathGlossaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const glossaryItems = [
    {
      symbol: 'w',
      name: 'Vector de Pesos (Vector Normal)',
      role: 'Determina la orientación o inclinación del hiperplano de decisión.',
      details:
        'Es ortogonal (perpendicular) al hiperplano separador. Cuanto mayor es el peso wᵢ de una variable, mayor es su poder discriminatorio en el precio.',
      formula: 'w = Σ (αᵢ · yᵢ · xᵢ)',
    },
    {
      symbol: 'b',
      name: 'Sesgo (Bias o Término Independiente)',
      role: 'Determina la posición o distancia del hiperplano respecto al origen de coordenadas.',
      details:
        'Ajusta la traslación de la frontera para que quede centrada de forma equidistante entre las viviendas de ambas clases.',
      formula: 'b = 1/|SV| · Σ (yₛ - w · xₛ)',
    },
    {
      symbol: 'αᵢ',
      name: 'Multiplicadores de Lagrange',
      role: 'Miden la importancia o "presión" de cada vivienda sobre la frontera de decisión.',
      details:
        'Si αᵢ = 0, la vivienda está lejos del margen y no influye. Si 0 < αᵢ < C, la casa es un Vector de Soporte puro ubicado exactamente sobre la línea de margen. Si αᵢ = C, la casa está dentro del margen o mal clasificada.',
      formula: '0 ≤ αᵢ ≤ C',
    },
    {
      symbol: 'M',
      name: 'Ancho del Margen (Margin Width)',
      role: 'La distancia total de la "calle" que separa ambas clases.',
      details:
        'Maximizar el margen M equivale matemáticamente a minimizar ||w||² / 2. Un margen amplio garantiza que nuevas casas no caigan por error del lado equivocado.',
      formula: 'M = 2 / ||w||',
    },
    {
      symbol: 'ξᵢ',
      name: 'Variables de Holgura (Slack Variables)',
      role: 'Miden cuánto viola una vivienda el margen ideal.',
      details:
        'Permiten la existencia del margen blando (Soft Margin). Si una casa está en el lado correcto fuera del margen, ξᵢ = 0. Si se mete dentro del margen o cruza la frontera, ξᵢ > 0.',
      formula: 'yᵢ(w · xᵢ + b) ≥ 1 - ξᵢ,  con ξᵢ ≥ 0',
    },
    {
      symbol: 'C',
      name: 'Parámetro de Regularización',
      role: 'Equilibra el tamaño del margen frente a la cantidad de errores permitidos.',
      details:
        'C alto = Margen Duro (pocos o ningún error, pero riesgo de sobreajuste). C bajo = Margen Blando (margen amplio, tolera ruido e imperfecciones en los precios de las casas).',
      formula: 'Minimizar  1/2 ||w||² + C · Σ ξᵢ',
    },
    {
      symbol: 'K(x, z)',
      name: 'Función Kernel (Truco del Núcleo)',
      role: 'Calcula el producto interno en un espacio de mayor dimensión sin transformar los puntos explícitamente.',
      details:
        'Permite separar distribuciones circulares o curvas complejas de viviendas con un hiperplano lineal en el espacio transformado.',
      formula: 'K(x, z) = exp(-γ ||x - z||²)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Glosario Matemático y Componentes de las SVM
              </h2>
              <p className="text-xs text-slate-400">
                Guía de referencia rápida de todas las variables, fórmulas y conceptos clave.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de elementos del glosario */}
        <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-800/80">
          {glossaryItems.map((item, idx) => (
            <div key={idx} className="pt-3.5 first:pt-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-300 font-mono font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                    {item.symbol}
                  </span>
                  <span className="font-bold text-sm text-slate-200">{item.name}</span>
                </div>
                <code className="text-xs font-mono text-sky-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                  {item.formula}
                </code>
              </div>

              <p className="text-xs font-semibold text-slate-300">{item.role}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{item.details}</p>
            </div>
          ))}
        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Entendido, volver al simulador
          </button>
        </div>
      </div>
    </div>
  );
};
