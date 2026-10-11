import React from 'react';
import {
  X,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { formatCLP, formatTimeLeft } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  unitPrice: number;
  reservationSecondsLeft: number | null;
  onRemoveNumber: (numero: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  selectedNumbers,
  unitPrice,
  reservationSecondsLeft,
  onRemoveNumber,
  onClearCart,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const total = selectedNumbers.length * unitPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Carrito de Compra</h2>
                <p className="text-xs text-slate-400">
                  {selectedNumbers.length}{' '}
                  {selectedNumbers.length === 1 ? 'número seleccionado' : 'números seleccionados'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Reservation Timer Notification */}
          <div className="bg-amber-950/40 border-b border-amber-500/20 px-5 py-3">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                {reservationSecondsLeft !== null && reservationSecondsLeft > 0 ? (
                  <div>
                    <span className="font-semibold text-amber-300">
                      Tus números están reservados durante{' '}
                      <span className="font-mono font-bold text-amber-200">
                        {formatTimeLeft(reservationSecondsLeft)} minutos.
                      </span>
                    </span>
                    <p className="text-amber-400/80 text-[11px] mt-0.5">
                      Están bloqueados temporalmente para que nadie más pueda comprarlos mientras
                      completes tu pago.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-amber-300">
                      Reserva temporal activa (10 minutos)
                    </span>
                    <p className="text-amber-400/80 text-[11px] mt-0.5">
                      Al presionar continuar, se reservarán exclusivamente bajo tu sesión.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content: Selected Numbers List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedNumbers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="text-sm">Tu carrito está vacío.</p>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ir a seleccionar números
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Números Seleccionados
                  </span>
                  <button
                    onClick={onClearCart}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Vaciar todo
                  </button>
                </div>

                {/* Grid of Chips */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {selectedNumbers.map((num) => (
                    <div
                      key={num}
                      className="group relative flex items-center justify-between rounded-xl bg-slate-950 border border-amber-500/30 px-2.5 py-2 text-center hover:border-amber-400 transition-colors"
                    >
                      <span className="font-mono text-sm font-bold text-amber-300 tabular-nums mx-auto">
                        {num}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveNumber(num)}
                        title={`Quitar número ${num}`}
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Summary Breakdown */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Cantidad de números:</span>
                    <span className="font-mono font-medium text-white tabular-nums">
                      {selectedNumbers.length} {selectedNumbers.length === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Precio por número:</span>
                    <span className="font-mono font-medium text-white tabular-nums">
                      {formatCLP(unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium text-white tabular-nums">
                      {formatCLP(total)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-white">Total a pagar:</span>
                    <span className="font-mono text-lg font-black text-amber-400 tabular-nums">
                      {formatCLP(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1 pt-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Pago 100% seguro con respaldo notarial y comprobante inmediato.</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {selectedNumbers.length > 0 && (
            <div className="border-t border-slate-800 p-5 bg-slate-950/80 space-y-2.5">
              <button
                onClick={onProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:via-sky-500 hover:to-indigo-500 py-3.5 px-4 font-bold text-sm text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-98 transition-all cursor-pointer group"
              >
                <span>Pagar con Flow ({formatCLP(total)})</span>
                <ArrowRight className="h-4 w-4 text-white/90 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Conexión oficial <strong className="text-sky-300 font-semibold">Flow API</strong> (Webpay, Tarjetas y MACH)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
