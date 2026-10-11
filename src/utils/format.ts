export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeLeft(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatRUT(raw: string): string {
  const cleaned = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length <= 1) return cleaned;
  const dv = cleaned.slice(-1);
  let rut = cleaned.slice(0, -1);
  let result = '';
  while (rut.length > 3) {
    result = '.' + rut.slice(-3) + result;
    rut = rut.slice(0, -3);
  }
  return rut + result + '-' + dv;
}
