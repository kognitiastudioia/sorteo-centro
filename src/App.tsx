import React, { useState } from 'react';
import { useRaffle } from './hooks/useRaffle';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ColorLegend, type FilterType } from './components/ColorLegend';
import { NumbersGrid } from './components/NumbersGrid';
import { FloatingCartBar } from './components/FloatingCartBar';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { PurchaseSuccessModal } from './components/PurchaseSuccessModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { TicketVerifierModal } from './components/TicketVerifierModal';
import { PrizeDetailsModal } from './components/PrizeDetailsModal';
import { RulesModal } from './components/RulesModal';
import { ShieldCheck, Ticket, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { formatCLP } from './utils/format';

export default function App() {
  const {
    raffle,
    numbers,
    stats,
    selectedNumbers,
    reservationSecondsLeft,
    loading,
    error,
    isConnected,
    recentPurchasedOrder,
    sessionId,
    toggleNumberSelection,
    pickRandomNumbers,
    clearSelection,
    reserveSelectedNumbers,
    submitCheckout,
    setRecentPurchasedOrder,
    refreshData,
  } = useRaffle();

  // Navigation & Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Grid Filters
  const [currentFilter, setCurrentFilter] = useState<FilterType>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const unitPrice = raffle?.precio_numero || 2000;
  const cartTotal = selectedNumbers.length * unitPrice;

  // Proceed to Checkout handler: attempts to reserve lock before opening checkout
  const handleProceedToCheckout = async () => {
    setIsCartOpen(false);
    const res = await reserveSelectedNumbers();
    if (!res.success) {
      alert(res.error || 'No se pudieron reservar los números.');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (params: {
    buyer: {
      nombre: string;
      documento: string;
      telefono: string;
      email: string;
    };
    paymentProvider: 'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia';
  }) => {
    const result = await submitCheckout(params);
    if (result.success) {
      setIsCheckoutOpen(false);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <Header
        cartCount={selectedNumbers.length}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenVerifier={() => setIsVerifierOpen(true)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        isConnected={isConnected}
      />

      <main className="flex-1 pb-28 sm:pb-32">
        {/* Hero Section with Prize Details & Live Countdown */}
        <HeroSection
          raffle={raffle}
          stats={stats}
          onOpenPrizeDetail={() => setIsPrizeModalOpen(true)}
          onOpenRules={() => setIsRulesModalOpen(true)}
        />

        {/* Numbers Selection Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Selecciona tus números de la suerte
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Cuadrícula Oficial del 001 al 500
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Toca cualquier número disponible para agregarlo a tu carrito. Los números seleccionados
                se reservarán por 10 minutos para asegurar tu compra.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Precio unitario:</span>
              <span className="font-mono text-xl font-black text-amber-400 tabular-nums">
                {formatCLP(unitPrice)}
              </span>
            </div>
          </div>

          {/* Color Legend, Filter Tabs & Lucky Pick */}
          <ColorLegend
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onPickRandom={pickRandomNumbers}
            counts={{
              total: stats.total,
              disponibles: stats.disponibles,
              reservados: stats.reservados,
              pagados: stats.pagados,
              seleccionados: selectedNumbers.length,
            }}
          />

          {/* Responsive Numbers Grid */}
          <NumbersGrid
            numbers={numbers}
            selectedNumbers={selectedNumbers}
            onToggleNumber={toggleNumberSelection}
            filter={currentFilter}
            searchQuery={searchQuery}
            sessionId={sessionId}
          />
        </section>

        {/* Trust & Guarantee Banner */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sorteo 100% Notarial</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Bases legalizadas y sorteo transmitido en vivo ante notario público de Santiago.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Actualización en Vivo</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tecnología en tiempo real. Nadie podrá reservar ni comprar tus números al mismo tiempo.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Ticket className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Comprobante Inmediato</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Descarga tu ticket digital oficial y compártelo al instante por WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Sticky Bar for Mobile & Desktop */}
      <FloatingCartBar
        selectedCount={selectedNumbers.length}
        selectedNumbers={selectedNumbers}
        total={cartTotal}
        reservationSecondsLeft={reservationSecondsLeft}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-300">GRAN SORTEO 2026</span> · Sorteo Oficial de 500 Números
            <p className="mt-0.5 text-slate-500">
              Todos los derechos reservados. Plataforma auditada y autorizada.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Bases Legales
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsVerifierOpen(true)}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Consultar Ticket
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Acceso Administrador
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        selectedNumbers={selectedNumbers}
        unitPrice={unitPrice}
        reservationSecondsLeft={reservationSecondsLeft}
        onRemoveNumber={toggleNumberSelection}
        onClearCart={clearSelection}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedNumbers={selectedNumbers}
        unitPrice={unitPrice}
        flowLink={raffle?.flowLink || 'https://www.flow.cl/'}
        flowApiKey={raffle?.flowApiKey || '27FECD5E-E313-40F9-8AC1-73BB832L658B'}
        flowSecretKey={raffle?.flowSecretKey || 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb'}
        machLink={raffle?.machLink || 'https://app.soymach.com/rF2V/10dplbjf'}
        reservationSecondsLeft={reservationSecondsLeft}
        onSubmitCheckout={handleCheckoutSubmit}
      />

      {/* Purchase Success Confirmation Modal */}
      {recentPurchasedOrder && (
        <PurchaseSuccessModal
          order={recentPurchasedOrder.order}
          payment={recentPurchasedOrder.payment}
          numbers={recentPurchasedOrder.numbers}
          onClose={() => setRecentPurchasedOrder(null)}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        stats={stats}
        raffle={raffle}
        onDataChanged={refreshData}
      />

      {/* Ticket Verifier Modal */}
      <TicketVerifierModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
      />

      {/* Prize Details Modal */}
      <PrizeDetailsModal
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        raffle={raffle}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        raffle={raffle}
      />
    </div>
  );
}
