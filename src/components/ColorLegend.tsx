import React from 'react';
import { Search, Sparkles, Filter, Check, Clock, Lock, CheckCircle2 } from 'lucide-react';
import type { NumberStatus } from '../types';

export type FilterType = 'todos' | 'disponible' | 'reservado' | 'pagado' | 'seleccionados';

interface ColorLegendProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPickRandom: (count: number) => void;
  counts: {
    total: number;
    disponibles: number;
    reservados: number;
    pagados: number;
    seleccionados: number;
  };
}

export const ColorLegend: React.FC<ColorLegendProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onPickRandom,
  counts,
}) => {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md">
      {/* 1. Official State Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Estados de los números:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 text-xs">
          {/* Disponible */}
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-md bg-emerald-500/20 border border-emerald-500 ring-2 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-slate-200 font-medium">🟢 Disponible</span>
            <span className="text-slate-500 text-[11px] hidden lg:inline">· Libre para elegir</span>
          </div>

          {/* Seleccionado */}
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-md bg-amber-400 border border-amber-300 ring-2 ring-amber-400/40">
              <Check className="h-2.5 w-2.5 text-slate-950 font-black" />
            </span>
            <span className="text-amber-300 font-semibold">🟡 Seleccionado</span>
            <span className="text-slate-500 text-[11px] hidden lg:inline">· En tu carrito</span>
          </div>

          {/* Reservado */}
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-md bg-orange-950/60 border border-orange-500/80">
              <Clock className="h-2.5 w-2.5 text-orange-400" />
            </span>
            <span className="text-orange-300 font-medium">🟠 Reservado</span>
            <span className="text-slate-500 text-[11px] hidden lg:inline">· Retenido (10 min)</span>
          </div>

          {/* Pagado */}
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-md bg-rose-950/80 border border-rose-500/80">
              <Lock className="h-2.5 w-2.5 text-rose-400" />
            </span>
            <span className="text-rose-300 font-medium">🔴 Pagado</span>
            <span className="text-slate-500 text-[11px] hidden lg:inline">· Ya vendido</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Tabs, Search & Lucky Pick */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onFilterChange('todos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentFilter === 'todos'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos <span className="font-mono text-[11px] ml-0.5">({counts.total})</span>
          </button>

          <button
            onClick={() => onFilterChange('disponible')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentFilter === 'disponible'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Disponibles <span className="font-mono text-[11px] ml-0.5">({counts.disponibles})</span>
          </button>

          <button
            onClick={() => onFilterChange('reservado')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentFilter === 'reservado'
                ? 'bg-orange-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reservados <span className="font-mono text-[11px] ml-0.5">({counts.reservados})</span>
          </button>

          <button
            onClick={() => onFilterChange('pagado')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentFilter === 'pagado'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pagados <span className="font-mono text-[11px] ml-0.5">({counts.pagados})</span>
          </button>

          {counts.seleccionados > 0 && (
            <button
              onClick={() => onFilterChange('seleccionados')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentFilter === 'seleccionados'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              En Carrito <span className="font-mono text-[11px] ml-0.5">({counts.seleccionados})</span>
            </button>
          )}
        </div>

        {/* Search input & Random pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar # (ej: 078)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Quick Random Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Azar:</span>
            <button
              onClick={() => onPickRandom(1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-[11px] font-semibold text-amber-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              title="Seleccionar 1 número disponible al azar"
            >
              <Sparkles className="h-3 w-3" />
              +1
            </button>
            <button
              onClick={() => onPickRandom(3)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-[11px] font-semibold text-amber-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              title="Seleccionar 3 números disponibles al azar"
            >
              <Sparkles className="h-3 w-3" />
              +3
            </button>
            <button
              onClick={() => onPickRandom(5)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-[11px] font-semibold text-amber-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              title="Seleccionar 5 números disponibles al azar"
            >
              <Sparkles className="h-3 w-3" />
              +5
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
