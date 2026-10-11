export type NumberStatus = 'disponible' | 'reservado' | 'pagado';

export interface RafflePrize {
  id: string;
  posicion: number; // 1, 2, 3...
  nombre: string;
  descripcion: string;
  imagen?: string;
  valorEstimado?: number;
  sorteoGanador?: {
    numero: string;
    buyerNombre: string;
    buyerDocumento: string;
    fechaSorteo: string;
  } | null;
}

export interface RaffleInfo {
  id: string;
  nombre: string;
  descripcion: string;
  premio: string;
  premioDetalle: string;
  imagen: string;
  imagenDetalle: string;
  precio_numero: number;
  fecha_sorteo: string;
  estado: 'activa' | 'finalizada' | 'pausada';
  totalNumeros: number;
  metaRecaudacion: number;
  terminos: string;
  organizador: string;
  flowLink?: string;
  flowApiKey?: string;
  flowSecretKey?: string;
  machLink?: string;
  premios: RafflePrize[];
  sorteoGanador?: {
    numero: string;
    buyerNombre: string;
    buyerDocumento: string;
    fechaSorteo: string;
  } | null;
}

export interface Buyer {
  id: string;
  nombre: string;
  documento: string; // RUT o DNI
  telefono: string;
  email: string;
  created_at: string;
}

export interface RaffleNumber {
  id: number;
  numero: string; // "001" - "500"
  estado: NumberStatus;
  reservation_id?: string | null;
  buyer_id?: string | null;
  payment_id?: string | null;
  order_id?: string | null;
  reserved_at?: string | null;
  reserved_by_session?: string | null;
  paid_at?: string | null;
  buyer_nombre?: string | null;
}

export interface Reservation {
  id: string;
  session_id: string;
  buyer_id?: string | null;
  numbers: string[];
  expires_at: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer_nombre: string;
  buyer_documento: string;
  buyer_telefono: string;
  buyer_email: string;
  numbers: string[];
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_provider: 'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia';
  transaction_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_provider: 'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia';
  transaction_id: string;
  amount: number;
  status: 'approved' | 'rejected' | 'pending';
  paid_at: string;
}

export interface RaffleStats {
  total: number;
  disponibles: number;
  reservados: number;
  pagados: number;
  totalRecaudado: number;
  totalCompradores: number;
  porcentajeVendido: number;
}
