import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { sseManager } from './sse.ts';
import { createFlowPayment, getFlowPaymentStatus, DEFAULT_FLOW_CONFIG } from './flow.ts';

export const apiRouter = Router();

// GET raffle details & statistics
apiRouter.get('/raffle', (_req: Request, res: Response) => {
  const raffle = db.getRaffle();
  const stats = db.getStats();
  res.json({ raffle, stats });
});

// GET all 500 numbers
apiRouter.get('/numbers', (_req: Request, res: Response) => {
  const numbers = db.getNumbersList();
  res.json({ numbers });
});

// SSE Real-time stream
apiRouter.get('/events', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  sseManager.addClient(clientId, res);
});

// POST reserve numbers (locks for 10 minutes)
apiRouter.post('/reserve', (req: Request, res: Response) => {
  const { numbers, sessionId } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Se requiere sessionId válido.' });
  }

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Debes proporcionar una lista de números.' });
  }

  const result = db.reserveNumbers(numbers, sessionId);

  if (!result.success) {
    return res.status(409).json({
      error: result.error,
      conflicts: result.conflicts,
    });
  }

  res.json({
    success: true,
    reservation: result.reservation,
    stats: db.getStats(),
  });
});

// POST release numbers from reservation
apiRouter.post('/release', (req: Request, res: Response) => {
  const { numbers, sessionId } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Se requiere sessionId.' });
  }

  const result = db.releaseReservation(sessionId, numbers);
  res.json({
    success: true,
    released: result.released,
    stats: db.getStats(),
  });
});

// POST checkout and confirm purchase
apiRouter.post('/checkout', async (req: Request, res: Response) => {
  const { sessionId, numbers, buyer, paymentProvider } = req.body;

  if (!sessionId || !numbers || !buyer) {
    return res.status(400).json({ error: 'Datos incompletos para procesar la compra.' });
  }

  if (!buyer.nombre || !buyer.documento || !buyer.telefono || !buyer.email) {
    return res.status(400).json({ error: 'Todos los datos del comprador son obligatorios.' });
  }

  const validProvider = ['flow', 'mach_bci', 'webpay_plus', 'mercado_pago', 'transferencia'].includes(paymentProvider)
    ? paymentProvider
    : 'flow';

  const result = db.completeCheckout({
    sessionId,
    numbers,
    buyer,
    paymentProvider: validProvider,
  });

  if (!result.success) {
    return res.status(409).json({
      error: result.error,
      conflicts: result.conflicts,
    });
  }

  let flowPayment = null;
  if (validProvider === 'flow') {
    try {
      const raffle = db.getRaffle();
      const flowRes = await createFlowPayment(
        {
          commerceOrder: result.order!.id,
          subject: `Gran Sorteo 2026 - ${numbers.length} números (${numbers.slice(0, 4).join(', ')}${numbers.length > 4 ? '...' : ''})`,
          amount: result.order!.total,
          email: buyer.email,
        },
        {
          apiKey: raffle.flowApiKey || DEFAULT_FLOW_CONFIG.apiKey,
          secretKey: raffle.flowSecretKey || DEFAULT_FLOW_CONFIG.secretKey,
        }
      );
      if (flowRes.success) {
        flowPayment = flowRes;
      } else {
        console.warn('[Checkout] Flow API payment creation warning:', flowRes.error);
        flowPayment = {
          success: false,
          error: flowRes.error,
          redirectUrl: raffle.flowLink || 'https://www.flow.cl/',
        };
      }
    } catch (flowErr: any) {
      console.error('[Checkout] Flow API exception:', flowErr);
    }
  }

  res.json({
    success: true,
    order: result.order,
    payment: result.payment,
    flowPayment,
    numbers,
    stats: db.getStats(),
  });
});

