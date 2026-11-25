/**
 * Definiciones de tipos para Art&Value.
 * Alineadas directamente con las estructuras de datos del backend modular en Python:
 * - menu.py
 * - catalogo.py
 * - materiales.py
 * - operaciones.py
 * - archivos.py
 */

export type FormatoTrabajo = 'Tradicional' | 'Digital';

export type NivelArtista = 'Junior' | 'Semi Senior' | 'Senior';

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Otro';

export type Divisa = 'MXN' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'AUD';

export type SeccionActiva =
  | 'panel'
  | 'cotizador'
  | 'catalogo'
  | 'operaciones'
  | 'usuarios';

export type EstadoVista = 'normal' | 'cargando' | 'vacio' | 'error';

export interface MaterialCatalogo {
  id: number;
  nombre: string;
  precio: number;
  formato: FormatoTrabajo;
  fuenteArchivo: 'materiales.txt' | 'materiales_digital.txt' | 'catalogo.py';
}

export interface MaterialEnCotizacion {
  uid: string;
  materialId: number;
  nombre: string;
  precioBase: number;
  /** Equivale a respuesta == "s" en materiales.py */
  usoPrecioBase: boolean;
  /** Precio ingresado por el usuario cuando respuesta == "n" */
  precioPagado: number | null;
  /** Resultado de precio_base o (precio_nuevo + precio_base) / 2 */
  precioUnitarioAplicado: number;
  cantidad: number;
  subtotalMxn: number;
  esPersonalizado?: boolean;
}

export interface Cotizacion {
  id: string;
  tituloProyecto: string;
  artista: string;
  fechaISO: string;
  nivel: NivelArtista;
  precioHoraMxn: number;
  horas: number;
  metodoPago: MetodoPago;
  divisa: Divisa;
  tipoCambioMxn: number;
  formato: FormatoTrabajo;
  materiales: MaterialEnCotizacion[];
  costoMaterialesMxn: number;
  manoObraMxn: number;
  costosExtraMxn: number;
  totalMxn: number;
  precioFinalDivisa: number;
}

export interface UsuarioCuenta {
  nombre: string;
  /** Solo usado en modo mock local para simular archivos.py; en producción vive en el backend Python */
  claveDemo?: string;
  nivelHabitual: NivelArtista;
  tarifaBaseMxn: number;
  formatoPrincipal: FormatoTrabajo;
  fechaRegistro: string;
}

export interface RespuestaBackend<T> {
  ok: boolean;
  datos?: T;
  mensaje: string;
  origen: 'mock-local' | 'api-python';
  codigoHttp: number;
}
