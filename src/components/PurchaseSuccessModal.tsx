import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Share2,
  Download,
  X,
  Ticket,
  Copy,
  Check,
  Calendar,
  User,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Order, Payment } from '../types';
import { formatCLP, formatDate } from '../utils/format';

interface PurchaseSuccessModalProps {
  order: Order;
  payment: Payment;
  numbers: string[];
  onClose: () => void;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  order,
  payment,
  numbers,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire festive celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch (e) {
      console.error('Confetti error:', e);
    }
  }, []);

  const handleCopyNumbers = () => {
    const text = `🎉 ¡Mis números para el Gran Sorteo 2026 son: ${numbers.join(' - ')}! Orden: ${order.id}.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 ¡Ya tengo mis números para el Gran Sorteo 2026 (iPhone 16 Pro Max + AirPods Pro 2)!\n\n` +
      `🎟️ Mis números: ${numbers.join(' - ')}\n` +
      `👤 Participante: ${order.buyer_nombre}\n` +
      `📜 Orden: ${order.id}\n\n` +
      `¡Deseadme mucha suerte! 🍀`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadReceipt = () => {
    // Generate clean printable receipt
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante Oficial - Orden ${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #fff; color: #111; max-width: 600px; margin: auto; }
            .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 25px; }
            .title { font-size: 22px; font-weight: bold; margin: 0; color: #1e293b; }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 13px; margin-top: 8px; border: 1px solid #a7f3d0; }
            .numbers-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
            .numbers-title { font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
            .numbers-list { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 2px; font-family: monospace; }
            .details { margin: 25px 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { color: #64748b; }
            .val { font-weight: 600; color: #0f172a; }
            .total-row { display: flex; justify-content: space-between; padding: 14px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #0f172a; margin-top: 15px; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">COMPROBANTE OFICIAL - GRAN SORTEO</h1>
            <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Gran Sorteo 2026 · Sorteo Notarial Oficial</p>
            <div class="badge">ESTADO: PAGADO & CONFIRMADO</div>
          </div>

          <div class="numbers-box">
            <div class="numbers-title">Tus Números Adquiridos:</div>
            <div class="numbers-list">${numbers.join(' - ')}</div>
          </div>

          <div class="details">
            <div class="row"><span class="label">Comprador:</span><span class="val">${order.buyer_nombre}</span></div>
            <div class="row"><span class="label">RUT / Documento:</span><span class="val">${order.buyer_documento}</span></div>
            <div class="row"><span class="label">Teléfono:</span><span class="val">${order.buyer_telefono}</span></div>
            <div class="row"><span class="label">Correo Electrónico:</span><span class="val">${order.buyer_email}</span></div>
            <div class="row"><span class="label">Número de Orden:</span><span class="val">${order.id}</span></div>
            <div class="row"><span class="label">Código de Transacción:</span><span class="val">${order.transaction_id}</span></div>
            <div class="row"><span class="label">Método de Pago:</span><span class="val">${order.payment_provider.toUpperCase()}</span></div>
            <div class="row"><span class="label">Fecha y Hora:</span><span class="val">${formatDate(order.created_at)}</span></div>
            <div class="total-row"><span>Total Pagado:</span><span>${formatCLP(order.total)}</span></div>
          </div>

          <div class="footer">
            <p>Guarda este comprobante. En caso de resultar ganador, se solicitará tu documento de identidad para la entrega del premio.</p>
            <p>Sorteo oficial transmitido en vivo ante Notario Público.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/40 bg-slate-900 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95">
        {/* Success Header */}
        <div className="bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-900 px-6 pt-8 pb-5 text-center relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-xl shadow-emerald-500/30 mb-3">
            <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            🎉 ¡Ticket Pagado y Confirmado!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Tu pago ha sido procesado exitosamente y {numbers.length === 1 ? 'tu número comprado ha sido confirmado' : 'tus números comprados han sido confirmados'} de forma oficial en el sorteo.
          </p>
        </div>

        {/* Golden Ticket Layout for Purchased Numbers */}
        <div className="p-6 space-y-6">
          <div className="rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 p-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-2">
              <span className="inline-block bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-md">
                PAGADO & CONFIRMADO
              </span>
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 flex items-center justify-center gap-1.5">
              <Ticket className="h-4 w-4" />
              <span>{numbers.length === 1 ? 'Número Oficial Comprado y Confirmado:' : 'Números Oficiales Comprados y Confirmados:'}</span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-widest my-2 select-all">
              {numbers.map((n) => `#${n}`).join('  ·  ')}
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Boleto certificado y registrado oficialmente a nombre de {order.buyer_nombre}.
            </p>
          </div>

          {/* Transaction Metadata List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Nombre del comprador:
              </span>
              <span className="font-semibold text-white">{order.buyer_nombre}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-slate-500" />
                Número de orden:
              </span>
              <span className="font-mono text-amber-300 font-bold">{order.id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Fecha de compra:
              </span>
              <span className="text-white">{formatDate(order.created_at)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total pagado:</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {formatCLP(order.total)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Método de pago:</span>
              <span className="font-semibold text-sky-300 text-xs">
                {order.payment_provider === 'flow'
                  ? '⚡ Pasarela Oficial Flow (Chile)'
                  : order.payment_provider === 'mach_bci'
                  ? '⚡ MACH BCI'
                  : order.payment_provider.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Estado de la compra:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                PAGADO & CONFIRMADO
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 py-3 px-4 text-xs font-bold text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>Descargar comprobante</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartir mis números</span>
            </button>
          </div>

          {/* Quick Copy to Clipboard */}
          <div className="text-center pt-1">
            <button
              onClick={handleCopyNumbers}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">¡Copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar texto con mis números</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