// POST create Flow payment session
apiRouter.post('/flow/create-payment', async (req: Request, res: Response) => {
  const { numbers, amount, buyer, returnUrl } = req.body;
  const raffle = db.getRaffle();
  const orderId = `ORD-FLOW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const flowResult = await createFlowPayment(
      {
        commerceOrder: orderId,
        subject: `Gran Sorteo 2026 - Rifa (${numbers?.length || 1} tickets)`,
        amount: amount || (numbers?.length || 1) * raffle.precio_numero,
        email: buyer?.email || 'contacto@flow.cl',
        urlReturn: returnUrl,
      },
      {
        apiKey: raffle.flowApiKey || DEFAULT_FLOW_CONFIG.apiKey,
        secretKey: raffle.flowSecretKey || DEFAULT_FLOW_CONFIG.secretKey,
      }
    );

    res.json(flowResult);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Flow connection status & public info
apiRouter.get('/flow/status', (_req: Request, res: Response) => {
  const raffle = db.getRaffle();
  const apiKey = raffle.flowApiKey || DEFAULT_FLOW_CONFIG.apiKey;
  res.json({
    connected: true,
    apiKey,
    gateway: 'flow.cl',
    mode: 'production',
    supportedMethods: ['Webpay Plus', 'Tarjetas Crédito/Débito', 'MACH', 'CuentaRUT', 'Servipag'],
  });
});

// POST test connection to Flow API
apiRouter.post('/flow/test-connection', async (req: Request, res: Response) => {
  const { apiKey: testApiKey, secretKey: testSecretKey } = req.body;
  const raffle = db.getRaffle();
  const apiKey = (testApiKey || raffle.flowApiKey || DEFAULT_FLOW_CONFIG.apiKey).trim();
  const secretKey = (testSecretKey || raffle.flowSecretKey || DEFAULT_FLOW_CONFIG.secretKey).trim();

  try {
    const testResult = await createFlowPayment(
      {
        commerceOrder: `TEST-${Date.now()}`,
        subject: 'Prueba de Conexión Flow API',
        amount: 1000,
        email: 'contacto@flow.cl',
      },
      { apiKey, secretKey }
    );

    res.json({
      success: testResult.success,
      connected: testResult.success,
      apiKey,
      message: testResult.success
        ? 'Conexión verificada exitosamente con la API oficial de Flow.'
        : testResult.error,
      token: testResult.token,
      redirectUrl: testResult.redirectUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, connected: false, error: err.message });
  }
});

// GET Flow payment status query
apiRouter.get('/flow/payment-status', async (req: Request, res: Response) => {
  const token = (req.query.token as string) || '';
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token de Flow requerido' });
  }

  const raffle = db.getRaffle();
  const apiKey = (raffle.flowApiKey || DEFAULT_FLOW_CONFIG.apiKey).trim();
  const secretKey = (raffle.flowSecretKey || DEFAULT_FLOW_CONFIG.secretKey).trim();

  try {
    const result = await getFlowPaymentStatus(token, { apiKey, secretKey });
    if (!result.ok) {
      return res.status(400).json({ success: false, error: 'No se pudo obtener el estado en Flow' });
    }

    const flowData = result.data;
    const commerceOrder = flowData?.commerceOrder;
    const status = flowData?.status; // 1 = pending, 2 = paid/approved, 3 = rejected, 4 = cancelled

    let order = commerceOrder ? db.getOrderById(commerceOrder) : null;
    let payment = commerceOrder ? db.getPaymentByOrderId(commerceOrder) : null;

    res.json({
      success: true,
      status,
      statusText: status === 2 ? 'pagado' : status === 1 ? 'pendiente' : status === 3 ? 'rechazado' : 'anulado',
      flowData,
      order,
      payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/flow/confirm (Flow Webhook notification)
apiRouter.post('/flow/confirm', async (req: Request, res: Response) => {
  const token = (req.body.token as string) || (req.query.token as string) || '';
  if (!token) {
    return res.status(400).send('Token no recibido');
  }

  const raffle = db.getRaffle();
  const apiKey = (raffle.flowApiKey || DEFAULT_FLOW_CONFIG.apiKey).trim();
  const secretKey = (raffle.flowSecretKey || DEFAULT_FLOW_CONFIG.secretKey).trim();

  try {
    const statusResult = await getFlowPaymentStatus(token, { apiKey, secretKey });
    console.log('[Flow Webhook Confirm]', statusResult);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[Flow Webhook Error]', err);
    return res.status(500).send('Error');
  }
});

// GET search buyer numbers (ticket verification)
apiRouter.get('/buyer/numbers', (req: Request, res: Response) => {
  const query = (req.query.query as string) || '';
  if (!query || query.trim().length < 3) {
    return res.json({ results: [] });
  }

  const results = db.searchBuyerNumbers(query);
  res.json({ results });
});

// --- ADMIN ROUTES ---

// GET Admin overview data
apiRouter.get('/admin/data', (_req: Request, res: Response) => {
  const data = db.getAdminData();
  res.json(data);
});

// POST admin update number status
apiRouter.post('/admin/numbers/:numero/status', (req: Request, res: Response) => {
  const { numero } = req.params;
  const { action, buyerInfo } = req.body;

  if (!['liberar', 'marcar_pagado', 'cancelar_venta'].includes(action)) {
    return res.status(400).json({ error: 'Acción inválida' });
  }

  const result = db.adminUpdateNumberStatus(numero, action, buyerInfo);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// POST Draw winner
apiRouter.post('/admin/draw-winner', (_req: Request, res: Response) => {
  const result = db.drawWinner();
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// POST save or edit prize
apiRouter.post('/admin/prizes', (req: Request, res: Response) => {
  const { id, posicion, nombre, descripcion, imagen, valorEstimado } = req.body;
  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'El nombre y descripción del premio son requeridos.' });
  }
  const prize = db.savePrize({ id, posicion, nombre, descripcion, imagen, valorEstimado });
  res.json({ success: true, prize });
});

// DELETE prize
apiRouter.delete('/admin/prizes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ok = db.deletePrize(id);
  res.json({ success: ok });
});

// POST Draw winner for specific prize
apiRouter.post('/admin/draw-prize-winner', (req: Request, res: Response) => {
  const { prizeId } = req.body;
  if (!prizeId) {
    return res.status(400).json({ error: 'Se requiere prizeId para el sorteo.' });
  }
  const result = db.drawWinnerForPrize(prizeId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// POST Clear winner for prize
apiRouter.post('/admin/prizes/:id/clear-winner', (req: Request, res: Response) => {
  const { id } = req.params;
  const ok = db.clearPrizeWinner(id);
  res.json({ success: ok });
});

// POST Update Raffle Settings (nombre, precio_numero, machLink, etc.)
apiRouter.post('/admin/raffle-settings', (req: Request, res: Response) => {
  const settings = req.body;
  if (!settings) {
    return res.status(400).json({ error: 'Configuración inválida' });
  }
  const updated = db.updateRaffleSettings(settings);
  res.json({ success: true, raffle: updated });
});

// GET export CSV
apiRouter.get('/admin/export-csv', (_req: Request, res: Response) => {
  const csv = db.exportCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rifa_500_numeros_ventas.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
});

// POST reset state to seed
apiRouter.post('/admin/reset', (_req: Request, res: Response) => {
  db.resetToFreshSeed();
  res.json({ success: true, message: 'Rifa restablecida con datos semilla.' });
});
