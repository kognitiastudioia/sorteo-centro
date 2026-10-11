import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  Trophy,
  RefreshCw,
  Unlock,
  CheckCircle,
  RotateCcw,
  Users,
  DollarSign,
  Ticket,
  Lock,
  Hourglass,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Gift,
  Plus,
  Trash2,
  Edit3,
  Image,
  Award,
  Settings,
  ExternalLink,
  Smartphone,
  CreditCard,
  Save,
} from 'lucide-react';
import type { RaffleStats, RaffleNumber, Buyer, Order, RaffleInfo, RafflePrize } from '../types';
import { formatCLP, formatDate } from '../utils/format';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: RaffleStats;
  raffle: RaffleInfo | null;
  onDataChanged: () => void;
}

interface EnrichedNumber extends RaffleNumber {
  buyer?: Buyer | null;
  order?: Order | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  stats,
  raffle,
  onDataChanged,
}) => {
  const [adminNumbers, setAdminNumbers] = useState<EnrichedNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'numeros' | 'premios' | 'sorteo' | 'configuracion'>('numeros');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponible' | 'reservado' | 'pagado'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual payment modal state
  const [manualPayNumber, setManualPayNumber] = useState<string | null>(null);
  const [manualBuyerName, setManualBuyerName] = useState('');
  const [manualBuyerDoc, setManualBuyerDoc] = useState('');
  const [manualBuyerPhone, setManualBuyerPhone] = useState('');
  const [manualBuyerEmail, setManualBuyerEmail] = useState('');

  // Prize management state
  const [editingPrize, setEditingPrize] = useState<Partial<RafflePrize> | null>(null);
  const [savingPrize, setSavingPrize] = useState(false);

  // Raffle settings state
  const [settingsNombre, setSettingsNombre] = useState(raffle?.nombre || 'Gran Sorteo 2026');
  const [settingsPrecio, setSettingsPrecio] = useState(raffle?.precio_numero || 2000);
  const [settingsFlowLink, setSettingsFlowLink] = useState(raffle?.flowLink || 'https://www.flow.cl/');
  const [settingsFlowApiKey, setSettingsFlowApiKey] = useState(raffle?.flowApiKey || '27FECD5E-E313-40F9-8AC1-73BB832L658B');
  const [settingsFlowSecretKey, setSettingsFlowSecretKey] = useState(raffle?.flowSecretKey || 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb');
  const [flowTestLoading, setFlowTestLoading] = useState(false);
  const [flowTestStatus, setFlowTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [settingsMachLink, setSettingsMachLink] = useState(raffle?.machLink || 'https://app.soymach.com/rF2V/10dplbjf');
  const [settingsDescripcion, setSettingsDescripcion] = useState(raffle?.descripcion || '');
  const [savingSettings, setSavingSettings] = useState(false);

  // Live Draw state
  const [selectedPrizeForDraw, setSelectedPrizeForDraw] = useState<string>('prize-1');
  const [drawingInProgress, setDrawingInProgress] = useState(false);
  const [spinningNumber, setSpinningNumber] = useState<string>('---');
  const [drawResult, setDrawResult] = useState<{
    numero: string;
    buyerNombre: string;
    buyerDocumento: string;
    fechaSorteo: string;
    prizeNombre?: string;
  } | null>(raffle?.sorteoGanador ? { ...raffle.sorteoGanador, prizeNombre: raffle.premio } : null);

  useEffect(() => {
    if (raffle) {
      setSettingsNombre(raffle.nombre || 'Gran Sorteo 2026');
      setSettingsPrecio(raffle.precio_numero || 2000);
      setSettingsFlowLink(raffle.flowLink || 'https://www.flow.cl/');
      setSettingsFlowApiKey(raffle.flowApiKey || '27FECD5E-E313-40F9-8AC1-73BB832L658B');
      setSettingsFlowSecretKey(raffle.flowSecretKey || 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb');
      setSettingsMachLink(raffle.machLink || 'https://app.soymach.com/rF2V/10dplbjf');
      setSettingsDescripcion(raffle.descripcion || '');
    }
  }, [raffle]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data');
      if (!res.ok) throw new Error('Error al cargar datos de admin');
      const data = await res.json();
      setAdminNumbers(data.numbers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAction = async (numero: string, action: 'liberar' | 'marcar_pagado' | 'cancelar_venta', buyerInfo?: any) => {
    try {
      setActionLoading(numero);
      const res = await fetch(`/api/admin/numbers/${numero}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, buyerInfo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error en acción');
      showToast(data.message);
      await fetchAdminData();
      onDataChanged();
      setManualPayNumber(null);
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar acción');
    } finally {
      setActionLoading(null);
    }
  };

  // Save or Edit Prize
  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrize?.nombre || !editingPrize?.descripcion) {
      alert('Por favor completa el nombre y descripción del premio.');
      return;
    }

    try {
      setSavingPrize(true);
      const res = await fetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPrize),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar premio');

      showToast(`Premio "${editingPrize.nombre}" guardado con éxito.`);
      setEditingPrize(null);
      onDataChanged();
    } catch (err: any) {
      alert(err.message || 'Error al guardar premio');
    } finally {
      setSavingPrize(false);
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este premio?')) return;
    try {
      const res = await fetch(`/api/admin/prizes/${prizeId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Premio eliminado exitosamente.');
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearPrizeWinner = async (prizeId: string) => {
    if (!confirm('¿Deseas reiniciar el ganador de este premio para volver a sortearlo?')) return;
    try {
      const res = await fetch(`/api/admin/prizes/${prizeId}/clear-winner`, { method: 'POST' });
      if (res.ok) {
        showToast('Ganador del premio restablecido.');
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Test connection to Flow API
  const handleTestFlowConnection = async () => {
    setFlowTestLoading(true);
    setFlowTestStatus(null);
    try {
      const res = await fetch('/api/flow/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settingsFlowApiKey,
          secretKey: settingsFlowSecretKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFlowTestStatus({
          success: true,
          message: '🟢 Conexión exitosa con API Flow. Credenciales verificadas.',
        });
        showToast('Conexión Flow API verificada exitosamente.');
      } else {
        setFlowTestStatus({
          success: false,
          message: `Error Flow: ${data.message || data.error || 'No se pudo conectar'}`,
        });
      }
    } catch (e: any) {
      setFlowTestStatus({
        success: false,
        message: `Error de red: ${e.message}`,
      });
    } finally {
      setFlowTestLoading(false);
    }
  };

  // Save Raffle General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/raffle-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: settingsNombre,
          precio_numero: Number(settingsPrecio),
          flowLink: settingsFlowLink,
          flowApiKey: settingsFlowApiKey,
          flowSecretKey: settingsFlowSecretKey,
          machLink: settingsMachLink,
          descripcion: settingsDescripcion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar configuración');
      showToast('Configuración de la rifa y credenciales Flow actualizados.');
      onDataChanged();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerDraw = async () => {
    const paidList = adminNumbers.filter((n) => n.estado === 'pagado');
    if (paidList.length === 0) {
      alert('No hay números pagados para realizar el sorteo.');
      return;
    }

    setDrawingInProgress(true);

    // Roulette spinning animation for 3.2 seconds
    const interval = setInterval(() => {
      const rand = paidList[Math.floor(Math.random() * paidList.length)];
      setSpinningNumber(rand.numero);
    }, 80);

    setTimeout(async () => {
      clearInterval(interval);
      try {
        const targetPrizeId = selectedPrizeForDraw;
        let res;
        if (targetPrizeId && targetPrizeId !== 'general') {
          res = await fetch('/api/admin/draw-prize-winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prizeId: targetPrizeId }),
          });
        } else {
          res = await fetch('/api/admin/draw-winner', { method: 'POST' });
        }

        const data = await res.json();
        if (data.success && data.winner) {
          setSpinningNumber(data.winner.numero);
          const currentPrizeObj = raffle?.premios?.find((p) => p.id === targetPrizeId);
          setDrawResult({
            ...data.winner,
            prizeNombre: currentPrizeObj?.nombre || raffle?.premio,
          });
          showToast(`¡Ganador sorteado con éxito: Número #${data.winner.numero}!`);
          onDataChanged();
        } else {
          alert(data.error || 'No se pudo realizar el sorteo');
        }
      } catch (e) {
        console.error(e);
        alert('Error al contactar con el sorteador');
      } finally {
        setDrawingInProgress(false);
      }
    }, 3200);
  };

  const handleExportCsv = () => {
    window.location.href = '/api/admin/export-csv';
  };

  const handleResetData = async () => {
    if (!confirm('¿Seguro que deseas restablecer la rifa a los valores iniciales de prueba?')) return;
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      showToast('Rifa restablecida a estado inicial');
      await fetchAdminData();
      onDataChanged();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered dataset
  const filteredList = useMemo(() => {
    return adminNumbers.filter((n) => {
      if (statusFilter !== 'todos' && n.estado !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = n.numero.includes(q);
        const nameMatch = n.buyer?.nombre.toLowerCase().includes(q) || false;
        const docMatch = n.buyer?.documento.toLowerCase().includes(q) || false;
        const emailMatch = n.buyer?.email.toLowerCase().includes(q) || false;
        const phoneMatch = n.buyer?.telefono.includes(q) || false;
        return numMatch || nameMatch || docMatch || emailMatch || phoneMatch;
      }
      return true;
    });
  }, [adminNumbers, statusFilter, searchQuery]);

  // Suggested prize presets for easy input
  const prizePresets = [
    {
      nombre: 'iPhone 16 Pro Max 256GB Titanio',
      descripcion: 'Equipo nuevo sellado color Titanio Desierto con garantía oficial Apple y entrega garantizada.',
      valorEstimado: 1450000,
      imagen: '/src/assets/images/raffle_hero_prize_1791477047971.jpg',
    },
    {
      nombre: 'PlayStation 5 Slim 1TB + 2 Mandos',
      descripcion: 'Consola Sony PS5 Slim edición digital con 2 controles DualSense y 1 año de garantía oficial.',
      valorEstimado: 550000,
      imagen: '/src/assets/images/raffle_prize_detail_1791477059727.jpg',
    },
    {
      nombre: '$300.000 CLP en Efectivo',
      descripcion: 'Monto transferible de inmediato a la cuenta bancaria o MACH del ganador el día del sorteo.',
      valorEstimado: 300000,
    },
    {
      nombre: 'Smart TV 65" 4K UHD Samsung / LG',
      descripcion: 'Televisor inteligente de última generación con panel Crystal UHD, HDR10+ y sonido cinematográfico.',
      valorEstimado: 480000,
    },
    {
      nombre: 'Parlante JBL Charge 5 Bluetooth',
      descripcion: 'Sonido potente JBL Original Pro con batería para 20 horas y certificación resistente al agua IP67.',
      valorEstimado: 140000,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex items-center justify-center">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-6xl max-h-[92vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Panel de Administración · {raffle?.nombre || 'Gran Sorteo'}
              </h2>
              <p className="text-xs text-slate-400">
                Gestión en vivo de los 500 números, participantes, premios y pasarela Flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              title="Refrescar datos"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] text-slate-400 block flex items-center gap-1">
                <Ticket className="h-3 w-3 text-slate-400" /> Total Números
              </span>
              <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-500">100% inventario</span>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <span className="text-[11px] text-emerald-400 block flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" /> Disponibles
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono tabular-nums mt-1 block">
                {stats.disponibles}
              </span>
              <span className="text-[10px] text-emerald-400/70">
                {Math.round((stats.disponibles / stats.total) * 100)}% restante
              </span>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
              <span className="text-[11px] text-amber-400 block flex items-center gap-1">
                <Hourglass className="h-3 w-3 text-amber-400" /> Reservados
              </span>
              <span className="text-2xl font-black text-amber-300 font-mono tabular-nums mt-1 block">
                {stats.reservados}
              </span>
              <span className="text-[10px] text-amber-400/70">En proceso de pago</span>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4">
              <span className="text-[11px] text-rose-400 block flex items-center gap-1">
                <Lock className="h-3 w-3 text-rose-400" /> Pagados
              </span>
              <span className="text-2xl font-black text-rose-300 font-mono tabular-nums mt-1 block">
                {stats.pagados}
              </span>
              <span className="text-[10px] text-rose-400/70">{stats.porcentajeVendido}% de la meta</span>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4">
              <span className="text-[11px] text-amber-300 block flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-amber-400" /> Recaudación
              </span>
              <span className="text-xl font-black text-amber-300 font-mono tabular-nums mt-1 block">
                {formatCLP(stats.totalRecaudado)}
              </span>
              <span className="text-[10px] text-amber-400/70">
                Precio: {formatCLP(raffle?.precio_numero || 2000)} c/u
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] text-slate-400 block flex items-center gap-1">
                <Users className="h-3 w-3 text-slate-400" /> Compradores
              </span>
              <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
                {stats.totalCompradores}
              </span>
              <span className="text-[10px] text-slate-500">Únicos registrados</span>
            </div>
          </div>

          {/* Navigation Tabs between Number Management, Prize Management, Winner Draw & Settings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('numeros')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'numeros'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gestión de Números & Ventas
              </button>

              <button
                onClick={() => setActiveTab('premios')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'premios'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gift className="h-3.5 w-3.5" />
                Premios a Sortear ({raffle?.premios?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('sorteo')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sorteo'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                Sorteo en Vivo
              </button>

              <button
                onClick={() => setActiveTab('configuracion')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'configuracion'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Configuración (MACH, Precio $2.000)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Descargar planilla CSV con todos los 500 números y compradores"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Exportar CSV
              </button>
              <button
                onClick={handleResetData}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-900/60 bg-rose-950/30 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition-colors cursor-pointer"
                title="Reiniciar a datos de prueba"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Demo
              </button>
            </div>
          </div>

          {activeTab === 'numeros' && (
            /* TAB 1: NUMBERS AND PARTICIPANTS TABLE */
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setStatusFilter('todos')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      statusFilter === 'todos' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Todos ({adminNumbers.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('disponible')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      statusFilter === 'disponible' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Disponibles
                  </button>
                  <button
                    onClick={() => setStatusFilter('reservado')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      statusFilter === 'reservado' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Reservados
                  </button>
                  <button
                    onClick={() => setStatusFilter('pagado')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      statusFilter === 'pagado' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Pagados
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por número, nombre, RUT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Número</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Comprador</th>
                      <th className="px-4 py-3 font-semibold">RUT / DNI</th>
                      <th className="px-4 py-3 font-semibold">Contacto</th>
                      <th className="px-4 py-3 font-semibold">Fecha Compra</th>
                      <th className="px-4 py-3 font-semibold">Monto</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredList.slice(0, 150).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-sm text-white">
                          #{item.numero}
                        </td>

                        <td className="px-4 py-3">
                          {item.estado === 'disponible' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                              🟢 Disponible
                            </span>
                          )}
                          {item.estado === 'reservado' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400 border border-orange-500/20">
                              🟠 Reservado
                            </span>
                          )}
                          {item.estado === 'pagado' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                              🔴 Pagado
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-medium text-white">
                          {item.buyer?.nombre || item.buyer_nombre || '-'}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-400">
                          {item.buyer?.documento || '-'}
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {item.buyer?.telefono ? (
                            <div>
                              <div>{item.buyer.telefono}</div>
                              <div className="text-[10px] text-slate-500">{item.buyer.email}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {item.paid_at ? formatDate(item.paid_at) : '-'}
                        </td>

                        <td className="px-4 py-3 font-mono font-semibold text-amber-400">
                          {item.estado === 'pagado' ? formatCLP(raffle?.precio_numero || 2000) : '-'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.estado === 'reservado' && (
                              <button
                                onClick={() => handleAction(item.numero, 'liberar')}
                                disabled={actionLoading === item.numero}
                                className="flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-950/40 px-2.5 py-1 text-[11px] font-semibold text-orange-300 hover:bg-orange-900/60 transition-colors cursor-pointer"
                                title="Liberar número reservado para que vuelva a disponible"
                              >
                                <Unlock className="h-3 w-3" />
                                Liberar
                              </button>
                            )}

                            {item.estado === 'disponible' && (
                              <button
                                onClick={() => setManualPayNumber(item.numero)}
                                disabled={actionLoading === item.numero}
                                className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                                title="Confirmar pago manual o presencial"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Cobrar
                              </button>
                            )}

                            {item.estado === 'pagado' && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Seguro que deseas cancelar la venta del número #${item.numero}? Volverá a estar disponible.`)) {
                                    handleAction(item.numero, 'cancelar_venta');
                                  }
                                }}
                                disabled={actionLoading === item.numero}
                                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-900/40 transition-colors cursor-pointer"
                                title="Cancelar venta y liberar"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredList.length > 150 && (
                <div className="text-center text-xs text-slate-500 py-2">
                  Mostrando los primeros 150 números de {filteredList.length}. Usa el buscador para filtrar números específicos.
                </div>
              )}
            </div>
          )}

          {activeTab === 'premios' && (
            /* TAB 2: INGRESO Y GESTIÓN DE PREMIOS A SORTEAR */
            <div className="space-y-6">
              {/* Header with Call to Action to enter prizes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-400" />
                    Premios que se Sortearán en Gran Sorteo
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Aquí puedes ingresar, editar o eliminar los premios de la rifa. Cada premio aparecerá
                    automáticamente en la página principal y podrá ser sorteado ante notario con la ruleta oficial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingPrize({
                      posicion: (raffle?.premios?.length || 0) + 1,
                      nombre: '',
                      descripcion: '',
                      valorEstimado: 200000,
                      imagen: '',
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Ingresar Nuevo Premio</span>
                </button>
              </div>

              {/* Form Modal for Creating/Editing Prize */}
              {editingPrize && (
                <div className="rounded-3xl border-2 border-amber-500/40 bg-slate-950 p-6 space-y-5 shadow-2xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-400" />
                      {editingPrize.id ? 'Modificar Premio' : 'Ingresar Nuevo Premio a Sortear'}
                    </h4>
                    <button
                      onClick={() => setEditingPrize(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  {!editingPrize.id && (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        Ideas rápidas de premios (haz clic para autocompletar):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prizePresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setEditingPrize({
                                ...editingPrize,
                                nombre: preset.nombre,
                                descripcion: preset.descripcion,
                                valorEstimado: preset.valorEstimado,
                                imagen: preset.imagen || '',
                              })
                            }
                            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-[11px] text-slate-300 hover:text-amber-300 hover:border-amber-500 transition-colors cursor-pointer"
                          >
                            + {preset.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSavePrize} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Posición / Orden del Sorteo: <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          required
                          value={editingPrize.posicion || 1}
                          onChange={(e) =>
                            setEditingPrize({ ...editingPrize, posicion: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white font-mono"
                        />
                        <span className="text-[10px] text-slate-500">
                          1 para 1er Lugar (Premio Mayor), 2 para 2do Lugar...
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Nombre del premio: <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: PlayStation 5 Slim 1TB + 2 Mandos DualSense"
                          value={editingPrize.nombre || ''}
                          onChange={(e) =>
                            setEditingPrize({ ...editingPrize, nombre: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">
                        Descripción detallada del premio: <span className="text-amber-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Ej: Consola nueva en caja sellada con garantía oficial de 1 año y despacho a domicilio en todo Chile..."
                        value={editingPrize.descripcion || ''}
                        onChange={(e) =>
                          setEditingPrize({ ...editingPrize, descripcion: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Valor comercial estimado (CLP):
                        </label>
                        <input
                          type="number"
                          placeholder="550000"
                          value={editingPrize.valorEstimado || ''}
                          onChange={(e) =>
                            setEditingPrize({
                              ...editingPrize,
                              valorEstimado: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white font-mono"
                        />
                        <span className="text-[10px] text-slate-500">
                          Ej: 550000 (se mostrará como $550.000)
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          URL de imagen del premio (Opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="https://... o ruta de imagen"
                          value={editingPrize.imagen || ''}
                          onChange={(e) =>
                            setEditingPrize({ ...editingPrize, imagen: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setEditingPrize(null)}
                        className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingPrize}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 cursor-pointer disabled:opacity-50"
                      >
                        {savingPrize ? 'Guardando...' : 'Guardar Premio'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List of Configured Prizes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(raffle?.premios || []).map((prize) => (
                  <div
                    key={prize.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm border border-amber-500/30">
                          {prize.posicion}°
                        </span>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                            {prize.posicion === 1
                              ? '🥇 Premio Mayor (1° Lugar)'
                              : prize.posicion === 2
                              ? '🥈 Segundo Premio (2° Lugar)'
                              : prize.posicion === 3
                              ? '🥉 Tercer Premio (3° Lugar)'
                              : `🏅 Premio ${prize.posicion}° Lugar`}
                          </span>
                          <h4 className="text-base font-bold text-white">{prize.nombre}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingPrize(prize)}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar premio"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrize(prize.id)}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Eliminar premio"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{prize.descripcion}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      {prize.valorEstimado && (
                        <div className="text-slate-400">
                          Valor estimado:{' '}
                          <span className="font-mono font-bold text-white">
                            {formatCLP(prize.valorEstimado)}
                          </span>
                        </div>
                      )}

                      {prize.sorteoGanador ? (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                            🏆 Ganador: #{prize.sorteoGanador.numero} ({prize.sorteoGanador.buyerNombre})
                          </span>
                          <button
                            onClick={() => handleClearPrizeWinner(prize.id)}
                            className="text-[11px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                          >
                            Resortear
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPrizeForDraw(prize.id);
                            setActiveTab('sorteo');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <Trophy className="h-3 w-3" />
                          Sortear este premio
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sorteo' && (
            /* TAB 3: AUTOMATIC WINNER DRAW (SORTEO EN VIVO) */
            <div className="max-w-2xl mx-auto rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Trophy className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Ruleta Notarial en Vivo</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  El sistema selecciona un ganador de forma aleatoria y criptográficamente segura únicamente
                  entre los tickets que tienen estado <strong>PAGADO</strong>.
                </p>
              </div>

              {/* Prize selector for draw */}
              {raffle?.premios && raffle.premios.length > 0 && (
                <div className="text-left max-w-sm mx-auto">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Seleccionar premio a sortear:
                  </label>
                  <select
                    value={selectedPrizeForDraw}
                    onChange={(e) => setSelectedPrizeForDraw(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    {raffle.premios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.posicion}° Lugar: {p.nombre} {p.sorteoGanador ? ' (Ya Sorteado)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Big Animated Wheel Box */}
              <div className="rounded-3xl border-2 border-amber-500/50 bg-slate-900 p-8 shadow-2xl relative overflow-hidden">
                <div className="text-xs text-amber-400 uppercase tracking-widest font-mono mb-2">
                  {drawingInProgress ? 'Sorteando Número Ganador...' : 'Número Ganador'}
                </div>

                <div className="font-mono text-6xl sm:text-7xl font-black text-amber-400 tracking-wider">
                  {drawingInProgress ? spinningNumber : drawResult?.numero ? `#${drawResult.numero}` : '---'}
                </div>

                {drawResult && !drawingInProgress && (
                  <div className="mt-4 pt-4 border-t border-slate-800 text-sm">
                    {drawResult.prizeNombre && (
                      <span className="text-xs text-amber-400 font-semibold block mb-1">
                        Premio: {drawResult.prizeNombre}
                      </span>
                    )}
                    <p className="text-slate-300 font-semibold">
                      Comprador: <span className="text-white font-bold">{drawResult.buyerNombre}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      RUT: {drawResult.buyerDocumento} · Sorteado: {formatDate(drawResult.fechaSorteo)}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={drawingInProgress || stats.pagados === 0}
                  onClick={handleTriggerDraw}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 font-bold text-sm text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {drawingInProgress ? 'Girando ruleta...' : 'Realizar Sorteo en Vivo'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'configuracion' && (
            /* TAB 4: CONFIGURACIÓN GENERAL (NOMBRE, PRECIO, LINK MACH BCI) */
            <div className="max-w-3xl mx-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Configuración del Gran Sorteo</h3>
                    <p className="text-xs text-slate-400">
                      Modifica el nombre del sorteo, precio por número y el enlace de pago de MACH BCI.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                {/* Nombre de la rifa */}
                <div>
                  <label className="block text-slate-300 mb-1.5 font-semibold">
                    Nombre oficial del sorteo: <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsNombre}
                    onChange={(e) => setSettingsNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white font-bold"
                    placeholder="Gran Sorteo 2026"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Se mostrará en la barra superior, portada hero y en los comprobantes de compra.
                  </p>
                </div>

                {/* Precio por número */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-semibold">
                      Precio de cada número (CLP): <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        required
                        value={settingsPrecio}
                        onChange={(e) => setSettingsPrecio(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-7 pr-3 py-3 text-sm text-white font-mono font-bold"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Precio oficial: <strong>$2.000</strong> CLP por número (Meta: {formatCLP(500 * settingsPrecio)}).
                    </p>
                  </div>

                  {/* Total de números */}
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-semibold">
                      Total de números:
                    </label>
                    <input
                      type="text"
                      disabled
                      value="500 números (del 001 al 500)"
                      className="w-full rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-sm text-slate-400 font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cuadrícula fija del 001 al 500.
                    </p>
                  </div>
                </div>

                {/* Pasarela de pago Plataforma FLOW con API KEY & SECRET KEY */}
                <div className="rounded-2xl border-2 border-sky-500/40 bg-gradient-to-b from-blue-950/30 to-slate-900/90 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white font-extrabold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-sky-400" />
                      Pasarela Flow API Oficial (Chile):
                    </label>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      API Conectada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Flow API Key:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="27FECD5E-E313-40F9-8AC1-73BB832L658B"
                        value={settingsFlowApiKey}
                        onChange={(e) => setSettingsFlowApiKey(e.target.value)}
                        className="w-full rounded-xl border border-sky-500/40 bg-slate-950 p-2.5 text-xs text-sky-300 font-mono font-medium focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Flow Secret Key:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="cb34518dcdfef8b61a4a55495faef1c1a50e54eb"
                        value={settingsFlowSecretKey}
                        onChange={(e) => setSettingsFlowSecretKey(e.target.value)}
                        className="w-full rounded-xl border border-sky-500/40 bg-slate-950 p-2.5 text-xs text-emerald-400 font-mono font-medium focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Enlace Portal Flow / Base:
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.flow.cl/"
                      value={settingsFlowLink}
                      onChange={(e) => setSettingsFlowLink(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      disabled={flowTestLoading}
                      onClick={handleTestFlowConnection}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-950/70 border border-sky-500/40 px-3.5 py-2 text-xs font-bold text-sky-300 hover:bg-sky-900/50 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${flowTestLoading ? 'animate-spin' : ''}`} />
                      <span>{flowTestLoading ? 'Probando conexión...' : 'Probar Conexión Flow API'}</span>
                    </button>

                    <p className="text-[11px] text-slate-400">
                      Firma criptográfica HMAC-SHA256 con Secret Key verificada.
                    </p>
                  </div>

                  {flowTestStatus && (
                    <div
                      className={`rounded-xl p-3 text-xs border ${
                        flowTestStatus.success
                          ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                          : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                      }`}
                    >
                      {flowTestStatus.message}
                    </div>
                  )}
                </div>

                {/* Enlace alternativo MACH BCI */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-fuchsia-400" />
                      Enlace Directo MACH BCI (Opcional):
                    </label>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      Secundario
                    </span>
                  </div>

                  <input
                    type="url"
                    placeholder="https://app.soymach.com/rF2V/10dplbjf"
                    value={settingsMachLink}
                    onChange={(e) => setSettingsMachLink(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-fuchsia-300 font-mono focus:border-fuchsia-400 focus:outline-none"
                  />
                </div>

                {/* Descripción de la rifa */}
                <div>
                  <label className="block text-slate-300 mb-1.5 font-semibold">
                    Descripción del Sorteo:
                  </label>
                  <textarea
                    rows={2}
                    value={settingsDescripcion}
                    onChange={(e) => setSettingsDescripcion(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white"
                    placeholder="Sorteo oficial exclusivo de 500 números..."
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 font-bold text-xs text-white hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingSettings ? 'Guardando...' : 'Guardar Configuración'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal for manual confirmation of payment for a number */}
        {manualPayNumber && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white">
                  Cobro Manual · Número #{manualPayNumber}
                </h4>
                <button onClick={() => setManualPayNumber(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Registra los datos del comprador presencial o transferencia directa ({formatCLP(raffle?.precio_numero || 2000)}):
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Nombre completo:</label>
                  <input
                    type="text"
                    placeholder="Ej: Marcelo Morales"
                    value={manualBuyerName}
                    onChange={(e) => setManualBuyerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">RUT / Documento:</label>
                  <input
                    type="text"
                    placeholder="15.890.123-4"
                    value={manualBuyerDoc}
                    onChange={(e) => setManualBuyerDoc(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={manualBuyerPhone}
                    onChange={(e) => setManualBuyerPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Correo electrónico:</label>
                  <input
                    type="email"
                    placeholder="comprador@ejemplo.cl"
                    value={manualBuyerEmail}
                    onChange={(e) => setManualBuyerEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setManualPayNumber(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    handleAction(manualPayNumber, 'marcar_pagado', {
                      nombre: manualBuyerName || 'Comprador Presencial',
                      documento: manualBuyerDoc || '11.111.111-1',
                      telefono: manualBuyerPhone || '+56 9 0000 0000',
                      email: manualBuyerEmail || 'presencial@gransorteo.cl',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-500 font-bold text-xs text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  Confirmar y Marcar Pagado
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
