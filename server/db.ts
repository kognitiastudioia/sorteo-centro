import fs from 'node:fs';
import path from 'node:path';
import type {
  Buyer,
  NumberStatus,
  Order,
  Payment,
  RaffleInfo,
  RaffleNumber,
  RafflePrize,
  RaffleStats,
  Reservation,
} from './types.ts';
import { sseManager } from './sse.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'raffle_state.json');

// 10 minutes in milliseconds
export const RESERVATION_TIMEOUT_MS = 10 * 60 * 1000;

interface DatabaseSchema {
  raffle: RaffleInfo;
  numbers: Record<string, RaffleNumber>; // keyed by "001", "002", etc.
  buyers: Record<string, Buyer>;
  reservations: Record<string, Reservation>;
  orders: Record<string, Order>;
  payments: Record<string, Payment>;
}

class RaffleDatabase {
  private state: DatabaseSchema;
  private expiryInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.loadInitialData();
    this.startExpiryTicker();
  }

  private getDefaultPrizes(): RafflePrize[] {
    return [
      {
        id: 'prize-1',
        posicion: 1,
        nombre: 'Apple iPhone 16 Pro Max 256GB Titanio + AirPods Pro 2',
        descripcion: 'Equipo nuevo sellado color Titanio Desierto, audífonos AirPods Pro 2da Gen USB-C y $500.000 CLP en efectivo transferible directo.',
        imagen: '/src/assets/images/raffle_hero_prize_1791477047971.jpg',
        valorEstimado: 1600000,
        sorteoGanador: null,
      },
      {
        id: 'prize-2',
        posicion: 2,
        nombre: 'PlayStation 5 Slim 1TB + 2 Controles DualSense',
        descripcion: 'Consola Sony PlayStation 5 Slim edición digital con 2 mandos inalámbricos y garantía oficial.',
        imagen: '/src/assets/images/raffle_prize_detail_1791477059727.jpg',
        valorEstimado: 550000,
        sorteoGanador: null,
      },
      {
        id: 'prize-3',
        posicion: 3,
        nombre: '$200.000 CLP en Efectivo',
        descripcion: 'Premio monetario transferible de inmediato a la cuenta bancaria del ganador el día del sorteo.',
        valorEstimado: 200000,
        sorteoGanador: null,
      },
      {
        id: 'prize-4',
        posicion: 4,
        nombre: 'Parlante JBL Charge 5 Portable Bluetooth',
        descripcion: 'Sonido potente con resistencia al agua y polvo IP67 y hasta 20 horas de batería.',
        valorEstimado: 140000,
        sorteoGanador: null,
      },
    ];
  }

  private loadInitialData(): DatabaseSchema {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.raffle && parsed.numbers && Object.keys(parsed.numbers).length === 500) {
          parsed.raffle.nombre = 'Gran Sorteo 2026';
          parsed.raffle.precio_numero = 2000;
          parsed.raffle.metaRecaudacion = 1000000;
          parsed.raffle.flowLink = parsed.raffle.flowLink || 'https://www.flow.cl/';
          parsed.raffle.flowApiKey = parsed.raffle.flowApiKey || '27FECD5E-E313-40F9-8AC1-73BB832L658B';
          parsed.raffle.flowSecretKey = parsed.raffle.flowSecretKey || 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb';
          parsed.raffle.machLink = 'https://app.soymach.com/rF2V/10dplbjf';
          if (!parsed.raffle.premios || parsed.raffle.premios.length === 0) {
            parsed.raffle.premios = this.getDefaultPrizes();
          }
          return parsed;
        }
      } catch (err) {
        console.error('Error reading saved raffle state, creating fresh state:', err);
      }
    }
    return this.createSeedData();
  }

  private saveState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save raffle state:', err);
    }
  }

  private createSeedData(): DatabaseSchema {
    const raffle: RaffleInfo = {
      id: 'raffle-titanium-2026',
      nombre: 'Gran Sorteo 2026',
      descripcion: 'Sorteo oficial exclusivo de 500 números. Cada ticket te da la oportunidad de llevarte el combo tecnológico más codiciado del año con entrega inmediata en todo Chile o retiro presencial garantizado.',
      premio: 'iPhone 16 Pro Max 256GB Titanio + AirPods Pro 2',
      premioDetalle: 'Incluye iPhone 16 Pro Max 256GB color Titanio Desierto sellado, AirPods Pro 2da Generación con estuche MagSafe USB-C, y $500.000 CLP en efectivo transferible de inmediato.',
      imagen: '/src/assets/images/raffle_hero_prize_1791477047971.jpg',
      imagenDetalle: '/src/assets/images/raffle_prize_detail_1791477059727.jpg',
      precio_numero: 2000,
      fecha_sorteo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      estado: 'activa',
      totalNumeros: 500,
      metaRecaudacion: 1000000, // 500 * 2000 = $1.000.000
      organizador: 'Fundación & Eventos Pro Chile',
      terminos: 'Bases notariales registradas. Sorteo transmitido en vivo ante notario público al vender el 100% de los números o al cumplir la fecha límite.',
      flowLink: 'https://www.flow.cl/',
      flowApiKey: '27FECD5E-E313-40F9-8AC1-73BB832L658B',
      flowSecretKey: 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb',
      machLink: 'https://app.soymach.com/rF2V/10dplbjf',
      premios: this.getDefaultPrizes(),
      sorteoGanador: null,
    };

    const numbers: Record<string, RaffleNumber> = {};
    for (let i = 1; i <= 500; i++) {
      const numStr = i.toString().padStart(3, '0');
      numbers[numStr] = {
        id: i,
        numero: numStr,
        estado: 'disponible',
      };
    }

    const buyers: Record<string, Buyer> = {};
    const orders: Record<string, Order> = {};
    const payments: Record<string, Payment> = {};
    const reservations: Record<string, Reservation> = {};

    // Seed realistic buyers & purchases so the raffle feels alive immediately
    const sampleBuyers = [
      { id: 'b-1', nombre: 'Carlos Muñoz Valenzuela', documento: '16.782.901-4', telefono: '+56 9 8765 4321', email: 'carlos.munoz@email.cl', nums: ['007', '025', '118'] },
      { id: 'b-2', nombre: 'Valentina Silva Soto', documento: '18.432.109-K', telefono: '+56 9 7654 3210', email: 'v.silva@gmail.com', nums: ['042', '099'] },
      { id: 'b-3', nombre: 'Matías Morales Lagos', documento: '15.890.345-2', telefono: '+56 9 6543 2109', email: 'matias.m@outlook.com', nums: ['150', '200', '350', '480'] },
      { id: 'b-4', nombre: 'Francisca Araya Rojas', documento: '19.123.456-7', telefono: '+56 9 5432 1098', email: 'fran.araya@live.cl', nums: ['077', '124', '301'] },
      { id: 'b-5', nombre: 'Ignacio Fuentes Pinto', documento: '17.654.321-8', telefono: '+56 9 4321 0987', email: 'ifuentes@hotmail.com', nums: ['245', '246'] },
      { id: 'b-6', nombre: 'Camila Espinoza Jara', documento: '18.987.654-3', telefono: '+56 9 3210 9876', email: 'camila.jara@gmail.com', nums: ['015', '180'] },
      { id: 'b-7', nombre: 'Rodrigo Henríquez Palma', documento: '14.567.890-1', telefono: '+56 9 9123 4567', email: 'rodrigo.h@empresa.cl', nums: ['333', '444', '500'] },
      { id: 'b-8', nombre: 'Javiera Poblete Miranda', documento: '20.109.876-5', telefono: '+56 9 8234 5678', email: 'javi.poblete@gmail.com', nums: ['088', '111'] },
    ];

    let orderSeq = 1001;
    for (const b of sampleBuyers) {
      buyers[b.id] = {
        id: b.id,
        nombre: b.nombre,
        documento: b.documento,
        telefono: b.telefono,
        email: b.email,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString(),
      };

      const orderId = `ORD-${orderSeq++}`;
      const payId = `PAY-${orderSeq}`;
      const total = b.nums.length * raffle.precio_numero;
      const paidAt = buyers[b.id].created_at;

      orders[orderId] = {
        id: orderId,
        buyer_id: b.id,
        buyer_nombre: b.nombre,
        buyer_documento: b.documento,
        buyer_telefono: b.telefono,
        buyer_email: b.email,
        numbers: b.nums,
        total,
        status: 'paid',
        payment_provider: 'webpay_plus',
        transaction_id: `TBK-TX-${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: paidAt,
      };

      payments[payId] = {
        id: payId,
        order_id: orderId,
        payment_provider: 'webpay_plus',
        transaction_id: orders[orderId].transaction_id,
        amount: total,
        status: 'approved',
        paid_at: paidAt,
      };

      for (const num of b.nums) {
        if (numbers[num]) {
          numbers[num].estado = 'pagado';
          numbers[num].buyer_id = b.id;
          numbers[num].buyer_nombre = b.nombre;
          numbers[num].order_id = orderId;
          numbers[num].payment_id = payId;
          numbers[num].paid_at = paidAt;
        }
      }
    }

    // Seed 2 active reservations to illustrate real-time hold
    const sampleReservations = [
      {
        id: 'res-seed-1',
        sessionId: 'session-demo-reserve-1',
        nums: ['033', '034'],
        expiresInSec: 420, // 7 min remaining
      },
      {
        id: 'res-seed-2',
        sessionId: 'session-demo-reserve-2',
        nums: ['210', '211', '212'],
        expiresInSec: 540, // 9 min remaining
      },
    ];

    for (const r of sampleReservations) {
      const expiresAt = new Date(Date.now() + r.expiresInSec * 1000).toISOString();
      reservations[r.id] = {
        id: r.id,
        session_id: r.sessionId,
        numbers: r.nums,
        expires_at: expiresAt,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      for (const num of r.nums) {
        if (numbers[num]) {
          numbers[num].estado = 'reservado';
          numbers[num].reservation_id = r.id;
          numbers[num].reserved_by_session = r.sessionId;
          numbers[num].reserved_at = new Date().toISOString();
        }
      }
    }

    return { raffle, numbers, buyers, reservations, orders, payments };
  }

  private startExpiryTicker() {
    if (this.expiryInterval) clearInterval(this.expiryInterval);
    this.expiryInterval = setInterval(() => {
      this.checkAndExpireReservations();
    }, 4000);
  }

  public checkAndExpireReservations(): string[] {
    const now = Date.now();
    const expiredNumbers: string[] = [];

    for (const res of Object.values(this.state.reservations)) {
      if (res.status === 'active' && new Date(res.expires_at).getTime() <= now) {
        res.status = 'expired';
        for (const numStr of res.numbers) {
          const item = this.state.numbers[numStr];
          if (item && item.estado === 'reservado' && item.reservation_id === res.id) {
            item.estado = 'disponible';
            item.reservation_id = null;
            item.reserved_by_session = null;
            item.reserved_at = null;
            expiredNumbers.push(numStr);
          }
        }
      }
    }

    if (expiredNumbers.length > 0) {
      this.saveState();
      sseManager.broadcast('numbers:expired', {
        numbers: expiredNumbers,
        message: 'Reservas temporales expiradas han retornado a disponible',
      });
      sseManager.broadcast('stats:updated', this.getStats());
    }

    return expiredNumbers;
  }

  // --- PUBLIC METHODS ---

  public getRaffle(): RaffleInfo {
    return this.state.raffle;
  }

  public getNumbersList(): RaffleNumber[] {
    return Object.values(this.state.numbers).sort((a, b) => a.id - b.id);
  }

  public getNumbersMap(): Record<string, RaffleNumber> {
    return this.state.numbers;
  }

  public getStats(): RaffleStats {
    let disponibles = 0;
    let reservados = 0;
    let pagados = 0;

    for (const item of Object.values(this.state.numbers)) {
      if (item.estado === 'disponible') disponibles++;
      else if (item.estado === 'reservado') reservados++;
      else if (item.estado === 'pagado') pagados++;
    }

    const totalRecaudado = pagados * this.state.raffle.precio_numero;
    const totalCompradores = Object.keys(this.state.buyers).length;
    const porcentajeVendido = Math.round((pagados / this.state.raffle.totalNumeros) * 100);

    return {
      total: this.state.raffle.totalNumeros,
      disponibles,
      reservados,
      pagados,
      totalRecaudado,
      totalCompradores,
      porcentajeVendido,
    };
  }

  /**
   * Concurrency-safe reservation creation:
   * Re-evaluates availability of every number atomically.
   */
  public reserveNumbers(numbersToReserve: string[], sessionId: string): {
    success: boolean;
    reservation?: Reservation;
    conflicts?: string[];
    error?: string;
  } {
    if (!numbersToReserve || numbersToReserve.length === 0) {
      return { success: false, error: 'No se enviaron números para reservar.' };
    }

    // Clean up any stale expired reservations first
    this.checkAndExpireReservations();

    const conflicts: string[] = [];
    for (const numStr of numbersToReserve) {
      const numItem = this.state.numbers[numStr];
      if (!numItem) {
        conflicts.push(numStr);
        continue;
      }
      // If already reserved by THIS session, it's ok to re-affirm
      if (numItem.estado === 'reservado' && numItem.reserved_by_session === sessionId) {
        continue;
      }
      if (numItem.estado !== 'disponible') {
        conflicts.push(numStr);
      }
    }

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts,
        error: `Los siguientes números ya no están disponibles: ${conflicts.join(', ')}`,
      };
    }

    // Release any previous reservation from THIS session that is not in the new set
    for (const numItem of Object.values(this.state.numbers)) {
      if (
        numItem.estado === 'reservado' &&
        numItem.reserved_by_session === sessionId &&
        !numbersToReserve.includes(numItem.numero)
      ) {
        numItem.estado = 'disponible';
        numItem.reservation_id = null;
        numItem.reserved_by_session = null;
        numItem.reserved_at = null;
      }
    }

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT_MS).toISOString();

    const newReservation: Reservation = {
      id: reservationId,
      session_id: sessionId,
      numbers: numbersToReserve,
      expires_at: expiresAt,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.state.reservations[reservationId] = newReservation;

    const modifiedNumbers: RaffleNumber[] = [];
    for (const numStr of numbersToReserve) {
      const numItem = this.state.numbers[numStr];
      numItem.estado = 'reservado';
      numItem.reservation_id = reservationId;
      numItem.reserved_by_session = sessionId;
      numItem.reserved_at = newReservation.created_at;
      modifiedNumbers.push(numItem);
    }

    this.saveState();

    // Broadcast real-time change to all other users
    sseManager.broadcast('numbers:reserved', {
      numbers: numbersToReserve,
      expires_at: expiresAt,
      sessionId,
    });
    sseManager.broadcast('stats:updated', this.getStats());

    return {
      success: true,
      reservation: newReservation,
    };
  }

  /**
   * Release reserved numbers for a session (e.g. user clears cart or leaves checkout)
   */
  public releaseReservation(sessionId: string, numbersToRelease?: string[]): { success: boolean; released: string[] } {
    const released: string[] = [];

    for (const numItem of Object.values(this.state.numbers)) {
      if (numItem.estado === 'reservado' && numItem.reserved_by_session === sessionId) {
        if (!numbersToRelease || numbersToRelease.includes(numItem.numero)) {
          numItem.estado = 'disponible';
          numItem.reservation_id = null;
          numItem.reserved_by_session = null;
          numItem.reserved_at = null;
          released.push(numItem.numero);
        }
      }
    }

    // Update reservation objects
    for (const res of Object.values(this.state.reservations)) {
      if (res.session_id === sessionId && res.status === 'active') {
        if (!numbersToRelease) {
          res.status = 'cancelled';
        } else {
          res.numbers = res.numbers.filter((n) => !numbersToRelease.includes(n));
          if (res.numbers.length === 0) res.status = 'cancelled';
        }
      }
    }

    if (released.length > 0) {
      this.saveState();
      sseManager.broadcast('numbers:released', { numbers: released });
      sseManager.broadcast('stats:updated', this.getStats());
    }

    return { success: true, released };
  }

  /**
   * Final checkout & purchase confirmation:
   * Validates numbers, registers Buyer, creates Order and Payment, and transitions numbers to 'pagado'
   */
  public completeCheckout(params: {
    sessionId: string;
    numbers: string[];
    buyer: {
      nombre: string;
      documento: string;
      telefono: string;
      email: string;
    };
    paymentProvider: 'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia';
  }): {
    success: boolean;
    order?: Order;
    payment?: Payment;
    error?: string;
    conflicts?: string[];
  } {
    const { sessionId, numbers, buyer: buyerInput, paymentProvider } = params;

    if (!numbers || numbers.length === 0) {
      return { success: false, error: 'Debes seleccionar al menos un número.' };
    }

    this.checkAndExpireReservations();

    // Verification check: ensure all numbers are held by this session OR currently disponible
    const conflicts: string[] = [];
    for (const numStr of numbers) {
      const item = this.state.numbers[numStr];
      if (!item) {
        conflicts.push(numStr);
        continue;
      }
      if (item.estado === 'pagado') {
        conflicts.push(numStr);
        continue;
      }
      if (item.estado === 'reservado' && item.reserved_by_session !== sessionId) {
        conflicts.push(numStr);
      }
    }

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts,
        error: `Conflicto: Los números ${conflicts.join(', ')} ya fueron reservados o pagados por otra persona.`,
      };
    }

    // Find or create buyer
    let buyerId = '';
    const existingBuyer = Object.values(this.state.buyers).find(
      (b) => b.documento.trim().toLowerCase() === buyerInput.documento.trim().toLowerCase() ||
             b.email.trim().toLowerCase() === buyerInput.email.trim().toLowerCase()
    );

    const nowIso = new Date().toISOString();

    if (existingBuyer) {
      buyerId = existingBuyer.id;
      // Update info if changed
      existingBuyer.nombre = buyerInput.nombre.trim();
      existingBuyer.telefono = buyerInput.telefono.trim();
      existingBuyer.email = buyerInput.email.trim();
    } else {
      buyerId = `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      this.state.buyers[buyerId] = {
        id: buyerId,
        nombre: buyerInput.nombre.trim(),
        documento: buyerInput.documento.trim(),
        telefono: buyerInput.telefono.trim(),
        email: buyerInput.email.trim(),
        created_at: nowIso,
      };
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const payId = `PAY-${Date.now().toString().slice(-6)}`;
    const totalAmount = numbers.length * this.state.raffle.precio_numero;
    const txId = `${paymentProvider.toUpperCase().slice(0, 4)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      buyer_id: buyerId,
      buyer_nombre: buyerInput.nombre.trim(),
      buyer_documento: buyerInput.documento.trim(),
      buyer_telefono: buyerInput.telefono.trim(),
      buyer_email: buyerInput.email.trim(),
      numbers,
      total: totalAmount,
      status: 'paid',
      payment_provider: paymentProvider,
      transaction_id: txId,
      created_at: nowIso,
    };

    const newPayment: Payment = {
      id: payId,
      order_id: orderId,
      payment_provider: paymentProvider,
      transaction_id: txId,
      amount: totalAmount,
      status: 'approved',
      paid_at: nowIso,
    };

    this.state.orders[orderId] = newOrder;
    this.state.payments[payId] = newPayment;

    // Transition all numbers to PAGADO
    for (const numStr of numbers) {
      const item = this.state.numbers[numStr];
      item.estado = 'pagado';
      item.buyer_id = buyerId;
      item.buyer_nombre = buyerInput.nombre.trim();
      item.order_id = orderId;
      item.payment_id = payId;
      item.paid_at = nowIso;
      item.reservation_id = null;
      item.reserved_by_session = null;
      item.reserved_at = null;
    }

    // Mark reservations as completed
    for (const res of Object.values(this.state.reservations)) {
      if (res.session_id === sessionId && res.status === 'active') {
        res.status = 'completed';
      }
    }

    this.saveState();

    // Broadcast instant real-time update to all clients!
    sseManager.broadcast('numbers:purchased', {
      numbers,
      buyerNombre: buyerInput.nombre.trim(),
      orderId,
    });
    sseManager.broadcast('stats:updated', this.getStats());

    return {
      success: true,
      order: newOrder,
      payment: newPayment,
    };
  }

  public getOrderById(orderId: string): Order | null {
    return this.state.orders[orderId] || null;
  }

  public getPaymentByOrderId(orderId: string): Payment | null {
    return Object.values(this.state.payments).find((p) => p.order_id === orderId) || null;
  }

  // --- ADMIN METHODS ---

  public getAdminData() {
    this.checkAndExpireReservations();
    const numbersList = Object.values(this.state.numbers).sort((a, b) => a.id - b.id);
    const buyersList = Object.values(this.state.buyers);
    const ordersList = Object.values(this.state.orders).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const stats = this.getStats();

    // Aggregate numbers with full buyer information
    const enrichedNumbers = numbersList.map((n) => {
      let buyer: Buyer | null = null;
      let order: Order | null = null;
      if (n.buyer_id && this.state.buyers[n.buyer_id]) {
        buyer = this.state.buyers[n.buyer_id];
      }
      if (n.order_id && this.state.orders[n.order_id]) {
        order = this.state.orders[n.order_id];
      }
      return {
        ...n,
        buyer,
        order,
      };
    });

    return {
      raffle: this.state.raffle,
      stats,
      numbers: enrichedNumbers,
      buyers: buyersList,
      orders: ordersList,
    };
  }

  public adminUpdateNumberStatus(numero: string, action: 'liberar' | 'marcar_pagado' | 'cancelar_venta', adminBuyerInfo?: {
    nombre: string;
    documento: string;
    telefono: string;
    email: string;
  }): { success: boolean; message: string; number?: RaffleNumber } {
    const item = this.state.numbers[numero];
    if (!item) {
      return { success: false, message: `Número ${numero} no encontrado.` };
    }

    if (action === 'liberar') {
      item.estado = 'disponible';
      item.reservation_id = null;
      item.reserved_by_session = null;
      item.reserved_at = null;
      this.saveState();
      sseManager.broadcast('numbers:released', { numbers: [numero] });
      sseManager.broadcast('stats:updated', this.getStats());
      return { success: true, message: `Número ${numero} liberado a disponible.`, number: item };
    }

    if (action === 'cancelar_venta') {
      const prevOrderId = item.order_id;
      item.estado = 'disponible';
      item.buyer_id = null;
      item.buyer_nombre = null;
      item.order_id = null;
      item.payment_id = null;
      item.paid_at = null;
      item.reservation_id = null;
      item.reserved_by_session = null;
      item.reserved_at = null;

      if (prevOrderId && this.state.orders[prevOrderId]) {
        this.state.orders[prevOrderId].numbers = this.state.orders[prevOrderId].numbers.filter((n) => n !== numero);
        if (this.state.orders[prevOrderId].numbers.length === 0) {
          this.state.orders[prevOrderId].status = 'cancelled';
        }
      }

      this.saveState();
      sseManager.broadcast('numbers:released', { numbers: [numero] });
      sseManager.broadcast('stats:updated', this.getStats());
      return { success: true, message: `Venta del número ${numero} cancelada y vuelto a disponible.`, number: item };
    }

    if (action === 'marcar_pagado') {
      const bInfo = adminBuyerInfo || {
        nombre: 'Comprador Presencial / Transferencia',
        documento: '11.111.111-1',
        telefono: '+56 9 0000 0000',
        email: 'presencial@rifapro.cl',
      };

      const buyerId = `buyer-admin-${Date.now()}`;
      this.state.buyers[buyerId] = {
        id: buyerId,
        nombre: bInfo.nombre,
        documento: bInfo.documento,
        telefono: bInfo.telefono,
        email: bInfo.email,
        created_at: new Date().toISOString(),
      };

      const orderId = `ORD-MAN-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      this.state.orders[orderId] = {
        id: orderId,
        buyer_id: buyerId,
        buyer_nombre: bInfo.nombre,
        buyer_documento: bInfo.documento,
        buyer_telefono: bInfo.telefono,
        buyer_email: bInfo.email,
        numbers: [numero],
        total: this.state.raffle.precio_numero,
        status: 'paid',
        payment_provider: 'transferencia',
        transaction_id: `ADMIN-CONFIRM-${Date.now()}`,
        created_at: now,
      };

      item.estado = 'pagado';
      item.buyer_id = buyerId;
      item.buyer_nombre = bInfo.nombre;
      item.order_id = orderId;
      item.paid_at = now;
      item.reservation_id = null;
      item.reserved_by_session = null;

      this.saveState();
      sseManager.broadcast('numbers:purchased', {
        numbers: [numero],
        buyerNombre: bInfo.nombre,
        orderId,
      });
      sseManager.broadcast('stats:updated', this.getStats());
      return { success: true, message: `Número ${numero} marcado como PAGADO manualmente.`, number: item };
    }

    return { success: false, message: 'Acción no reconocida' };
  }

  public drawWinner(): { success: boolean; winner?: { numero: string; buyerNombre: string; buyerDocumento: string; fechaSorteo: string }; error?: string } {
    const paidNumbers = Object.values(this.state.numbers).filter((n) => n.estado === 'pagado');
    if (paidNumbers.length === 0) {
      return { success: false, error: 'No hay ningún número pagado para realizar el sorteo.' };
    }

    const randomIndex = Math.floor(Math.random() * paidNumbers.length);
    const winningNumber = paidNumbers[randomIndex];
    const buyer = winningNumber.buyer_id ? this.state.buyers[winningNumber.buyer_id] : null;

    const winnerResult = {
      numero: winningNumber.numero,
      buyerNombre: winningNumber.buyer_nombre || buyer?.nombre || 'Ganador Registrado',
      buyerDocumento: buyer?.documento || 'Verificado',
      fechaSorteo: new Date().toISOString(),
    };

    this.state.raffle.sorteoGanador = winnerResult;
    this.saveState();

    sseManager.broadcast('raffle:winner_drawn', winnerResult);

    return {
      success: true,
      winner: winnerResult,
    };
  }

  public savePrize(prizeData: {
    id?: string;
    posicion?: number;
    nombre: string;
    descripcion: string;
    imagen?: string;
    valorEstimado?: number;
  }): RafflePrize {
    if (!this.state.raffle.premios) {
      this.state.raffle.premios = [];
    }

    let prize: RafflePrize;
    if (prizeData.id) {
      const idx = this.state.raffle.premios.findIndex((p) => p.id === prizeData.id);
      if (idx !== -1) {
        prize = {
          ...this.state.raffle.premios[idx],
          posicion: prizeData.posicion !== undefined ? Number(prizeData.posicion) : this.state.raffle.premios[idx].posicion,
          nombre: prizeData.nombre.trim(),
          descripcion: prizeData.descripcion.trim(),
          imagen: prizeData.imagen?.trim() || undefined,
          valorEstimado: prizeData.valorEstimado ? Number(prizeData.valorEstimado) : undefined,
        };
        this.state.raffle.premios[idx] = prize;
      } else {
        prize = {
          id: prizeData.id,
          posicion: prizeData.posicion ? Number(prizeData.posicion) : this.state.raffle.premios.length + 1,
          nombre: prizeData.nombre.trim(),
          descripcion: prizeData.descripcion.trim(),
          imagen: prizeData.imagen?.trim() || undefined,
          valorEstimado: prizeData.valorEstimado ? Number(prizeData.valorEstimado) : undefined,
          sorteoGanador: null,
        };
        this.state.raffle.premios.push(prize);
      }
    } else {
      prize = {
        id: `prize-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        posicion: prizeData.posicion ? Number(prizeData.posicion) : this.state.raffle.premios.length + 1,
        nombre: prizeData.nombre.trim(),
        descripcion: prizeData.descripcion.trim(),
        imagen: prizeData.imagen?.trim() || undefined,
        valorEstimado: prizeData.valorEstimado ? Number(prizeData.valorEstimado) : undefined,
        sorteoGanador: null,
      };
      this.state.raffle.premios.push(prize);
    }

    // Sort prizes by position
    this.state.raffle.premios.sort((a, b) => a.posicion - b.posicion);

    // If this is position 1, update main raffle prize representation
    if (prize.posicion === 1) {
      this.state.raffle.premio = prize.nombre;
      this.state.raffle.premioDetalle = prize.descripcion;
      if (prize.imagen) this.state.raffle.imagen = prize.imagen;
    }

    this.saveState();
    sseManager.broadcast('raffle:prizes_updated', this.state.raffle.premios);
    sseManager.broadcast('sync_all', {
      numbers: this.getNumbersList(),
      stats: this.getStats(),
      raffle: this.getRaffle(),
    });

    return prize;
  }

  public deletePrize(prizeId: string): boolean {
    if (!this.state.raffle.premios) return false;
    this.state.raffle.premios = this.state.raffle.premios.filter((p) => p.id !== prizeId);
    this.saveState();
    sseManager.broadcast('raffle:prizes_updated', this.state.raffle.premios);
    sseManager.broadcast('sync_all', {
      numbers: this.getNumbersList(),
      stats: this.getStats(),
      raffle: this.getRaffle(),
    });
    return true;
  }

  public drawWinnerForPrize(prizeId: string): {
    success: boolean;
    prize?: RafflePrize;
    winner?: { numero: string; buyerNombre: string; buyerDocumento: string; fechaSorteo: string };
    error?: string;
  } {
    const prize = this.state.raffle.premios?.find((p) => p.id === prizeId);
    if (!prize) {
      return { success: false, error: 'Premio no encontrado.' };
    }

    const paidNumbers = Object.values(this.state.numbers).filter((n) => n.estado === 'pagado');
    if (paidNumbers.length === 0) {
      return { success: false, error: 'No hay ningún número pagado para realizar el sorteo.' };
    }

    // Avoid giving multiple prizes to the same number if possible
    const alreadyWonNumbers = new Set(
      this.state.raffle.premios
        ?.filter((p) => p.id !== prizeId && p.sorteoGanador)
        .map((p) => p.sorteoGanador!.numero)
    );

    let candidates = paidNumbers.filter((n) => !alreadyWonNumbers.has(n.numero));
    if (candidates.length === 0) {
      candidates = paidNumbers;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winningNumber = candidates[randomIndex];
    const buyer = winningNumber.buyer_id ? this.state.buyers[winningNumber.buyer_id] : null;

    const winnerResult = {
      numero: winningNumber.numero,
      buyerNombre: winningNumber.buyer_nombre || buyer?.nombre || 'Ganador Registrado',
      buyerDocumento: buyer?.documento || 'Verificado',
      fechaSorteo: new Date().toISOString(),
    };

    prize.sorteoGanador = winnerResult;

    if (prize.posicion === 1) {
      this.state.raffle.sorteoGanador = winnerResult;
    }

    this.saveState();

    sseManager.broadcast('raffle:prize_winner_drawn', {
      prizeId,
      prize,
      winner: winnerResult,
    });
    sseManager.broadcast('raffle:prizes_updated', this.state.raffle.premios);
    sseManager.broadcast('sync_all', {
      numbers: this.getNumbersList(),
      stats: this.getStats(),
      raffle: this.getRaffle(),
    });

    return {
      success: true,
      prize,
      winner: winnerResult,
    };
  }

  public clearPrizeWinner(prizeId: string): boolean {
    const prize = this.state.raffle.premios?.find((p) => p.id === prizeId);
    if (!prize) return false;
    prize.sorteoGanador = null;
    if (prize.posicion === 1) {
      this.state.raffle.sorteoGanador = null;
    }
    this.saveState();
    sseManager.broadcast('raffle:prizes_updated', this.state.raffle.premios);
    sseManager.broadcast('sync_all', {
      numbers: this.getNumbersList(),
      stats: this.getStats(),
      raffle: this.getRaffle(),
    });
    return true;
  }

  public searchBuyerNumbers(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matchedBuyers = Object.values(this.state.buyers).filter(
      (b) => b.documento.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.nombre.toLowerCase().includes(q)
    );

    const buyerIds = new Set(matchedBuyers.map((b) => b.id));
    const results = Object.values(this.state.numbers)
      .filter((n) => n.buyer_id && buyerIds.has(n.buyer_id))
      .map((n) => {
        const buyer = this.state.buyers[n.buyer_id!];
        const order = n.order_id ? this.state.orders[n.order_id] : null;
        return {
          numero: n.numero,
          estado: n.estado,
          paid_at: n.paid_at,
          buyer,
          order,
        };
      });

    return results;
  }

  public exportCsv(): string {
    const headers = [
      'Numero',
      'Estado',
      'Comprador_Nombre',
      'Comprador_Documento',
      'Comprador_Telefono',
      'Comprador_Email',
      'Monto_Pagado_CLP',
      'Orden_ID',
      'Metodo_Pago',
      'Transaccion_ID',
      'Fecha_Pago',
    ];

    const rows: string[] = [headers.join(',')];
    const numbersList = Object.values(this.state.numbers).sort((a, b) => a.id - b.id);

    for (const n of numbersList) {
      const buyer = n.buyer_id ? this.state.buyers[n.buyer_id] : null;
      const order = n.order_id ? this.state.orders[n.order_id] : null;

      const row = [
        `"${n.numero}"`,
        `"${n.estado}"`,
        `"${buyer?.nombre || ''}"`,
        `"${buyer?.documento || ''}"`,
        `"${buyer?.telefono || ''}"`,
        `"${buyer?.email || ''}"`,
        n.estado === 'pagado' ? `${this.state.raffle.precio_numero}` : '0',
        `"${n.order_id || ''}"`,
        `"${order?.payment_provider || ''}"`,
        `"${order?.transaction_id || ''}"`,
        `"${n.paid_at || ''}"`,
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  public updateRaffleSettings(settings: Partial<RaffleInfo>): RaffleInfo {
    if (settings.nombre) this.state.raffle.nombre = settings.nombre.trim();
    if (settings.precio_numero !== undefined && Number(settings.precio_numero) > 0) {
      this.state.raffle.precio_numero = Number(settings.precio_numero);
      this.state.raffle.metaRecaudacion = this.state.raffle.totalNumeros * this.state.raffle.precio_numero;
    }
    if (settings.flowLink !== undefined) {
      this.state.raffle.flowLink = settings.flowLink.trim();
    }
    if (settings.flowApiKey !== undefined) {
      this.state.raffle.flowApiKey = settings.flowApiKey.trim();
    }
    if (settings.flowSecretKey !== undefined) {
      this.state.raffle.flowSecretKey = settings.flowSecretKey.trim();
    }
    if (settings.machLink !== undefined) {
      this.state.raffle.machLink = settings.machLink.trim();
    }
    if (settings.descripcion) this.state.raffle.descripcion = settings.descripcion.trim();
    if (settings.organizador) this.state.raffle.organizador = settings.organizador.trim();
    if (settings.fecha_sorteo) this.state.raffle.fecha_sorteo = settings.fecha_sorteo;
    if (settings.premio) this.state.raffle.premio = settings.premio.trim();
    if (settings.premioDetalle) this.state.raffle.premioDetalle = settings.premioDetalle.trim();

    this.saveState();
    sseManager.broadcast('sync_all', {
      numbers: this.getNumbersList(),
      stats: this.getStats(),
      raffle: this.getRaffle(),
    });
    return this.state.raffle;
  }

  public resetToFreshSeed() {
    this.state = this.createSeedData();
    this.saveState();
    sseManager.broadcast('sync_all', {
      numbers: this.getNumbersList(),
      stats: this.getStats(),
      raffle: this.getRaffle(),
    });
  }
}

export const db = new RaffleDatabase();
