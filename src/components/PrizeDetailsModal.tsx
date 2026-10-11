import React from 'react';
import { X, Sparkles, Check, ShieldCheck, Truck, Gift, Award, Trophy } from 'lucide-react';
import type { RaffleInfo } from '../types';
import { formatCLP, formatDate } from '../utils/format';

interface PrizeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: RaffleInfo | null;
}

export const PrizeDetailsModal: React.FC<PrizeDetailsModalProps> = ({
  isOpen,
  onClose,
  raffle,
}) => {
  if (!isOpen) return null;

  const prizes = raffle?.premios || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Premios Oficiales a Sortear
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Prize Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3]">
              <img
                src={raffle?.imagen || '/src/assets/images/raffle_hero_prize_1791477047971.jpg'}
                alt="iPhone 16 Pro Max Titanio"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3]">
              <img
                src={raffle?.imagenDetalle || '/src/assets/images/raffle_prize_detail_1791477059727.jpg'}
                alt="AirPods Pro 2da Generación"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Gran Rifa Oficial 2026
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {raffle?.premio || 'Apple iPhone 16 Pro Max 256GB + AirPods Pro 2'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {raffle?.premioDetalle ||
                'Todos los premios son totalmente nuevos con boleta de compra oficial, garantía y entrega asegurada en todo Chile.'}
            </p>
          </div>

          {/* List of all configured prizes */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-400" />
              Lista Completa de Premios a Sortear ({prizes.length})
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {prizes.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm border border-amber-500/30">
                      {p.posicion}°
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                        {p.posicion === 1 ? '1° Lugar · Premio Mayor' : `${p.posicion}° Lugar`}
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-white">{p.nombre}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{p.descripcion}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    {p.valorEstimado && (
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {formatCLP(p.valorEstimado)}
                      </span>
                    )}
                    {p.sorteoGanador ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 mt-1">
                        🏆 Boleto #{p.sorteoGanador.numero} ({p.sorteoGanador.buyerNombre})
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium mt-1">
                        Pendiente de sorteo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Garantía Oficial</span>
                <span className="text-slate-400 text-[11px]">Equipos 100% nuevos</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-amber-400" />
              <div>
                <span className="font-bold text-white block">Envío Todo Chile</span>
                <span className="text-slate-400 text-[11px]">100% asegurado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
