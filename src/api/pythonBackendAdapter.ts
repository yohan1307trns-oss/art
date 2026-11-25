import {
  Cotizacion,
  Divisa,
  FormatoTrabajo,
  MaterialCatalogo,
  RespuestaBackend,
  UsuarioCuenta,
} from '../types/artValue';

/**
 * ============================================================================
 * CLIENTE HTTP / JSON PARA EL BACKEND EN PYTHON ("Art&Value")
 * ============================================================================
 * Todas las peticiones se comunican con /api/* en server.ts, el cual ejecuta
 * directamente los módulos originales en Python dentro de /backend/:
 * - archivos.py (usuarios.txt)
 * - catalogo.py (materiales.txt / materiales_digital.txt)
 * - materiales.py (cálculo de precio promediado)
 * - operaciones.py (mano de obra, total, conversión de divisa y promedio)
 * ============================================================================
 */

async function peticionJson<T>(
  url: string,
  opciones?: RequestInit
): Promise<RespuestaBackend<T>> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
    const data = await res.json();
    return {
      ok: res.ok && data.ok !== false,
      datos: data as T,
      mensaje: data.mensaje || (res.ok ? 'Operación exitosa.' : 'Error en el servidor.'),
      origen: 'api-python',
      codigoHttp: res.status,
    };
  } catch {
    return {
      ok: false,
      mensaje: 'No fue posible establecer conexión con el servidor Python.',
      origen: 'api-python',
      codigoHttp: 503,
    };
  }
}

/**
 * Cálculo inmediato en cliente equivalente a operaciones.py :: calcular_mano_obra
 */
export function calcularManoObra(horas: number, precioHora: number): number {
  return Math.max(0, horas) * Math.max(0, precioHora);
}

/**
 * Cálculo inmediato equivalente a materiales.py :: (precio_nuevo + precio_base) / 2
 */
export function calcularPrecioUnitarioMaterial(
  precioBase: number,
  usoPrecioBase: boolean,
  precioPagado: number | null
): number {
  if (usoPrecioBase || precioPagado === null || Number.isNaN(precioPagado)) {
    return precioBase;
  }
  return (precioPagado + precioBase) / 2;
}

/**
 * Cálculo inmediato equivalente a operaciones.py :: calcular_total
 */
export function calcularTotalMxn(
  costoMateriales: number,
  manoObra: number,
  costosExtra: number
): number {
  return costoMateriales + manoObra + costosExtra;
}

/**
 * Cálculo inmediato equivalente a operaciones.py :: convertir_moneda
 */
export function convertirMoneda(
  totalMxn: number,
  divisa: Divisa,
  tipoCambio: number
): number {
  if (divisa === 'MXN') return totalMxn;
  if (tipoCambio <= 0) return 0;
  return totalMxn / tipoCambio;
}

/**
 * Cálculo inmediato equivalente a operaciones.py :: promedio_ponderado
 */
export function calcularPromedioPonderado(
  valores: number[],
  pesos: number[]
): number {
  const sumaPesos = pesos.reduce((acc, p) => acc + p, 0);
  if (sumaPesos === 0 || valores.length !== pesos.length) return 0;
  const sumaPonderada = valores.reduce(
    (acc, val, idx) => acc + val * pesos[idx],
    0
  );
  return sumaPonderada / sumaPesos;
}

export async function apiIniciarSesion(
  nombre: string,
  contrasena: string
): Promise<RespuestaBackend<{ usuario: UsuarioCuenta }>> {
  return peticionJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nombre, contrasena }),
  });
}

export async function apiRegistrarUsuario(
  nombre: string,
  contrasena: string
): Promise<RespuestaBackend<{ usuario: UsuarioCuenta }>> {
  return peticionJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, contrasena }),
  });
}

export async function apiObtenerUsuarios(): Promise<
  RespuestaBackend<{ usuarios: UsuarioCuenta[] }>
> {
  return peticionJson('/api/usuarios');
}

export async function apiObtenerCatalogo(): Promise<
  RespuestaBackend<{ materiales: MaterialCatalogo[] }>
> {
  return peticionJson('/api/catalogo');
}

export async function apiAgregarMaterial(
  nombre: string,
  precio: number,
  formato: FormatoTrabajo
): Promise<RespuestaBackend<{ material: MaterialCatalogo }>> {
  return peticionJson('/api/catalogo', {
    method: 'POST',
    body: JSON.stringify({ nombre, precio, formato }),
  });
}

export async function apiActualizarMaterial(
  id: number,
  formato: FormatoTrabajo,
  precio: number
): Promise<RespuestaBackend<{ materiales: MaterialCatalogo[] }>> {
  return peticionJson(`/api/catalogo/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ formato, precio }),
  });
}

export async function apiEliminarMaterial(
  id: number,
  formato: FormatoTrabajo
): Promise<RespuestaBackend<{ materiales: MaterialCatalogo[] }>> {
  return peticionJson(
    `/api/catalogo/${id}?formato=${encodeURIComponent(formato)}`,
    { method: 'DELETE' }
  );
}

export async function apiObtenerCotizaciones(): Promise<
  RespuestaBackend<{ cotizaciones: Cotizacion[] }>
> {
  return peticionJson('/api/cotizaciones');
}

export async function apiGuardarCotizacion(
  payload: Omit<Cotizacion, 'id' | 'fechaISO'>
): Promise<RespuestaBackend<{ cotizacion: Cotizacion }>> {
  return peticionJson('/api/cotizaciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiEliminarCotizacion(
  id: string
): Promise<RespuestaBackend<{ ok: boolean }>> {
  return peticionJson(`/api/cotizaciones/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function apiCalcularOperacion(
  payload: Record<string, unknown>
): Promise<RespuestaBackend<{ resultado: number }>> {
  return peticionJson('/api/operaciones/calcular', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
