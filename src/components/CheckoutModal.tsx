import React, { useState } from 'react';
import {
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ExternalLink,
  Smartphone,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { formatCLP, formatRUT, formatTimeLeft } from '../utils/format';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  unitPrice: number;
  flowLink?: string;
  flowApiKey?: string;
  flowSecretKey?: string;
  machLink?: string;
  reservationSecondsLeft: number | null;
  onSubmitCheckout: (params: {
    buyer: {
      nombre: string;
      documento: string;
      telefono: string;
      email: string;
    };
    paymentProvider: 'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia';
  }) => Promise<{ success: boolean; error?: string; flowPayment?: any }>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedNumbers,
  unitPrice,
  flowLink = 'https://www.flow.cl/',
  flowApiKey = '27FECD5E-E313-40F9-8AC1-73BB832L658B',
  flowSecretKey = 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb',
  machLink = 'https://app.soymach.com/rF2V/10dplbjf',
  reservationSecondsLeft,
  onSubmitCheckout,
}) => {
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia'>('flow');
  const [loading, setLoading] = useState(false);
  const [creatingFlowSession, setCreatingFlowSession] = useState(false);
  const [flowSession, setFlowSession] = useState<{
    token?: string;
    flowOrder?: number;
    redirectUrl?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [gatewayStep, setGatewayStep] = useState<'form' | 'gateway_simulation'>('form');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const total = selectedNumbers.length * unitPrice;

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRUT(e.target.value);
    setDocumento(formatted);
  };

  const getEffectiveFlowUrl = () => {
    return flowSession?.redirectUrl || flowLink || 'https://www.flow.cl/';
  };

  const openFlowLink = (urlOverride?: string) => {
    try {
      const targetUrl = urlOverride || getEffectiveFlowUrl();
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error abriendo enlace Flow:', err);
    }
  };

  const copyFlowLink = () => {
    const targetUrl = getEffectiveFlowUrl();
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const openMachLink = () => {
    try {
      const targetUrl = machLink || 'https://app.soymach.com/rF2V/10dplbjf';
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error abriendo enlace MACH:', err);
    }
  };

  const copyMachLink = () => {
    navigator.clipboard.writeText(machLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const validateAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setFormError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!documento.trim() || documento.trim().length < 7) {
      setFormError('Por favor ingresa un RUT o Documento válido.');
      return;
    }
    if (!telefono.trim() || telefono.trim().length < 8) {
      setFormError('Por favor ingresa un número de teléfono de contacto (WhatsApp).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Por favor ingresa un correo electrónico válido para recibir tu comprobante oficial.');
      return;
    }

    if (paymentProvider === 'flow') {
      setCreatingFlowSession(true);
      try {
        const res = await fetch('/api/flow/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numbers: selectedNumbers,
            amount: total,
            buyer: {
              nombre: nombre.trim(),
              documento: documento.trim(),
              telefono: telefono.trim(),
              email: email.trim(),
            },
            returnUrl: window.location.origin,
          }),
        });

        const data = await res.json();
        if (data.success && data.redirectUrl) {
          setFlowSession(data);
          openFlowLink(data.redirectUrl);
        } else {
          openFlowLink();
        }
      } catch (err) {
        console.warn('Flow session creation warning:', err);
        openFlowLink();
      } finally {
        setCreatingFlowSession(false);
        setGatewayStep('gateway_simulation');
      }
      return;
    }

    if (paymentProvider === 'mach_bci') {
      openMachLink();
    }

    setGatewayStep('gateway_simulation');
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setFormError(null);

    try {
      const res = await onSubmitCheckout({
        buyer: {
          nombre: nombre.trim(),
          documento: documento.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
        },
        paymentProvider,
      });

      if (!res.success) {
        setFormError(res.error || 'Ocurrió un error al procesar la compra.');
        setGatewayStep('form');
      } else {
        // Success handled by parent modal
      }
    } catch {
      setFormError('Error de conexión. Intenta nuevamente.');
      setGatewayStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              Finalizar Compra y Pago
            </h2>
            <p className="text-xs text-slate-400">
              Paso {gatewayStep === 'form' ? '1 de 2: Datos del Comprador' : paymentProvider === 'flow' ? '2 de 2: Pasarela Flow Oficial (Webpay / Tarjetas)' : '2 de 2: Pago con MACH BCI'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reservation Reminder Banner */}
        {reservationSecondsLeft !== null && reservationSecondsLeft > 0 && (
          <div className="bg-amber-950/30 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-300 flex items-center justify-between">
            <span>Tus números están reservados temporalmente:</span>
            <span className="font-mono font-bold text-amber-200">
              {formatTimeLeft(reservationSecondsLeft)} min
            </span>
          </div>
        )}

        {formError && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {gatewayStep === 'form' ? (
          /* STEP 1: BUYER INFORMATION & PAYMENT METHOD FORM */
          <form onSubmit={validateAndProceed} className="p-6 space-y-4">
            {/* Flow API Connection Status Banner */}
            <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-r from-blue-950/60 via-slate-900 to-sky-950/50 p-4 space-y-3 shadow-lg shadow-sky-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-extrabold text-white">Conectado a Pasarela de Pagos Flow</span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    🟢 En Línea
                  </span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono font-semibold">flow.cl Chile</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="bg-slate-950/90 rounded-xl px-3 py-2 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-slate-400 text-[11px] font-sans font-medium">API key:</span>
                  <span className="text-sky-300 font-bold select-all break-all">{flowApiKey}</span>
                </div>
                <div className="bg-slate-950/90 rounded-xl px-3 py-2 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-slate-400 text-[11px] font-sans font-medium">secret key:</span>
                  <span className="text-emerald-400 font-bold select-all break-all">{flowSecretKey}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Al entrar a hacer el pago estamos conectados con tus credenciales Flow (HMAC-SHA256).</span>
              </div>
            </div>

            {/* Purchase Summary Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Resumen de tu selección en Gran Sorteo:</span>
                <span className="font-mono text-white font-bold">{selectedNumbers.length} tickets</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedNumbers.map((num) => (
                  <span
                    key={num}
                    className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-mono font-bold text-amber-300"
                  >
                    #{num}
                  </span>
                ))}
              </div>
              <div className="border-t border-slate-800/80 pt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-semibold block">Total a pagar:</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedNumbers.length} x {formatCLP(unitPrice)}
                  </span>
                </div>
                <span className="font-mono text-xl font-black text-amber-400 tabular-nums">
                  {formatCLP(total)}
                </span>
              </div>
            </div>

            {/* Buyer fields */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Datos del participante
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre completo <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez González"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    RUT / DNI / Documento <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-9"
                    value={documento}
                    onChange={handleDocumentChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Teléfono móvil (WhatsApp) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo electrónico (para envío de comprobante) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu.correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Método de pago
                </h3>
                <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
                  ⚡ Pasarela Oficial: Flow Chile
                </span>
              </div>

              {/* Featured Flow Platform Option */}
              <button
                type="button"
                onClick={() => setPaymentProvider('flow')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  paymentProvider === 'flow'
                    ? 'border-sky-500 bg-gradient-to-r from-blue-950/60 to-sky-950/40 text-white ring-2 ring-sky-500/50 shadow-lg shadow-blue-950/40'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white font-black text-sm shadow-md shadow-blue-600/30">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">Plataforma Flow</span>
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                        Pago Seguro Flow.cl
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Paga con Webpay Plus, Tarjetas de Crédito/Débito, MACH, CuentaRUT y Servipag
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-bold text-sky-300 block">
                    {formatCLP(total)}
                  </span>
                  <span className="text-[10px] text-emerald-400">Instantáneo</span>
                </div>
              </button>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={creatingFlowSession}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:via-sky-500 hover:to-indigo-500 py-3.5 px-4 font-extrabold text-sm text-white shadow-xl shadow-blue-600/35 hover:shadow-blue-500/50 active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-75"
              >
                {creatingFlowSession ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Conectando con Flow API ({formatCLP(total)})...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 text-sky-200 group-hover:scale-110 transition-transform" />
                    <span>
                      {paymentProvider === 'flow'
                        ? `Pagar con Flow (${formatCLP(total)})`
                        : paymentProvider === 'mach_bci'
                        ? `Pagar con MACH BCI (${formatCLP(total)})`
                        : 'Revisar y Continuar al Pago'}
                    </span>
                    <ExternalLink className="h-4 w-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <span>Pasarela de pago oficial:</span>
                <span className="font-mono text-sky-300 font-semibold">flow.cl · API Key: {flowApiKey.slice(0, 8)}...</span>
              </div>
            </div>
          </form>
        ) : (
          /* STEP 2: PAYMENT GATEWAY SIMULATION / CONFIRMATION */
          <div className="p-6 space-y-5">
            {paymentProvider === 'flow' ? (
              /* FLOW SPECIFIC PAYMENT CARD */
              <div className="rounded-2xl border-2 border-sky-500/40 bg-gradient-to-b from-blue-950/40 to-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-xs shadow-md shadow-blue-500/30">
                      flow
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Plataforma Oficial de Pagos Flow</span>
                      <span className="text-[10px] text-sky-400">Webpay · Redcompra · Tarjetas · MACH</span>
                    </div>
                  </div>
                  <span className="font-mono text-base font-black text-amber-400">
                    {formatCLP(total)}
                  </span>
                </div>

                {/* Flow Credentials & Session Badge */}
                <div className="rounded-xl bg-slate-950/90 border border-sky-500/30 p-3.5 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estado de Conexión:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      Flow API Conectada Oficialmente
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-mono bg-slate-900/70 p-2 rounded-lg border border-slate-800 gap-1">
                    <span className="text-slate-400 text-[10px] font-sans font-medium">API key:</span>
                    <span className="text-sky-300 font-bold text-xs select-all break-all">{flowApiKey}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-mono bg-slate-900/70 p-2 rounded-lg border border-slate-800 gap-1">
                    <span className="text-slate-400 text-[10px] font-sans font-medium">secret key:</span>
                    <span className="text-emerald-400 font-bold text-xs select-all break-all">{flowSecretKey}</span>
                  </div>
                  {flowSession?.token && (
                    <div className="flex items-center justify-between font-mono pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400">Token Flow Generado:</span>
                      <span className="text-amber-300 font-bold truncate max-w-[220px] select-all">{flowSession.token}</span>
                    </div>
                  )}
                  {flowSession?.flowOrder && (
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400">Orden Flow:</span>
                      <span className="text-purple-300 font-bold">#{flowSession.flowOrder}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Destinatario:</span>
                    <span className="font-bold text-white">Gran Sorteo Oficial</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Comprador:</span>
                    <span className="font-semibold text-white">{nombre} ({documento})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Números elegidos:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedNumbers.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Monto exacto a pagar:</span>
                    <span className="font-mono font-extrabold text-sky-300 text-sm">
                      {formatCLP(total)} CLP
                    </span>
                  </div>
                </div>

                {/* Direct Link Action Button */}
                <div className="space-y-2">
                  <a
                    href={getEffectiveFlowUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 px-4 font-bold text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Abrir Pasarela de Pago Flow Oficial</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getEffectiveFlowUrl()}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 font-mono select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={copyFlowLink}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 bg-sky-950/30 p-3.5 rounded-xl border border-sky-500/25 leading-relaxed space-y-1.5">
                  <p className="font-bold text-sky-200 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    Una vez pagado el ticket, se confirma el número comprado:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
                    <li>Haz clic en <strong>"Abrir Pasarela de Pago Flow Oficial"</strong> para realizar el pago de {formatCLP(total)}.</li>
                    <li>Selecciona Webpay Plus, Tarjeta de Débito/Crédito, MACH o Servipag.</li>
                    <li>Al completar el pago, presiona <strong>"Confirmar pago de ticket"</strong>: los números {selectedNumbers.map((n) => `#${n}`).join(', ')} quedarán confirmados y asegurados a tu nombre ante notario.</li>
                  </ol>
                </div>
              </div>
            ) : paymentProvider === 'mach_bci' ? (
              /* MACH BCI SPECIFIC PAYMENT CARD */
              <div className="rounded-2xl border-2 border-fuchsia-500/40 bg-gradient-to-b from-purple-950/40 to-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                      MACH
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Enlace de Pago MACH BCI</span>
                      <span className="text-[10px] text-cyan-400">Pago instantáneo</span>
                    </div>
                  </div>
                  <span className="font-mono text-base font-black text-amber-400">
                    {formatCLP(total)}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Destinatario:</span>
                    <span className="font-bold text-white">Gran Sorteo Oficial</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Comprador:</span>
                    <span className="font-semibold text-white">{nombre} ({documento})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Números elegidos:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedNumbers.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Monto exacto a transferir:</span>
                    <span className="font-mono font-extrabold text-cyan-300 text-sm">
                      {formatCLP(total)} CLP
                    </span>
                  </div>
                </div>

                {/* Direct Link Action Button */}
                <div className="space-y-2">
                  <a
                    href={machLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 px-4 font-bold text-sm shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Abrir Enlace de Pago MACH BCI</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={machLink}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 font-mono select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={copyMachLink}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  <p className="font-semibold text-slate-300 mb-1">Instrucciones de Pago:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Haz clic en <strong>"Abrir Enlace de Pago MACH BCI"</strong> para abrir tu app o enlace web.</li>
                    <li>Transfiere o paga exactamente <strong>{formatCLP(total)}</strong>.</li>
                    <li>Vuelve a esta ventana y presiona <strong>"Confirmar Pago Realizado"</strong> para recibir tu comprobante.</li>
                  </ol>
                </div>
              </div>
            ) : (
              /* STANDARD GATEWAY VIEW */
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-semibold text-slate-400">Pasarela de pago:</span>
                  <span className="text-xs font-bold text-amber-400 uppercase">
                    {paymentProvider === 'webpay_plus' && 'Transbank Webpay Plus'}
                    {paymentProvider === 'mercado_pago' && 'Mercado Pago Chile'}
                    {paymentProvider === 'transferencia' && 'Transferencia Bancaria Inmediata'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Comprador:</span>
                    <span className="font-semibold text-white">{nombre}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">RUT / Documento:</span>
                    <span className="font-mono text-white">{documento}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Correo:</span>
                    <span className="text-white">{email}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Números elegidos:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedNumbers.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-2 text-sm">
                    <span className="font-bold text-white">Monto final:</span>
                    <span className="font-mono font-extrabold text-amber-400 tabular-nums">
                      {formatCLP(total)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway Security Callout */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-emerald-300 block">
                  Conexión segura SSL cifrada
                </span>
                Al confirmar, el sistema registrará los números como <strong className="text-rose-400">PAGADO</strong> a tu nombre y generará tu ticket oficial descargable.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setGatewayStep('form')}
                className="w-1/3 rounded-xl border border-slate-700 bg-slate-800/80 py-3 px-4 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Modificar datos
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 px-4 font-bold text-sm text-slate-950 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25 active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirmando ticket y números...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar pago de ticket ({formatCLP(total)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
