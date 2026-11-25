import { SIMBOLOS_DIVISA } from '../data/mockData';
import { Divisa } from '../types/artValue';

/**
 * Formatea montos monetarios con precisión decimal y separación de miles.
 */
export function formatearMoneda(monto: number, divisa: Divisa = 'MXN'): string {
  const simbolo = SIMBOLOS_DIVISA[divisa] ?? '$';
  const decimales = divisa === 'JPY' ? 0 : 2;
  const valorFormateado = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number.isFinite(monto) ? monto : 0);

  return `${simbolo} ${valorFormateado} ${divisa}`;
}

export function formatearNumeroCorto(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(monto) ? monto : 0);
}
