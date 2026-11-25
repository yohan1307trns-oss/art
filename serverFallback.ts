import fs from 'node:fs';
import path from 'node:path';

/**
 * Respaldo en Node.js sobre los mismos archivos /backend/*.txt y cotizaciones.json
 * en caso de que la computadora local no tenga Python 3 instalado en el sistema.
 * Replica exactamente las reglas de archivos.py, catalogo.py, materiales.py y operaciones.py.
 */

interface MaterialItem {
  id: number;
  nombre: string;
  precio: number;
  formato: 'Tradicional' | 'Digital';
  fuenteArchivo: string;
}

interface CotizacionItem {
  id: string;
  tituloProyecto: string;
  artista: string;
  fechaISO: string;
  nivel: string;
  precioHoraMxn: number;
  horas: number;
  metodoPago: string;
  divisa: string;
  tipoCambioMxn: number;
  formato: string;
  materiales: Array<Record<string, unknown>>;
  costoMaterialesMxn: number;
  manoObraMxn: number;
  costosExtraMxn: number;
  totalMxn: number;
  precioFinalDivisa: number;
}

function leerMaterialesTxt(
  ruta: string,
  formato: 'Tradicional' | 'Digital'
): MaterialItem[] {
  if (!fs.existsSync(ruta)) return [];
  const contenido = fs.readFileSync(ruta, 'utf-8');
  const lista: MaterialItem[] = [];
  let idx = 1;
  for (const linea of contenido.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || !limpia.includes(',')) continue;
    const comaIdx = limpia.indexOf(',');
    const nombre = limpia.slice(0, comaIdx).trim();
    const precio = Number(limpia.slice(comaIdx + 1).trim());
    if (Number.isNaN(precio)) continue;
    lista.push({
      id: idx++,
      nombre,
      precio,
      formato,
      fuenteArchivo: path.basename(ruta),
    });
  }
  return lista;
}

function escribirMaterialesTxt(ruta: string, items: MaterialItem[]) {
  const lineas = items.map((m) => `${m.nombre},${m.precio}`);
  fs.writeFileSync(ruta, lineas.join('\n') + (lineas.length ? '\n' : ''), 'utf-8');
}

function leerCotizaciones(rutaCot: string): CotizacionItem[] {
  if (fs.existsSync(rutaCot)) {
    return JSON.parse(fs.readFileSync(rutaCot, 'utf-8')) as CotizacionItem[];
  }
  const iniciales: CotizacionItem[] = [
    {
      id: 'COT-1042',
      tituloProyecto: 'Retrato acrílico sobre lienzo 60x80',
      artista: 'Koko',
      fechaISO: '2026-11-22',
      nivel: 'Semi Senior',
      precioHoraMxn: 280,
      horas: 14,
      metodoPago: 'Transferencia',
      divisa: 'MXN',
      tipoCambioMxn: 1,
      formato: 'Tradicional',
      materiales: [
        {
          uid: 'seed-1',
          materialId: 4,
          nombre: 'Lienzo',
          precioBase: 150,
          usoPrecioBase: false,
          precioPagado: 210,
          precioUnitarioAplicado: 180,
          cantidad: 1,
          subtotalMxn: 180,
        },
        {
          uid: 'seed-2',
          materialId: 2,
          nombre: 'Pintura',
          precioBase: 50,
          usoPrecioBase: true,
          precioPagado: null,
          precioUnitarioAplicado: 50,
          cantidad: 4,
          subtotalMxn: 200,
        },
        {
          uid: 'seed-3',
          materialId: 5,
          nombre: 'Barniz',
          precioBase: 80,
          usoPrecioBase: true,
          precioPagado: null,
          precioUnitarioAplicado: 80,
          cantidad: 1,
          subtotalMxn: 80,
        },
      ],
      costoMaterialesMxn: 460,
      manoObraMxn: 3920,
      costosExtraMxn: 150,
      totalMxn: 4530,
      precioFinalDivisa: 4530,
    },
    {
      id: 'COT-1041',
      tituloProyecto: 'Ilustración editorial y portada conceptual',
      artista: 'Yohan',
      fechaISO: '2026-11-20',
      nivel: 'Senior',
      precioHoraMxn: 450,
      horas: 18,
      metodoPago: 'Transferencia',
      divisa: 'USD',
      tipoCambioMxn: 20.15,
      formato: 'Digital',
      materiales: [
        {
          uid: 'seed-4',
          materialId: 1,
          nombre: 'Plataformas',
          precioBase: 950,
          usoPrecioBase: true,
          precioPagado: null,
          precioUnitarioAplicado: 950,
          cantidad: 1,
          subtotalMxn: 950,
        },
      ],
      costoMaterialesMxn: 950,
      manoObraMxn: 8100,
      costosExtraMxn: 220,
      totalMxn: 9270,
      precioFinalDivisa: 460.05,
    },
  ];
  fs.writeFileSync(rutaCot, JSON.stringify(iniciales, null, 2), 'utf-8');
  return iniciales;
}

