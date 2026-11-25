import { Divisa, NivelArtista } from '../types/artValue';

/**
 * Constantes de referencia para el cotizador y conversor de divisas.
 */

export const TARIFAS_SUGERIDAS_POR_NIVEL: Record<NivelArtista, number> = {
  Junior: 180,
  'Semi Senior': 290,
  Senior: 450,
};

export const TIPOS_CAMBIO_BASE_MXN: Record<Divisa, number> = {
  MXN: 1,
  USD: 20.15,
  EUR: 21.8,
  JPY: 0.13,
  GBP: 25.4,
  AUD: 13.1,
};

export const SIMBOLOS_DIVISA: Record<Divisa, string> = {
  MXN: '$',
  USD: 'US$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  AUD: 'A$',
};
