import crypto from 'crypto';

export interface FlowConfig {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
}

export const DEFAULT_FLOW_CONFIG: FlowConfig = {
  apiKey: '27FECD5E-E313-40F9-8AC1-73BB832L658B',
  secretKey: 'cb34518dcdfef8b61a4a55495faef1c1a50e54eb',
  baseUrl: 'https://www.flow.cl/api',
};

export interface FlowCreatePaymentInput {
  commerceOrder: string;
  subject: string;
  amount: number | string;
  email: string;
  urlConfirmation?: string;
  urlReturn?: string;
  optional?: Record<string, any>;
  paymentMethod?: number; // 9 = all methods (Webpay, MACH, Servipag, Cards)
}

export interface FlowPaymentResult {
  success: boolean;
  token?: string;
  url?: string;
  flowOrder?: number;
  redirectUrl?: string;
  error?: string;
  code?: number;
  raw?: any;
}

/**
 * Signs Flow API request parameters in alphabetical order using HMAC-SHA256
 */
export function signFlowParams(params: Record<string, string | number>, secretKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  let toSign = '';
  for (const k of sortedKeys) {
    toSign += k + params[k];
  }
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

/**
 * Creates an official Flow payment token and redirect link
 */
export async function createFlowPayment(
  input: FlowCreatePaymentInput,
  customConfig?: Partial<FlowConfig>
): Promise<FlowPaymentResult> {
  const apiKey = (customConfig?.apiKey || DEFAULT_FLOW_CONFIG.apiKey).trim();
  const secretKey = (customConfig?.secretKey || DEFAULT_FLOW_CONFIG.secretKey).trim();
  const baseUrl = (customConfig?.baseUrl || DEFAULT_FLOW_CONFIG.baseUrl || 'https://www.flow.cl/api').trim();

  const urlConfirmation = input.urlConfirmation || 'https://gransorteo.cl/api/flow/confirm';
  const urlReturn = input.urlReturn || 'https://gransorteo.cl/api/flow/return';

  const makeRequest = async (emailToUse: string): Promise<any> => {
    const params: Record<string, string | number> = {
      apiKey,
      amount: String(Math.round(Number(input.amount))),
      commerceOrder: input.commerceOrder,
      currency: 'CLP',
      email: emailToUse.trim(),
      subject: input.subject.slice(0, 80),
      urlConfirmation,
      urlReturn,
    };

    if (input.paymentMethod !== undefined) {
      params.paymentMethod = input.paymentMethod;
    }

    const signature = signFlowParams(params, secretKey);
    const postBody = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      s: signature,
    }).toString();

    const response = await fetch(`${baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postBody,
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  };

  try {
    let result = await makeRequest(input.email);

    // If Flow rejects email format/mailbox (error code 1620), retry with official fallback contact mailbox
    if (!result.ok && result.data?.code === 1620) {
      console.warn(`[Flow API] Email "${input.email}" rejected (code 1620). Retrying with contacto@flow.cl fallback...`);
      result = await makeRequest('contacto@flow.cl');
    }

    if (result.ok && result.data?.token && result.data?.url) {
      const redirectUrl = `${result.data.url}?token=${result.data.token}`;
      return {
        success: true,
        token: result.data.token,
        url: result.data.url,
        flowOrder: result.data.flowOrder,
        redirectUrl,
        raw: result.data,
      };
    }

    return {
      success: false,
      error: result.data?.message || `Error en pasarela Flow (${result.status})`,
      code: result.data?.code,
      raw: result.data,
    };
  } catch (err: any) {
    console.error('[Flow API Error]:', err);
    return {
      success: false,
      error: err.message || 'No se pudo conectar con la pasarela Flow.',
    };
  }
}

/**
 * Queries payment status by Flow token
 */
export async function getFlowPaymentStatus(
  token: string,
  customConfig?: Partial<FlowConfig>
): Promise<any> {
  const apiKey = (customConfig?.apiKey || DEFAULT_FLOW_CONFIG.apiKey).trim();
  const secretKey = (customConfig?.secretKey || DEFAULT_FLOW_CONFIG.secretKey).trim();
  const baseUrl = (customConfig?.baseUrl || DEFAULT_FLOW_CONFIG.baseUrl || 'https://www.flow.cl/api').trim();

  try {
    const params: Record<string, string | number> = { apiKey, token };
    const signature = signFlowParams(params, secretKey);
    const url = `${baseUrl}/payment/getStatus?apiKey=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}&s=${signature}`;

    const res = await fetch(url);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
