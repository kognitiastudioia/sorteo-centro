import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  Info,
  CheckCircle2,
  Lock,
  Hourglass,
  ExternalLink,
  Gift,
} from 'lucide-react';
import type { RaffleInfo, RaffleStats } from '../types';
import { formatCLP, formatDate } from '../utils/format';

interface HeroSectionProps {
  raffle: RaffleInfo | null;
  stats: RaffleStats;
  onOpenPrizeDetail: () => void;
  onOpenRules: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  raffle,
  stats,
  onOpenPrizeDetail,
  onOpenRules,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 8,
    minutes: 42,
    seconds: 15,
  });

  useEffect(() => {
    if (!raffle?.fecha_sorteo) return;

    const target = new Date(raffle.fecha_sorteo).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [raffle?.fecha_sorteo]);

  const percentageSold = Math.min(
    100,
    Math.round((stats.pagados / (stats.total || 500)) * 100)
  );

  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10 lg:py-16">
      {/* Background glow effects */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Winner Banner if Drawn */}
        {raffle?.sorteoGanador && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-yellow-900/60 to-amber-950/80 p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
                  <Trophy className="h-8 w-8 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                    ¡Tenemos Ganador Oficial!
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Número Ganador: <span className="font-mono text-amber-300">#{raffle.sorteoGanador.numero}</span>
                  </h3>
                  <p className="text-sm text-slate-300">
                    Afortunado(a): <span className="font-semibold text-white">{raffle.sorteoGanador.buyerNombre}</span> (RUT {raffle.sorteoGanador.buyerDocumento})
                  </p>
                </div>
              </div>
              <div className="text-xs text-amber-300/80 font-mono bg-amber-950/60 px-4 py-2 rounded-xl border border-amber-500/20">
                Sorteado el {formatDate(raffle.sorteoGanador.fechaSorteo)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Raffle Presentation */}
          <div className="lg:col-span-7 space-y-6">
            {/* Clean Kicker */}
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Sorteo Notarial Oficial</span>
              <span aria-hidden="true">·</span>
              <span>500 Números Exclusivos (001 - 500)</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {raffle?.nombre || 'Gran Sorteo 2026'}
            </h1>

            {/* Featured Prize Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Premio Mayor Destacado
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {raffle?.premio || 'iPhone 16 Pro Max 256GB + AirPods Pro 2'}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                    {raffle?.premioDetalle ||
                      'Equipo nuevo sellado color Titanio Desierto, audífonos AirPods Pro 2 USB-C y $500.000 CLP en efectivo garantizado.'}
                  </p>
                </div>
                <button
                  onClick={onOpenPrizeDetail}
                  className="hidden sm:flex shrink-0 items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer pt-1"
                >
                  Ver detalles <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Price & Date Badges */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">Precio por número:</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                    {formatCLP(raffle?.precio_numero || 2000)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/50">
                  <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Fecha del Sorteo:</span>
                    <span className="font-semibold text-white">
                      {raffle?.fecha_sorteo ? formatDate(raffle.fecha_sorteo) : '25 de Octubre 2026'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Tiempo restante para el sorteo:</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center font-mono">
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 sm:p-3">
                  <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {timeLeft.days.toString().padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] sm:text-xs text-slate-400 uppercase mt-0.5">
                    Días
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 sm:p-3">
                  <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] sm:text-xs text-slate-400 uppercase mt-0.5">
                    Horas
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 sm:p-3">
                  <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] sm:text-xs text-slate-400 uppercase mt-0.5">
                    Min
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 sm:p-3">
                  <span className="text-xl sm:text-2xl font-bold text-amber-400 tabular-nums">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] sm:text-xs text-slate-400 uppercase mt-0.5">
                    Seg
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#numeros"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
              >
                Elegir Mis Números Ahora
                <ChevronDown className="h-4 w-4" />
              </a>
              <button
                onClick={onOpenRules}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <Info className="h-4 w-4 text-slate-400" />
                Ver Bases y Garantía Notarial
              </button>
            </div>
          </div>

          {/* Right Column: Hero Image & Live Progress Statistics */}
          <div className="lg:col-span-5 space-y-4">
            {/* Grand Prize Showcase Image Card */}
            <div
              onClick={onOpenPrizeDetail}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300 hover:border-amber-500/50 hover:shadow-amber-500/10"
            >
              <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-950">
                <img
                  src={raffle?.imagen || '/src/assets/images/raffle_hero_prize_1791477047971.jpg'}
                  alt="Premio Mayor Rifa iPhone 16 Pro Max y AirPods Pro 2"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Resilient fallback container if needed
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-semibold">
                    Edición Especial
                  </span>
                  <h3 className="text-base font-bold text-white drop-shadow-sm">
                    iPhone 16 Pro Max Titanio
                  </h3>
                </div>
                <span className="rounded-lg bg-amber-500/90 text-slate-950 px-2.5 py-1 text-xs font-bold shadow-md">
                  Ver Fotos
                </span>
              </div>
            </div>

            {/* Live Progress Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Progreso de Venta en Tiempo Real
                </span>
                <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                  {percentageSold}% Vendido
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 transition-all duration-700"
                  style={{ width: `${Math.max(4, percentageSold)}%` }}
                />
              </div>

              {/* Counters Grid - 4 Columns */}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-2.5">
                  <span className="block text-[11px] text-slate-400">Total</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {stats.total}
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-2.5">
                  <span className="block text-[11px] text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Disp.
                  </span>
                  <span className="text-lg font-bold text-emerald-300 font-mono tabular-nums">
                    {stats.disponibles}
                  </span>
                </div>

                <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 p-2.5">
                  <span className="block text-[11px] text-amber-400 flex items-center justify-center gap-1">
                    <Hourglass className="h-3 w-3" />
                    Res.
                  </span>
                  <span className="text-lg font-bold text-amber-300 font-mono tabular-nums">
                    {stats.reservados}
                  </span>
                </div>

                <div className="rounded-xl bg-rose-950/30 border border-rose-500/30 p-2.5">
                  <span className="block text-[11px] text-rose-400 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Pag.
                  </span>
                  <span className="text-lg font-bold text-rose-300 font-mono tabular-nums">
                    {stats.pagados}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configured Prizes Showcase Bar */}
        {raffle?.premios && raffle.premios.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                Premios a Sortear en esta Rifa ({raffle.premios.length})
              </span>
              <button
                onClick={onOpenPrizeDetail}
                className="text-xs text-slate-400 hover:text-amber-400 font-medium transition-colors cursor-pointer"
              >
                Ver todos los premios →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {raffle.premios.map((p) => (
                <div
                  key={p.id}
                  onClick={onOpenPrizeDetail}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 hover:border-amber-500/40 hover:bg-slate-900 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-amber-400">
                      {p.posicion === 1
                        ? '🥇 1° Lugar'
                        : p.posicion === 2
                        ? '🥈 2° Lugar'
                        : p.posicion === 3
                        ? '🥉 3° Lugar'
                        : `🏅 ${p.posicion}° Lugar`}
                    </span>
                    {p.sorteoGanador ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        Ganador: #{p.sorteoGanador.numero}
                      </span>
                    ) : p.valorEstimado ? (
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatCLP(p.valorEstimado)}
                      </span>
                    ) : null}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {p.nombre}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {p.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
