import React from 'react';
import { ShoppingBag, ArrowRight, Clock } from 'lucide-react';
import { formatCLP, formatTimeLeft } from '../utils/format';

interface FloatingCartBarProps {
  selectedCount: number;
  selectedNumbers: string[];
  total: number;
  reservationSecondsLeft: number | null;
  onOpenCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  selectedCount,
  selectedNumbers,
  total,
  reservationSecondsLeft,
  onOpenCart,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none">
      <div className="mx-auto max-w-4xl pointer-events-auto rounded-2xl border border-amber-500/40 bg-slate-950/95 p-3 sm:p-4 shadow-2xl shadow-amber-500/20 backdrop-blur-xl ring-1 ring-white/10 transition-all animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between gap-3">
          {/* Numbers preview & Count */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/30">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {selectedCount} {selectedCount === 1 ? 'número' : 'números'}
                </span>
                {reservationSecondsLeft !== null && reservationSecondsLeft > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[11px] font-mono text-amber-300 border border-amber-500/30">
                    <Clock className="h-3 w-3 text-amber-400" />
                    {formatTimeLeft(reservationSecondsLeft)}
                  </span>
                )}
              </div>

              {/* Numbers chip preview */}
              <div className="flex items-center gap-1 overflow-hidden text-xs text-slate-400 mt-0.5">
                <span className="truncate font-mono font-medium text-amber-300">
                  {selectedNumbers.slice(0, 5).join(', ')}
                  {selectedNumbers.length > 5 && ` +${selectedNumbers.length - 5} más`}
                </span>
              </div>
            </div>
          </div>

          {/* Total & Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-[11px] text-slate-400">Total a pagar</span>
              <span className="font-mono text-base font-extrabold text-amber-400 tabular-nums">
                {formatCLP(total)}
              </span>
            </div>

            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Continuar</span>
              <span className="sm:hidden font-mono text-xs">({formatCLP(total)})</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
