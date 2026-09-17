import React, { useState } from 'react';
import { HousingRecord, SVMModelResult } from '../types';
import { Table, Search, Sparkles, Filter, Home, CheckCircle2 } from 'lucide-react';

interface DatasetExplorerProps {
  records: HousingRecord[];
  model: SVMModelResult;
  priceThreshold: number;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  records,
  model,
  priceThreshold,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSVOnly, setFilterSVOnly] = useState(false);

  const svIds = new Set(model.supportVectors.map((sv) => sv.id));

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSV = filterSVOnly ? svIds.has(r.id) : true;
    return matchesSearch && matchesSV;
  });

  return (
    <div className="w-full flex flex-col gap-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Explorador del Dataset: Mercado Inmobiliario de EE.UU.
            </h3>
            <p className="text-xs text-slate-400">
              {records.length} viviendas registradas en diversas ciudades estadounidenses con atributos socioeconómicos y físicos.
            </p>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar ciudad o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setFilterSVOnly(!filterSVOnly)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              filterSVOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Solo Vectores de Soporte ({model.totalSupportVectors})
          </button>
        </div>
      </div>

      {/* Tabla con scroll */}
      <div className="max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-sm">
            <tr>
              <th className="p-3">Ubicación</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Clase Real</th>
              <th className="p-3">Ingreso Medio</th>
              <th className="p-3">Metraje</th>
              <th className="p-3">Costa / Demanda</th>
              <th className="p-3">Antigüedad</th>
              <th className="p-3 text-center">¿Vector de Soporte?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRecords.slice(0, 80).map((r) => {
              const isSV = svIds.has(r.id);
              const isHigh = r.label === 1;

              return (
                <tr
                  key={r.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isSV ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-slate-200 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    {r.city}, {r.state}
                  </td>
                  <td className="p-3 font-mono font-semibold text-emerald-400">
                    ${r.price.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        isHigh
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}
                    >
                      {isHigh ? 'Alta Gama (+1)' : 'Estándar (-1)'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{r.median_income}k USD</td>
                  <td className="p-3 font-mono">{r.sqft.toLocaleString()} ft²</td>
                  <td className="p-3 font-mono">{r.ocean_proximity}/10</td>
                  <td className="p-3 font-mono">{r.house_age} años</td>
                  <td className="p-3 text-center">
                    {isSV ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[10px]">
                        <Sparkles className="w-3 h-3" /> ¡Sí!
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
