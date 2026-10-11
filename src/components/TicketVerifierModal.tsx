import React, { useState } from 'react';
import { Search, X, Ticket, Calendar, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCLP, formatDate } from '../utils/format';

interface TicketVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketVerifierModal: React.FC<TicketVerifierModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/buyer/numbers?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Consultar Mis Números
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-300">
            Ingresa tu RUT o tu correo electrónico registrado al momento de la compra para verificar
            todos los números que tienes asignados:
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="RUT (ej: 16.782.901-4) o correo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {searched && (
            <div className="space-y-3 pt-2">
              {results.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
                  <AlertCircle className="mx-auto h-6 w-6 text-slate-500 mb-2" />
                  No se encontraron números asociados a "<span className="text-white">{query}</span>".
                  Asegúrate de haber ingresado el mismo RUT o correo usado en la compra.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Se encontraron {results.length} {results.length === 1 ? 'número' : 'números'} registrados:
                  </div>

                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                    <div className="text-xs text-slate-300 mb-2">
                      Titular: <span className="font-bold text-white">{results[0]?.buyer?.nombre}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 my-3">
                      {results.map((r) => (
                        <span
                          key={r.numero}
                          className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-3 py-1 font-mono text-base font-black text-slate-950 shadow-sm"
                        >
                          #{r.numero}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 border-t border-amber-500/20 pt-2 flex justify-between">
                      <span>Estado: PAGADO Y ACTIVO</span>
                      <span>{results[0]?.paid_at ? formatDate(results[0].paid_at) : ''}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