export function ejecutarFallbackNode(
  backendDir: string,
  action: string,
  payload: Record<string, unknown> = {}
): Record<string, unknown> {
  const usuariosPath = path.join(backendDir, 'usuarios.txt');
  const matTradPath = path.join(backendDir, 'materiales.txt');
  const matDigPath = path.join(backendDir, 'materiales_digital.txt');
  const cotPath = path.join(backendDir, 'cotizaciones.json');

  const leerUsuariosRaw = () => {
    if (!fs.existsSync(usuariosPath)) return [] as Array<[string, string]>;
    return fs
      .readFileSync(usuariosPath, 'utf-8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.includes(','))
      .map((l) => {
        const i = l.indexOf(',');
        return [l.slice(0, i).trim(), l.slice(i + 1)] as [string, string];
      });
  };

  if (action === 'login') {
    const nombre = String(payload.nombre ?? '').trim();
    const contrasena = String(payload.contrasena ?? '');
    const match = leerUsuariosRaw().find(
      ([u, p]) => u === nombre && p === contrasena
    );
    if (!match) {
      return { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };
    }
    const esYohan = nombre.toLowerCase() === 'yohan';
    return {
      ok: true,
      mensaje: '¡Inicio de sesión correcto!',
      usuario: {
        nombre,
        nivelHabitual: esYohan ? 'Senior' : 'Semi Senior',
        tarifaBaseMxn: esYohan ? 450 : 280,
        formatoPrincipal: esYohan ? 'Digital' : 'Tradicional',
        fechaRegistro: '2026-02-14',
      },
    };
  }

  if (action === 'register') {
    const nombre = String(payload.nombre ?? '').trim();
    const contrasena = String(payload.contrasena ?? '');
    if (!nombre || !contrasena) {
      return {
        ok: false,
        mensaje: 'El nombre de usuario y la contraseña no pueden estar vacíos.',
      };
    }
    if (nombre.includes(',') || contrasena.includes(',')) {
      return {
        ok: false,
        mensaje: 'No se permiten comas en el usuario o contraseña.',
      };
    }
    const lista = leerUsuariosRaw();
    if (lista.some(([u]) => u === nombre)) {
      return { ok: false, mensaje: 'Ese usuario ya existe.' };
    }
    const actual = fs.existsSync(usuariosPath)
      ? fs.readFileSync(usuariosPath, 'utf-8')
      : '';
    const prefijo = actual.length > 0 && !actual.endsWith('\n') ? '\n' : '';
    fs.appendFileSync(usuariosPath, `${prefijo}${nombre},${contrasena}\n`, 'utf-8');
    return {
      ok: true,
      mensaje: '¡Usuario registrado correctamente!',
      usuario: {
        nombre,
        nivelHabitual: 'Junior',
        tarifaBaseMxn: 180,
        formatoPrincipal: 'Digital',
        fechaRegistro: new Date().toISOString().slice(0, 10),
      },
    };
  }

  if (action === 'list_users') {
    const usuarios = leerUsuariosRaw().map(([nombre]) => {
      const esYohan = nombre.toLowerCase() === 'yohan';
      return {
        nombre,
        nivelHabitual: esYohan ? 'Senior' : 'Semi Senior',
        tarifaBaseMxn: esYohan ? 450 : 280,
        formatoPrincipal: esYohan ? 'Digital' : 'Tradicional',
        fechaRegistro: '2026-02-14',
      };
    });
    return { ok: true, usuarios };
  }

  if (action === 'get_catalog') {
    return {
      ok: true,
      materiales: [
        ...leerMaterialesTxt(matTradPath, 'Tradicional'),
        ...leerMaterialesTxt(matDigPath, 'Digital'),
      ],
    };
  }

  if (action === 'add_material') {
    const nombre = String(payload.nombre ?? '').trim();
    const formato =
      payload.formato === 'Digital' ? 'Digital' : 'Tradicional';
    const precio = Number(payload.precio ?? 0);
    if (!nombre || Number.isNaN(precio) || precio < 0) {
      return {
        ok: false,
        mensaje: 'Ingresa un nombre válido y precio mayor o igual a 0.',
      };
    }
    const ruta = formato === 'Digital' ? matDigPath : matTradPath;
    const actuales = leerMaterialesTxt(ruta, formato);
    const nuevoId = actuales.length > 0 ? Math.max(...actuales.map((m) => m.id)) + 1 : 1;
    const nuevo: MaterialItem = {
      id: nuevoId,
      nombre,
      precio,
      formato,
      fuenteArchivo: path.basename(ruta),
    };
    escribirMaterialesTxt(ruta, [...actuales, nuevo]);
    return {
      ok: true,
      mensaje: `Material '${nombre}' registrado con ID ${nuevoId}.`,
      material: nuevo,
    };
  }

  if (action === 'update_material') {
    const id = Number(payload.id ?? 0);
    const formato =
      payload.formato === 'Digital' ? 'Digital' : 'Tradicional';
    const precio = Number(payload.precio ?? 0);
    const ruta = formato === 'Digital' ? matDigPath : matTradPath;
    const actuales = leerMaterialesTxt(ruta, formato);
    const idx = actuales.findIndex((m) => m.id === id);
    if (idx === -1) return { ok: false, mensaje: 'Material no encontrado.' };
    actuales[idx].precio = precio;
    escribirMaterialesTxt(ruta, actuales);
    return {
      ok: true,
      mensaje: 'Precio actualizado correctamente.',
      materiales: [
        ...leerMaterialesTxt(matTradPath, 'Tradicional'),
        ...leerMaterialesTxt(matDigPath, 'Digital'),
      ],
    };
  }

  if (action === 'delete_material') {
    const id = Number(payload.id ?? 0);
    const formato =
      payload.formato === 'Digital' ? 'Digital' : 'Tradicional';
    const ruta = formato === 'Digital' ? matDigPath : matTradPath;
    const actuales = leerMaterialesTxt(ruta, formato);
    const filtrados = actuales.filter((m) => m.id !== id);
    if (filtrados.length === actuales.length) {
      return { ok: false, mensaje: 'Material no encontrado.' };
    }
    escribirMaterialesTxt(ruta, filtrados);
    return {
      ok: true,
      mensaje: 'Material eliminado del catálogo.',
      materiales: [
        ...leerMaterialesTxt(matTradPath, 'Tradicional'),
        ...leerMaterialesTxt(matDigPath, 'Digital'),
      ],
    };
  }

  if (action === 'list_quotes') {
    return { ok: true, cotizaciones: leerCotizaciones(cotPath) };
  }

  if (action === 'save_quote') {
    const tituloProyecto = String(payload.tituloProyecto ?? '').trim();
    const artista = String(payload.artista ?? 'Artista').trim();
    const nivel = String(payload.nivel ?? 'Semi Senior');
    const metodoPago = String(payload.metodoPago ?? 'Transferencia');
    const divisa = String(payload.divisa ?? 'MXN').toUpperCase();
    const formato = String(payload.formato ?? 'Tradicional');
    const precioHoraMxn = Number(payload.precioHoraMxn ?? 0);
    const horas = Number(payload.horas ?? 0);
    const costosExtraMxn = Number(payload.costosExtraMxn ?? 0);
    const tipoCambioMxn = Number(payload.tipoCambioMxn ?? 1);
    const materialesReq = Array.isArray(payload.materiales)
      ? (payload.materiales as Array<Record<string, unknown>>)
      : [];

    if (!tituloProyecto || horas <= 0 || precioHoraMxn <= 0) {
      return {
        ok: false,
        mensaje: 'Completa el título, horas dedicadas y precio por hora.',
      };
    }

    let costoMaterialesMxn = 0;
    const materialesProcesados = materialesReq.map((m, idx) => {
      const precioBase = Number(m.precioBase ?? 0);
      const usoPrecioBase = Boolean(m.usoPrecioBase ?? true);
      const precioPagado =
        m.precioPagado === null || m.precioPagado === undefined
          ? null
          : Number(m.precioPagado);
      const cantidad = Number(m.cantidad ?? 0);
      const unitario =
        usoPrecioBase || precioPagado === null
          ? precioBase
          : (precioPagado + precioBase) / 2;
      const subtotal = unitario * cantidad;
      costoMaterialesMxn += subtotal;
      return {
        uid: m.uid ?? `mat-${idx}`,
        materialId: Number(m.materialId ?? idx + 1),
        nombre: String(m.nombre ?? 'Material'),
        precioBase,
        usoPrecioBase,
        precioPagado,
        precioUnitarioAplicado: Math.round(unitario * 100) / 100,
        cantidad,
        subtotalMxn: Math.round(subtotal * 100) / 100,
        esPersonalizado: Boolean(m.esPersonalizado ?? false),
      };
    });

    const manoObraMxn = horas * precioHoraMxn;
    const totalMxn = costoMaterialesMxn + manoObraMxn + costosExtraMxn;
    const precioFinal = divisa === 'MXN' ? totalMxn : totalMxn / tipoCambioMxn;

    const existentes = leerCotizaciones(cotPath);
    const nueva: CotizacionItem = {
      id: `COT-${1043 + existentes.length}`,
      tituloProyecto,
      artista,
      fechaISO: new Date().toISOString().slice(0, 10),
      nivel,
      precioHoraMxn,
      horas,
      metodoPago,
      divisa,
      tipoCambioMxn: divisa === 'MXN' ? 1 : tipoCambioMxn,
      formato,
      materiales: materialesProcesados,
      costoMaterialesMxn: Math.round(costoMaterialesMxn * 100) / 100,
      manoObraMxn: Math.round(manoObraMxn * 100) / 100,
      costosExtraMxn: Math.round(costosExtraMxn * 100) / 100,
      totalMxn: Math.round(totalMxn * 100) / 100,
      precioFinalDivisa: Math.round(precioFinal * 100) / 100,
    };

    existentes.unshift(nueva);
    fs.writeFileSync(cotPath, JSON.stringify(existentes, null, 2), 'utf-8');
    return {
      ok: true,
      mensaje: `Cotización ${nueva.id} guardada correctamente.`,
      cotizacion: nueva,
    };
  }

  if (action === 'delete_quote') {
    const id = String(payload.id ?? '');
    const filtradas = leerCotizaciones(cotPath).filter((c) => c.id !== id);
    fs.writeFileSync(cotPath, JSON.stringify(filtradas, null, 2), 'utf-8');
    return { ok: true, mensaje: 'Cotización eliminada.' };
  }

  if (action === 'operations_calc') {
    const tipo = String(payload.tipo ?? '');
    if (tipo === 'mano_obra') {
      return {
        ok: true,
        resultado:
          Math.round(Number(payload.horas ?? 0) * Number(payload.precioHora ?? 0) * 100) /
          100,
      };
    }
    if (tipo === 'convertir') {
      const cambio = Number(payload.cambio ?? 1);
      if (cambio <= 0) {
        return { ok: false, mensaje: 'El tipo de cambio debe ser > 0.' };
      }
      return {
        ok: true,
        resultado:
          Math.round((Number(payload.total ?? 0) / cambio) * 100) / 100,
      };
    }
    if (tipo === 'promedio_ponderado') {
      const valores = Array.isArray(payload.valores)
        ? (payload.valores as number[]).map(Number)
        : [];
      const pesos = Array.isArray(payload.pesos)
        ? (payload.pesos as number[]).map(Number)
        : [];
      const sumaPesos = pesos.reduce((a, b) => a + b, 0);
      if (sumaPesos === 0 || valores.length !== pesos.length) {
        return { ok: true, resultado: 0 };
      }
      const suma = valores.reduce((a, v, i) => a + v * pesos[i], 0);
      return { ok: true, resultado: Math.round((suma / sumaPesos) * 100) / 100 };
    }
  }

  return { ok: false, mensaje: `Acción no reconocida: ${action}` };
}
