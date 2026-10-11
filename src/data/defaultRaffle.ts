import type { RaffleInfo, RaffleNumber, RaffleStats, RafflePrize } from '../types';

export const DEFAULT_PRIZES: RafflePrize[] = [
  {
    id: 'prize-1',
    posicion: 1,
    nombre: 'Apple iPhone 16 Pro Max 256GB Titanio + AirPods Pro 2',
    descripcion: 'Equipo nuevo sellado color Titanio Desierto, audífonos AirPods Pro 2da Gen USB-C y $500.000 CLP en efectivo transferible directo.',
    imagen: './assets/images/raffle_hero_prize_1791477047971.jpg',
    valorEstimado: 1600000,
    sorteoGanador: null,
  },
  {
    id: 'prize-2',
    posicion: 2,
    nombre: 'PlayStation 5 Slim 1TB + 2 Controles DualSense',
    descripcion: 'Consola Sony PlayStation 5 Slim edición digital con 2 mandos inalámbricos y garantía oficial.',
    imagen: './assets/images/raffle_prize_detail_1791477059727.jpg',
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

export const DEFAULT_RAFFLE_INFO: RaffleInfo = {
  id: 'raffle-titanium-2026',
  nombre: 'Gran Sorteo 2026',
  descripcion: 'Sorteo oficial exclusivo de 500 números. Cada ticket te da la oportunidad de llevarte el combo tecnológico más codiciado del año con entrega inmediata en todo Chile o retiro presencial garantizado.',
  premio: 'iPhone 16 Pro Max 256GB Titanio + AirPods Pro 2',
  premioDetalle: 'Incluye iPhone 16 Pro Max 256GB color Titanio Desierto sellado, AirPods Pro 2da Generación con estuche MagSafe USB-C, y $500.000 CLP en efectivo transferible de inmediato.',
  imagen: './assets/images/raffle_hero_prize_1791477047971.jpg',
  imagenDetalle: './assets/images/raffle_prize_detail_1791477059727.jpg',
  precio_numero: 2000,
  fecha_sorteo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  estado: 'activa',
  totalNumeros: 500,
  metaRecaudacion: 1000000,
  organizador: 'Fundación & Eventos Pro Chile',
  terminos: 'Bases notariales registradas. Sorteo transmitido en vivo ante notario público al vender el 100% de los números o al cumplir la fecha límite.',
  flowLink: 'https://www.flow.cl/',
  flowApiKey: '27FECD5E-E313-40F9-8AC1-73BB832L658B',
  flowSecretKey: 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb',
  machLink: 'https://app.soymach.com/rF2V/10dplbjf',
  premios: DEFAULT_PRIZES,
  sorteoGanador: null,
};

export function generateDefaultNumbers(): RaffleNumber[] {
  const nums: RaffleNumber[] = [];
  for (let i = 1; i <= 500; i++) {
    const numStr = String(i).padStart(3, '0');
    // Pre-seed a few simulated sales/reservations for realism if needed, or all 500 clean
    let estado: 'disponible' | 'reservado' | 'pagado' = 'disponible';
    let buyerNombre: string | null = null;
    let paidAt: string | null = null;

    // Simulate 35 real paid numbers and 5 reserved so the initial page looks alive
    if ([7, 13, 21, 42, 69, 77, 88, 100, 111, 142, 175, 200, 222, 250, 280, 300, 315, 333, 350, 388, 400, 420, 444, 450, 475, 499, 500, 15, 28, 54, 91, 133, 189, 240, 299].includes(i)) {
      estado = 'pagado';
      buyerNombre = 'Participante Verificado';
      paidAt = new Date(Date.now() - (500 - i) * 60000).toISOString();
    } else if ([3, 50, 120, 370].includes(i)) {
      estado = 'reservado';
    }

    nums.push({
      id: i,
      numero: numStr,
      estado,
      buyer_nombre: buyerNombre,
      paid_at: paidAt,
    });
  }
  return nums;
}

export function computeStatsFromNumbers(numbers: RaffleNumber[], unitPrice = 2000): RaffleStats {
  const total = numbers.length;
  const pagados = numbers.filter((n) => n.estado === 'pagado').length;
  const reservados = numbers.filter((n) => n.estado === 'reservado').length;
  const disponibles = numbers.filter((n) => n.estado === 'disponible').length;
  const totalRecaudado = pagados * unitPrice;
  const porcentajeVendido = total > 0 ? Math.round((pagados / total) * 100) : 0;

  return {
    total,
    disponibles,
    reservados,
    pagados,
    totalRecaudado,
    totalCompradores: pagados,
    porcentajeVendido,
  };
}
