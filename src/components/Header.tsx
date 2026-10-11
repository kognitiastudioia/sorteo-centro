import React from 'react';
import { ShoppingBag, ShieldCheck, Ticket, Search, Radio } from 'lucide-react';
import { formatCLP } from '../utils/format';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenVerifier: () => void;
  onOpenRules: () => void;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAdmin,
  onOpenVerifier,
  onOpenRules,
  isConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand title, one line */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                GRAN SORTEO <span className="text-amber-400 font-extrabold text-xs">2026</span>
              </span>
            </div>
          </a>

          {/* Real-time SSE indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              isConnected
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                : 'border-amber-500/30 bg-amber-950/40 text-amber-400'
            }`}
            title={isConnected ? 'Conectado al servidor en tiempo real' : 'Reconectando al servidor...'}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px]">
              {isConnected ? 'EN VIVO' : 'SINCRONIZANDO'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#numeros" className="hover:text-amber-400 transition-colors">
            Cuadrícula de Números
          </a>
          <a href="#premio" className="hover:text-amber-400 transition-colors">
            Premios
          </a>
          <button
            onClick={onOpenRules}
            className="hover:text-amber-400 transition-colors text-left cursor-pointer"
          >
            Bases Legales
          </button>
          <button
            onClick={onOpenVerifier}
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors text-left cursor-pointer text-slate-300"
          >
            <Search className="h-4 w-4 text-amber-400" />
            Consultar Mis Números
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenVerifier}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Consultar Mis Números"
            aria-label="Consultar Mis Números"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            Panel Admin
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md ${
              cartCount > 0
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            aria-label="Ver carrito de compras"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden xs:inline">Carrito</span>
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold font-mono tabular-nums ${
                cartCount > 0 ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {cartCount}
            </span>
            {cartCount > 0 && (
              <span className="hidden sm:inline font-mono font-bold text-[12px] border-l border-slate-950/20 pl-2 ml-0.5">
                {formatCLP(cartTotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
