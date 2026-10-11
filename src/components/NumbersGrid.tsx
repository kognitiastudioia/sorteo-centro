import React, { useMemo } from 'react';
import { Lock, Clock, Check, AlertCircle } from 'lucide-react';
import type { RaffleNumber } from '../types';
import type { FilterType } from './ColorLegend';

interface NumbersGridProps {
  numbers: RaffleNumber[];
  selectedNumbers: string[];
  onToggleNumber: (numero: string) => void;
  filter: FilterType;
  searchQuery: string;
  sessionId: string;
}

export const NumbersGrid: React.FC<NumbersGridProps> = ({
  numbers,
  selectedNumbers,
  onToggleNumber,
  filter,
  searchQuery,
  sessionId,
}) => {
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);

  const filteredNumbers = useMemo(() => {
    return numbers.filter((item) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!item.numero.includes(query)) return false;
      }

      // 2. Status filter
      if (filter === 'todos') return true;
      if (filter === 'seleccionados') return selectedSet.has(item.numero);
      if (filter === 'disponible') {
        return item.estado === 'disponible' && !selectedSet.has(item.numero);
      }
      if (filter === 'reservado') return item.estado === 'reservado';
      if (filter === 'pagado') return item.estado === 'pagado';

      return true;
    });
  }, [numbers, filter, searchQuery, selectedSet]);

  return (
    <div id="numeros" className="scroll-mt-20">
      {/* Grid Status Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-xs text-slate-400">
          Mostrando <span className="font-mono font-bold text-white tabular-nums">{filteredNumbers.length}</span> de{' '}
          <span className="font-mono font-bold text-white tabular-nums">500</span> números
        </div>
        {selectedNumbers.length > 0 && (
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Tienes <span className="font-mono font-bold">{selectedNumbers.length}</span> en carrito
            </span>
          </div>
        )}
      </div>

      {filteredNumbers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <h3 className="text-base font-semibold text-white">No se encontraron números</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No hay números que coincidan con el filtro actual o la búsqueda ingresada.
          </p>
        </div>
      ) : (
        /* Responsive Grid:
           Mobile: 5-6 columns (grid-cols-5 sm:grid-cols-6)
           Tablet: 8-10 columns (md:grid-cols-8 lg:grid-cols-10)
           Desktop: 12-15 columns (xl:grid-cols-12 2xl:grid-cols-15)
        */
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-15 gap-1.5 sm:gap-2">
          {filteredNumbers.map((item) => {
            const isSelected = selectedSet.has(item.numero);
            const isPaid = item.estado === 'pagado';
            const isReservedByOther =
              item.estado === 'reservado' && item.reserved_by_session !== sessionId;
            const isReservedByMe =
              item.estado === 'reservado' && item.reserved_by_session === sessionId;

            // Compute styling according to state
            let containerStyle = '';
            let label = '';
            let icon = null;

            if (isSelected) {
              // 🟡 Seleccionado
              containerStyle =
                'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black border-2 border-amber-200 shadow-md shadow-amber-500/30 scale-105 z-10';
              label = 'Seleccionado en tu carrito';
              icon = <Check className="h-3 w-3 text-slate-950 stroke-[3]" />;
            } else if (isPaid) {
              // 🔴 Pagado
              containerStyle =
                'bg-rose-950/30 border border-rose-900/60 text-rose-400/70 cursor-not-allowed opacity-60';
              label = 'Pagado - Vendido';
              icon = <Lock className="h-2.5 w-2.5 text-rose-500" />;
            } else if (isReservedByOther) {
              // 🟠 Reservado por otro
              containerStyle =
                'bg-orange-950/30 border border-orange-900/60 text-orange-400/80 cursor-not-allowed opacity-75';
              label = 'Reservado temporalmente';
              icon = <Clock className="h-2.5 w-2.5 text-orange-400" />;
            } else if (isReservedByMe) {
              // 🟡 En carrito/reservado por mi sesión
              containerStyle =
                'bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-bold';
              label = 'Reservado por ti';
              icon = <Check className="h-3 w-3 text-amber-400" />;
            } else {
              // 🟢 Disponible
              containerStyle =
                'bg-slate-900/90 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/40 hover:scale-105 active:scale-95 cursor-pointer shadow-sm';
              label = 'Disponible para elegir';
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleNumber(item.numero)}
                disabled={isPaid || isReservedByOther}
                title={`Número ${item.numero} · ${label}`}
                aria-label={`Número ${item.numero}, ${label}`}
                className={`relative flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 min-h-[46px] sm:min-h-[50px] transition-all duration-150 select-none ${containerStyle}`}
              >
                {/* Number text with tabular-nums */}
                <span className="font-mono text-xs sm:text-sm tracking-tight font-bold tabular-nums leading-none">
                  {item.numero}
                </span>

                {/* Status Indicator Icon */}
                <div className="mt-0.5 flex h-3 items-center justify-center">
                  {icon ? (
                    icon
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
