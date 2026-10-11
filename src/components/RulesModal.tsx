import React from 'react';
import { X, ShieldCheck, Scale, Award, FileText } from 'lucide-react';
import type { RaffleInfo } from '../types';
import { formatCLP } from '../utils/format';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: RaffleInfo | null;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, raffle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Bases Legales y Garantías
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">Transparencia Notarial Garantizada</h4>
              <p className="text-xs text-amber-300/90 mt-0.5">
                La presente rifa consta de exactamente 500 números únicos (del 001 al 500). El sorteo se realizará en vivo mediante transmisión pública ante Notario.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
                1. Participantes
              </h4>
              <p className="text-slate-400">
                Podrá participar cualquier persona natural mayor de 18 años con cédula de identidad vigente (RUT chileno o pasaporte/documento extranjero válido) residente en Chile.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
                2. Adquisición y Reserva de Números
              </h4>
              <p className="text-slate-400">
                Cada número tiene un valor de {formatCLP(raffle?.precio_numero || 2000)}. Al seleccionar números, el sistema aplica una reserva temporal de 10 minutos para proteger la compra. Si el pago no es confirmado en dicho plazo, los números vuelven automáticamente a estar disponibles para el público.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
                3. Métodos de Pago
              </h4>
              <p className="text-slate-400">
                Se aceptan pagos mediante Transbank Webpay Plus (Tarjetas de Débito, Redcompra y Crédito), Mercado Pago y Transferencia Electrónica directa verificada.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
                4. Fecha y Realización del Sorteo
              </h4>
              <p className="text-slate-400">
                El sorteo se llevará a cabo una vez completada la venta de los 500 números o al cumplirse la fecha límite estipulada ({raffle?.fecha_sorteo ? '25 de Octubre 2026' : 'fecha programada'}). Se transmitirá en directo por redes sociales y los resultados se publicarán de inmediato en esta plataforma.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
                5. Entrega del Premio
              </h4>
              <p className="text-slate-400">
                El ganador será contactado vía telefónica y correo electrónico dentro de las primeras 24 horas posteriores al sorteo. El premio puede ser retirado presencialmente en Santiago o despachado con seguro de transporte a cualquier región de Chile sin costo adicional.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              Entendido, volver a la rifa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
