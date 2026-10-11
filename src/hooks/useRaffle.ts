import { useState, useEffect, useCallback, useRef } from 'react';
import type { RaffleInfo, RaffleNumber, RaffleStats, Order, Payment } from '../types';

export function getOrCreateSessionId(): string {
  let sid = localStorage.getItem('rifa_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('rifa_session_id', sid);
  }
  return sid;
}

export function useRaffle() {
  const [raffle, setRaffle] = useState<RaffleInfo | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [stats, setStats] = useState<RaffleStats>({
    total: 500,
    disponibles: 500,
    reservados: 0,
    pagados: 0,
    totalRecaudado: 0,
    totalCompradores: 0,
    porcentajeVendido: 0,
  });
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);
  const [reservationSecondsLeft, setReservationSecondsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [recentPurchasedOrder, setRecentPurchasedOrder] = useState<{
    order: Order;
    payment: Payment;
    numbers: string[];
  } | null>(null);

  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const selectedNumbersRef = useRef<string[]>([]);
  selectedNumbersRef.current = selectedNumbers;

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [raffleRes, numbersRes] = await Promise.all([
        fetch('/api/raffle'),
        fetch('/api/numbers'),
      ]);

      if (!raffleRes.ok || !numbersRes.ok) {
        throw new Error('Error al cargar datos del servidor');
      }

      const raffleData = await raffleRes.json();
      const numbersData = await numbersRes.json();

      setRaffle(raffleData.raffle);
      setStats(raffleData.stats);
      setNumbers(numbersData.numbers);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor de la rifa.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect Server-Sent Events for real-time live synchronization
  useEffect(() => {
    fetchData();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            const { event, data } = parsed;

            if (event === 'numbers:reserved') {
              const { numbers: reservedNums, sessionId } = data;
              setNumbers((prev) =>
                prev.map((item) =>
                  reservedNums.includes(item.numero)
                    ? {
                        ...item,
                        estado: 'reservado',
                        reserved_by_session: sessionId,
                      }
                    : item
                )
              );

              // If another session reserved one of my selected numbers, remove it from my cart
              if (sessionId !== sessionIdRef.current) {
                setSelectedNumbers((prev) =>
                  prev.filter((num) => !reservedNums.includes(num))
                );
              }
            } else if (event === 'numbers:released' || event === 'numbers:expired') {
              const { numbers: releasedNums } = data;
              setNumbers((prev) =>
                prev.map((item) =>
                  releasedNums.includes(item.numero)
                    ? {
                        ...item,
                        estado: 'disponible',
                        reservation_id: null,
                        reserved_by_session: null,
                      }
                    : item
                )
              );
            } else if (event === 'numbers:purchased') {
              const { numbers: purchasedNums, buyerNombre } = data;
              setNumbers((prev) =>
                prev.map((item) =>
                  purchasedNums.includes(item.numero)
                    ? {
                        ...item,
                        estado: 'pagado',
                        buyer_nombre: buyerNombre,
                      }
                    : item
                )
              );
              // Ensure removed from current cart if was selected
              setSelectedNumbers((prev) =>
                prev.filter((num) => !purchasedNums.includes(num))
              );
            } else if (event === 'stats:updated') {
              setStats(data);
            } else if (event === 'raffle:winner_drawn') {
              setRaffle((prev) => (prev ? { ...prev, sorteoGanador: data } : null));
            } else if (event === 'raffle:prizes_updated') {
              setRaffle((prev) => (prev ? { ...prev, premios: data } : null));
            } else if (event === 'raffle:prize_winner_drawn') {
              const { prizeId, prize, winner } = data;
              setRaffle((prev) => {
                if (!prev) return null;
                const updatedPremios = prev.premios?.map((p) =>
                  p.id === prizeId ? { ...p, sorteoGanador: winner } : p
                ) || [];
                return {
                  ...prev,
                  premios: updatedPremios,
                  sorteoGanador: prize.posicion === 1 ? winner : prev.sorteoGanador,
                };
              });
            } else if (event === 'sync_all') {
              if (data.numbers) setNumbers(data.numbers);
              if (data.stats) setStats(data.stats);
              if (data.raffle) setRaffle(data.raffle);
            }
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Auto reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [fetchData]);

  // Reservation countdown timer
  useEffect(() => {
    if (!reservationExpiresAt) {
      setReservationSecondsLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(reservationExpiresAt).getTime() - Date.now()) / 1000)
      );
      setReservationSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setReservationExpiresAt(null);
        setReservationSecondsLeft(0);
        // Reservation expired, clear local cart
        setSelectedNumbers([]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationExpiresAt]);

  // Toggle selection of a number
  const toggleNumberSelection = useCallback(
    (numero: string) => {
      const numObj = numbers.find((n) => n.numero === numero);
      if (!numObj) return;

      // Disallow paid numbers or numbers reserved by someone else
      if (numObj.estado === 'pagado') return;
      if (
        numObj.estado === 'reservado' &&
        numObj.reserved_by_session &&
        numObj.reserved_by_session !== sessionIdRef.current
      ) {
        return;
      }

      setSelectedNumbers((prev) => {
        if (prev.includes(numero)) {
          return prev.filter((n) => n !== numero);
        } else {
          return [...prev, numero].sort((a, b) => Number(a) - Number(b));
        }
      });
    },
    [numbers]
  );

  // Quick random pick (lucky selector)
  const pickRandomNumbers = useCallback(
    (count: number) => {
      const availableNumbers = numbers.filter(
        (n) =>
          n.estado === 'disponible' &&
          !selectedNumbersRef.current.includes(n.numero)
      );

      if (availableNumbers.length === 0) return;

      // Shuffle available
      const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
      const chosen = shuffled.slice(0, count).map((n) => n.numero);

      setSelectedNumbers((prev) => {
        const set = new Set([...prev, ...chosen]);
        return Array.from(set).sort((a, b) => Number(a) - Number(b));
      });
    },
    [numbers]
  );

  // Clear cart
  const clearSelection = useCallback(async () => {
    if (selectedNumbers.length > 0) {
      try {
        await fetch('/api/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            numbers: selectedNumbers,
          }),
        });
      } catch (err) {
        console.error('Error releasing selection:', err);
      }
    }
    setSelectedNumbers([]);
    setReservationExpiresAt(null);
    setReservationSecondsLeft(null);
  }, [selectedNumbers]);

  // Request reservation lock before checkout
  const reserveSelectedNumbers = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (selectedNumbers.length === 0) {
      return { success: false, error: 'No tienes números seleccionados.' };
    }

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers: selectedNumbers,
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.conflicts && data.conflicts.length > 0) {
          // Remove conflicted numbers from local selection
          setSelectedNumbers((prev) =>
            prev.filter((n) => !data.conflicts.includes(n))
          );
        }
        return { success: false, error: data.error || 'No se pudo reservar' };
      }

      setReservationExpiresAt(data.reservation.expires_at);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Error de conexión al reservar números.' };
    }
  }, [selectedNumbers]);

  // Complete checkout
  const submitCheckout = useCallback(
    async (params: {
      buyer: {
        nombre: string;
        documento: string;
        telefono: string;
        email: string;
      };
      paymentProvider: 'flow' | 'mach_bci' | 'webpay_plus' | 'mercado_pago' | 'transferencia';
    }): Promise<{
      success: boolean;
      order?: Order;
      payment?: Payment;
      flowPayment?: any;
      error?: string;
    }> => {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            numbers: selectedNumbers,
            buyer: params.buyer,
            paymentProvider: params.paymentProvider,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: data.error || 'No se pudo procesar la compra',
          };
        }

        const purchasedResult = {
          order: data.order,
          payment: data.payment,
          numbers: [...selectedNumbers],
        };

        setRecentPurchasedOrder(purchasedResult);
        setSelectedNumbers([]);
        setReservationExpiresAt(null);
        setReservationSecondsLeft(null);

        return {
          success: true,
          order: data.order,
          payment: data.payment,
          flowPayment: data.flowPayment,
        };
      } catch (err) {
        console.error(err);
        return {
          success: false,
          error: 'Error de red al procesar el pago. Por favor intenta nuevamente.',
        };
      }
    },
    [selectedNumbers]
  );

  return {
    raffle,
    numbers,
    stats,
    selectedNumbers,
    reservationExpiresAt,
    reservationSecondsLeft,
    loading,
    error,
    isConnected,
    recentPurchasedOrder,
    sessionId: sessionIdRef.current,
    toggleNumberSelection,
    pickRandomNumbers,
    clearSelection,
    reserveSelectedNumbers,
    submitCheckout,
    setRecentPurchasedOrder,
    refreshData: fetchData,
  };
}
