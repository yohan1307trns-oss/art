import { useEffect, useState } from 'react';
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  apiAgregarMaterial,
  apiGuardarCotizacion,
  calcularManoObra,
  calcularPrecioUnitarioMaterial,
  calcularTotalMxn,
  convertirMoneda,
} from '../api/pythonBackendAdapter';
import {
  TARIFAS_SUGERIDAS_POR_NIVEL,
  TIPOS_CAMBIO_BASE_MXN,
} from '../data/mockData';
import {
  Cotizacion,
  Divisa,
  FormatoTrabajo,
  MaterialCatalogo,
  MaterialEnCotizacion,
  MetodoPago,
  NivelArtista,
  UsuarioCuenta,
} from '../types/artValue';
import { formatearMoneda, formatearNumeroCorto } from '../utils/formatters';
import { AlertaExito, EstadoError } from './EstadoFeedback';

interface QuoteBuilderViewProps {
  usuarioActivo: UsuarioCuenta | null;
  catalogo: MaterialCatalogo[];
  formatoInicial: FormatoTrabajo;
  onCotizacionGuardada: (cotizacion: Cotizacion) => void;
  onAgregarMaterialCatalogo: (nuevo: MaterialCatalogo) => void;
}

const NIVELES: NivelArtista[] = ['Junior', 'Semi Senior', 'Senior'];
const METODOS_PAGO: MetodoPago[] = ['Efectivo', 'Transferencia', 'Otro'];
const DIVISAS: Divisa[] = ['MXN', 'USD', 'EUR', 'JPY', 'GBP', 'AUD'];
const MAX_MATERIALES_PERSONALIZADOS = 20;

export function QuoteBuilderView({
  usuarioActivo,
  catalogo,
  formatoInicial,
  onCotizacionGuardada,
  onAgregarMaterialCatalogo,
}: QuoteBuilderViewProps) {
  const [tituloProyecto, setTituloProyecto] = useState(
    'Comisión personalizada de ilustración'
  );
  const [nivel, setNivel] = useState<NivelArtista>(
    usuarioActivo?.nivelHabitual ?? 'Semi Senior'
  );
  const [precioHoraMxn, setPrecioHoraMxn] = useState<number>(
    usuarioActivo?.tarifaBaseMxn ?? TARIFAS_SUGERIDAS_POR_NIVEL['Semi Senior']
  );
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Transferencia');
  const [divisa, setDivisa] = useState<Divisa>('MXN');
  const [tipoCambio, setTipoCambio] = useState<number>(
    TIPOS_CAMBIO_BASE_MXN.MXN
  );
  const [formato, setFormato] = useState<FormatoTrabajo>(formatoInicial);
  const [horas, setHoras] = useState<number>(8);
  const [costosExtraMxn, setCostosExtraMxn] = useState<number>(0);

  const materialesDelFormato = catalogo.filter((m) => m.formato === formato);
  const [materialSeleccionadoId, setMaterialSeleccionadoId] = useState<number>(
    materialesDelFormato[0]?.id ?? 1
  );
  const [usoPrecioBase, setUsoPrecioBase] = useState<boolean>(true);
  const [precioPagadoInput, setPrecioPagadoInput] = useState<string>('');
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [materialesCotizacion, setMaterialesCotizacion] = useState<
    MaterialEnCotizacion[]
  >([]);

  const [mostrarFormPersonalizado, setMostrarFormPersonalizado] =
    useState(false);
  const [nombrePersonalizado, setNombrePersonalizado] = useState('');
  const [precioPersonalizado, setPrecioPersonalizado] = useState('');
  const [cantidadPersonalizada, setCantidadPersonalizada] = useState(1);
  const [guardandoMaterial, setGuardandoMaterial] = useState(false);
  const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);

  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    setFormato(formatoInicial);
  }, [formatoInicial]);

  useEffect(() => {
    const lista = catalogo.filter((m) => m.formato === formato);
    if (lista.length > 0 && !lista.some((m) => m.id === materialSeleccionadoId)) {
      setMaterialSeleccionadoId(lista[0].id);
    }
  }, [formato, catalogo, materialSeleccionadoId]);

  const materialActual = materialesDelFormato.find(
    (m) => m.id === materialSeleccionadoId
  );

  const personalizadosUsados = materialesCotizacion.filter(
    (m) => m.esPersonalizado
  ).length;

  const costoMaterialesMxn = materialesCotizacion.reduce(
    (acc, item) => acc + item.subtotalMxn,
    0
  );
  const manoObraMxn = calcularManoObra(horas, precioHoraMxn);
  const totalMxn = calcularTotalMxn(
    costoMaterialesMxn,
    manoObraMxn,
    costosExtraMxn
  );
  const precioFinalDivisa = convertirMoneda(totalMxn, divisa, tipoCambio);

  const manejarCambioNivel = (nuevoNivel: NivelArtista) => {
    setNivel(nuevoNivel);
    setPrecioHoraMxn(TARIFAS_SUGERIDAS_POR_NIVEL[nuevoNivel]);
  };

  const manejarCambioDivisa = (nuevaDivisa: Divisa) => {
    setDivisa(nuevaDivisa);
    setTipoCambio(TIPOS_CAMBIO_BASE_MXN[nuevaDivisa]);
  };

  const manejarAgregarDelCatalogo = () => {
    setMensajeError(null);
    if (!materialActual) {
      setMensajeError('Selecciona un material válido del catálogo.');
      return;
    }
    if (cantidadInput <= 0) {
      setMensajeError('La cantidad utilizada debe ser mayor a cero.');
      return;
    }

    const precioPagadoNum = usoPrecioBase
      ? null
      : parseFloat(precioPagadoInput);

    if (
      !usoPrecioBase &&
      (precioPagadoNum === null ||
        Number.isNaN(precioPagadoNum) ||
        precioPagadoNum < 0)
    ) {
      setMensajeError(
        'Ingresa el precio real que pagaste para promediarlo con el precio base.'
      );
      return;
    }

    const precioUnitario = calcularPrecioUnitarioMaterial(
      materialActual.precio,
      usoPrecioBase,
      precioPagadoNum
    );

    const nuevoItem: MaterialEnCotizacion = {
      uid: `mat-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      materialId: materialActual.id,
      nombre: materialActual.nombre,
      precioBase: materialActual.precio,
      usoPrecioBase,
      precioPagado: precioPagadoNum,
      precioUnitarioAplicado: precioUnitario,
      cantidad: cantidadInput,
      subtotalMxn: precioUnitario * cantidadInput,
    };

    setMaterialesCotizacion((prev) => [...prev, nuevoItem]);
    setCantidadInput(1);
    setPrecioPagadoInput('');
    setUsoPrecioBase(true);
  };

  const manejarAgregarPersonalizado = async () => {
    setMensajeError(null);
    if (personalizadosUsados >= MAX_MATERIALES_PERSONALIZADOS) {
      setMensajeError(
        `Alcanzaste el máximo de ${MAX_MATERIALES_PERSONALIZADOS} materiales adicionales por cotización.`
      );
      return;
    }

    const precioNum = parseFloat(precioPersonalizado);
    if (!nombrePersonalizado.trim() || Number.isNaN(precioNum) || precioNum < 0) {
      setMensajeError(
        'Ingresa el nombre y un precio válido en MXN para el material.'
      );
      return;
    }
    if (cantidadPersonalizada <= 0) {
      setMensajeError('La cantidad del material debe ser mayor a cero.');
      return;
    }

    setGuardandoMaterial(true);
    const respuesta = await apiAgregarMaterial(
      nombrePersonalizado,
      precioNum,
      formato
    );
    setGuardandoMaterial(false);

    if (!respuesta.ok || !respuesta.datos?.material) {
      setMensajeError(respuesta.mensaje);
      return;
    }

    const matCreado = respuesta.datos.material;
    onAgregarMaterialCatalogo(matCreado);

    const nuevoItem: MaterialEnCotizacion = {
      uid: `custom-${Date.now()}`,
      materialId: matCreado.id,
      nombre: matCreado.nombre,
      precioBase: matCreado.precio,
      usoPrecioBase: true,
      precioPagado: null,
      precioUnitarioAplicado: matCreado.precio,
      cantidad: cantidadPersonalizada,
      subtotalMxn: matCreado.precio * cantidadPersonalizada,
      esPersonalizado: true,
    };

    setMaterialesCotizacion((prev) => [...prev, nuevoItem]);
    setNombrePersonalizado('');
    setPrecioPersonalizado('');
    setCantidadPersonalizada(1);
    setMostrarFormPersonalizado(false);
    setMensajeExito(respuesta.mensaje);
  };

  const manejarGuardarCotizacion = async () => {
    setMensajeError(null);
    setMensajeExito(null);

    if (!tituloProyecto.trim()) {
      setMensajeError('Asigna un título al proyecto antes de guardar.');
      return;
    }
    if (horas <= 0 || precioHoraMxn <= 0) {
      setMensajeError(
        'Las horas dedicadas y el precio por hora deben ser mayores a cero.'
      );
      return;
    }
    if (divisa !== 'MXN' && tipoCambio <= 0) {
      setMensajeError('El tipo de cambio debe ser mayor a cero.');
      return;
    }

    setGuardandoCotizacion(true);
    const respuesta = await apiGuardarCotizacion({
      tituloProyecto: tituloProyecto.trim(),
      artista: usuarioActivo?.nombre ?? 'Artista invitado',
      nivel,
      precioHoraMxn,
      horas,
      metodoPago,
      divisa,
      tipoCambioMxn: divisa === 'MXN' ? 1 : tipoCambio,
      formato,
      materiales: materialesCotizacion,
      costoMaterialesMxn,
      manoObraMxn,
      costosExtraMxn,
      totalMxn,
      precioFinalDivisa,
    });
    setGuardandoCotizacion(false);

    if (!respuesta.ok || !respuesta.datos?.cotizacion) {
      setMensajeError(respuesta.mensaje);
      return;
    }

    const cotGuardada = respuesta.datos.cotizacion;
    onCotizacionGuardada(cotGuardada);
    setMensajeExito(
      `Cotización ${cotGuardada.id} guardada correctamente (${formatearMoneda(
        cotGuardada.precioFinalDivisa,
        cotGuardada.divisa
      )}).`
    );
  };

  const manejarReiniciar = () => {
    setTituloProyecto('Nuevo proyecto artístico');
    setHoras(8);
    setCostosExtraMxn(0);
    setMaterialesCotizacion([]);
    setMensajeExito(null);
    setMensajeError(null);
  };

  const precioPreviewUnitario = materialActual
    ? calcularPrecioUnitarioMaterial(
        materialActual.precio,
        usoPrecioBase,
        usoPrecioBase ? null : parseFloat(precioPagadoInput)
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-[rgba(187,167,254,0.16)] pb-5">
        <p className="text-xs font-medium text-[#bba7fe]">
          Asistente de cálculo
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[#f4f3f8]">
          Nueva cotización de proyecto
        </h2>
      </div>

      {mensajeExito && (
        <AlertaExito
          mensaje={mensajeExito}
          onCerrar={() => setMensajeExito(null)}
        />
      )}

      {mensajeError && (
        <EstadoError
          titulo="Revisa los datos de la cotización"
          mensaje={mensajeError}
        />
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:items-start">
        <div className="space-y-8 xl:col-span-7">
          {/* Bloque 1: Parámetros del artista y divisa */}
          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
              1. Parámetros del artista y divisa
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="titulo-proyecto"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Nombre del proyecto o encargo
                </label>
                <input
                  id="titulo-proyecto"
                  type="text"
                  value={tituloProyecto}
                  onChange={(e) => setTituloProyecto(e.target.value)}
                  placeholder="Ej. Ilustración de portada editorial"
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 text-sm text-[#f4f3f8] placeholder-[#bba7fe]/45 focus:border-[#c6ff00] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#bba7fe]">
                  Nivel de trabajo
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-lg border border-[rgba(187,167,254,0.2)] bg-[#191820] p-1">
                  {NIVELES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => manejarCambioNivel(item)}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                        nivel === item
                          ? 'bg-[#7b3aec] text-white'
                          : 'text-[#bba7fe] hover:text-[#f4f3f8]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="precio-hora"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Precio por hora (MXN)
                </label>
                <input
                  id="precio-hora"
                  type="number"
                  min={0}
                  step="10"
                  value={precioHoraMxn}
                  onChange={(e) =>
                    setPrecioHoraMxn(Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="metodo-pago"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Método de pago
                </label>
                <select
                  id="metodo-pago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#bba7fe]">
                  Formato de trabajo
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-lg border border-[rgba(187,167,254,0.2)] bg-[#191820] p-1">
                  {(['Tradicional', 'Digital'] as FormatoTrabajo[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormato(f)}
                      className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                        formato === f
                          ? 'bg-[#7b3aec] text-white'
                          : 'text-[#bba7fe] hover:text-[#f4f3f8]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="divisa-select"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Divisa de cobro
                </label>
                <select
                  id="divisa-select"
                  value={divisa}
                  onChange={(e) => manejarCambioDivisa(e.target.value as Divisa)}
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                >
                  {DIVISAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {divisa !== 'MXN' && (
                <div>
                  <label
                    htmlFor="tipo-cambio"
                    className="block text-xs font-medium text-[#bba7fe]"
                  >
                    Tipo de cambio ({divisa} a MXN)
                  </label>
                  <input
                    id="tipo-cambio"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={tipoCambio}
                    onChange={(e) =>
                      setTipoCambio(Math.max(0.01, Number(e.target.value)))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Bloque 2: Selección de materiales */}
          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
                  2. Materiales ({formato})
                </h3>
                <p className="text-xs text-[#bba7fe]">
                  Si pagaste un precio distinto al catálogo, se calcula el
                  promedio automáticamente.
                </p>
              </div>
              <span className="font-mono-tabular text-xs text-[#bba7fe]">
                Adicionales: {personalizadosUsados}/{MAX_MATERIALES_PERSONALIZADOS}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <label
                  htmlFor="selector-material"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Material del catálogo
                </label>
                <select
                  id="selector-material"
                  value={materialSeleccionadoId}
                  onChange={(e) =>
                    setMaterialSeleccionadoId(Number(e.target.value))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                >
                  {materialesDelFormato.map((mat) => (
                    <option key={`${mat.formato}-${mat.id}`} value={mat.id}>
                      #{mat.id} — {mat.nombre} ($
                      {formatearNumeroCorto(mat.precio)} MXN)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="cantidad-material"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Cantidad usada
                </label>
                <input
                  id="cantidad-material"
                  type="number"
                  min={0.5}
                  step="0.5"
                  value={cantidadInput}
                  onChange={(e) =>
                    setCantidadInput(Math.max(0.1, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <span className="block text-xs font-medium text-[#bba7fe]">
                  ¿Te costó ${materialActual?.precio ?? 0}?
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-[rgba(187,167,254,0.2)] bg-[#191820] p-1">
                  <button
                    type="button"
                    onClick={() => setUsoPrecioBase(true)}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      usoPrecioBase
                        ? 'bg-[#7b3aec] text-white'
                        : 'text-[#bba7fe] hover:text-[#f4f3f8]'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsoPrecioBase(false)}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      !usoPrecioBase
                        ? 'bg-[#7b3aec] text-white'
                        : 'text-[#bba7fe] hover:text-[#f4f3f8]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {!usoPrecioBase && (
                <div className="sm:col-span-12 flex flex-col gap-3 border-t border-[rgba(187,167,254,0.12)] pt-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label
                      htmlFor="precio-pagado"
                      className="block text-xs font-medium text-[#bba7fe]"
                    >
                      Precio real que pagaste (MXN)
                    </label>
                    <input
                      id="precio-pagado"
                      type="number"
                      min={0}
                      step="1"
                      placeholder="Ej. 190"
                      value={precioPagadoInput}
                      onChange={(e) => setPrecioPagadoInput(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                    />
                  </div>
                  <p className="pb-2 text-xs text-[#bba7fe]">
                    Costo unitario promediado:{' '}
                    <span className="font-mono-tabular font-semibold text-[#c6ff00]">
                      $ {formatearNumeroCorto(precioPreviewUnitario)} MXN
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={manejarAgregarDelCatalogo}
                className="inline-flex items-center gap-2 rounded-lg bg-[#7b3aec] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#692bd8] whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar a cotización
              </button>
              <button
                type="button"
                onClick={() =>
                  setMostrarFormPersonalizado((prev) => !prev)
                }
                className="rounded-lg border border-[rgba(187,167,254,0.28)] px-4 py-2.5 text-xs font-semibold text-[#bba7fe] transition-colors hover:border-[#bba7fe] hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
              >
                {mostrarFormPersonalizado
                  ? 'Cancelar material nuevo'
                  : '+ Material no listado'}
              </button>
            </div>

            {mostrarFormPersonalizado && (
              <div className="mt-5 border-t border-[rgba(187,167,254,0.16)] pt-5">
                <p className="text-xs font-semibold text-[#c6ff00]">
                  Registrar nuevo material en el catálogo ({formato})
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="nuevo-mat-nombre"
                      className="block text-xs text-[#bba7fe]"
                    >
                      Nombre del material
                    </label>
                    <input
                      id="nuevo-mat-nombre"
                      type="text"
                      value={nombrePersonalizado}
                      onChange={(e) => setNombrePersonalizado(e.target.value)}
                      placeholder="Ej. Papel algodón 300g"
                      className="mt-1 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3 py-2 text-sm text-[#f4f3f8]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="nuevo-mat-precio"
                      className="block text-xs text-[#bba7fe]"
                    >
                      Precio (MXN)
                    </label>
                    <input
                      id="nuevo-mat-precio"
                      type="number"
                      min={0}
                      value={precioPersonalizado}
                      onChange={(e) => setPrecioPersonalizado(e.target.value)}
                      placeholder="120"
                      className="mt-1 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3 py-2 font-mono-tabular text-sm text-[#f4f3f8]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="nuevo-mat-cantidad"
                      className="block text-xs text-[#bba7fe]"
                    >
                      Cantidad
                    </label>
                    <input
                      id="nuevo-mat-cantidad"
                      type="number"
                      min={0.5}
                      step="0.5"
                      value={cantidadPersonalizada}
                      onChange={(e) =>
                        setCantidadPersonalizada(
                          Math.max(0.1, Number(e.target.value))
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3 py-2 font-mono-tabular text-sm text-[#f4f3f8]"
                    />
                  </div>
                  <div className="flex items-end sm:col-span-2">
                    <button
                      type="button"
                      disabled={guardandoMaterial}
                      onClick={manejarAgregarPersonalizado}
                      className="w-full rounded-lg bg-[#c6ff00] px-3 py-2 text-xs font-bold text-[#191820] transition-colors hover:bg-[#b4eb00] disabled:opacity-60 whitespace-nowrap"
                    >
                      {guardandoMaterial ? 'Guardando...' : 'Registrar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {materialesCotizacion.length > 0 ? (
              <ul className="mt-5 divide-y divide-[rgba(187,167,254,0.12)] border-t border-[rgba(187,167,254,0.12)]">
                {materialesCotizacion.map((item) => (
                  <li
                    key={item.uid}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#f4f3f8]">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-[#bba7fe]">
                        {item.cantidad} u. ×{' '}
                        <span className="font-mono-tabular">
                          ${formatearNumeroCorto(item.precioUnitarioAplicado)}
                        </span>
                        {!item.usoPrecioBase &&
                          item.precioPagado !== null &&
                          ` (promedio base $${item.precioBase} / pagado $${item.precioPagado})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tabular font-semibold text-[#f4f3f8]">
                        $ {formatearNumeroCorto(item.subtotalMxn)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Quitar ${item.nombre}`}
                        onClick={() =>
                          setMaterialesCotizacion((prev) =>
                            prev.filter((m) => m.uid !== item.uid)
                          )
                        }
                        className="rounded-lg p-1.5 text-[#bba7fe] transition-colors hover:bg-[#191820] hover:text-[#ff8aa3]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 border-t border-[rgba(187,167,254,0.12)] pt-4 text-xs text-[#bba7fe]">
                Aún no has agregado materiales a esta cotización. Selecciona uno
                arriba o continúa solo con mano de obra.
              </p>
            )}
          </section>

          {/* Bloque 3: Horas y gastos extra */}
          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
              3. Tiempo invertido y gastos adicionales
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="horas-dedicadas"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Horas dedicadas al proyecto
                </label>
                <input
                  id="horas-dedicadas"
                  type="number"
                  min={0.5}
                  step="0.5"
                  value={horas}
                  onChange={(e) =>
                    setHoras(Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="costos-extra"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Costos extra en MXN (envío, empaque, licencias)
                </label>
                <input
                  id="costos-extra"
                  type="number"
                  min={0}
                  step="10"
                  value={costosExtraMxn}
                  onChange={(e) =>
                    setCostosExtraMxn(Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Columna derecha: Resultado final */}
        <aside className="xl:col-span-5 xl:sticky xl:top-24">
          <div className="rounded-xl border border-[rgba(187,167,254,0.25)] bg-[#201f29] p-6">
            <div className="border-b border-[rgba(187,167,254,0.14)] pb-4">
              <p className="text-xs font-medium text-[#bba7fe]">
                Desglose financiero
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#f4f3f8]">
                Resultado de cotización
              </h3>
              <p className="mt-1 text-xs text-[#bba7fe]">
                {nivel} · {formato} · {metodoPago}
              </p>
            </div>

            <dl className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-[#bba7fe]">
                  Materiales en MXN ({materialesCotizacion.length} ítems)
                </dt>
                <dd className="font-mono-tabular font-medium text-[#f4f3f8]">
                  $ {formatearNumeroCorto(costoMaterialesMxn)}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-[#bba7fe]">
                  Mano de obra ({horas} h × ${formatearNumeroCorto(precioHoraMxn)})
                </dt>
                <dd className="font-mono-tabular font-medium text-[#f4f3f8]">
                  $ {formatearNumeroCorto(manoObraMxn)}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-[#bba7fe]">Costos extra en MXN</dt>
                <dd className="font-mono-tabular font-medium text-[#f4f3f8]">
                  $ {formatearNumeroCorto(costosExtraMxn)}
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-[rgba(187,167,254,0.16)] pt-3.5 text-base font-semibold">
                <dt className="text-[#f4f3f8]">Total en MXN</dt>
                <dd className="font-mono-tabular text-[#f4f3f8]">
                  $ {formatearNumeroCorto(totalMxn)} MXN
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl bg-[#c6ff00] p-5 text-[#191820]">
              <p className="text-xs font-bold">
                Precio sugerido al cliente ({divisa})
              </p>
              <p className="mt-1 font-mono-tabular text-3xl font-bold tracking-tight">
                {formatearMoneda(precioFinalDivisa, divisa)}
              </p>
              {divisa !== 'MXN' && (
                <p className="mt-1.5 font-mono-tabular text-xs font-medium text-[#191820]/80">
                  Tipo de cambio aplicado: 1 {divisa} = {tipoCambio} MXN
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={guardandoCotizacion}
                onClick={manejarGuardarCotizacion}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#7b3aec] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#692bd8] disabled:opacity-60 whitespace-nowrap"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {guardandoCotizacion ? 'Calculando...' : 'Guardar cotización'}
              </button>
              <button
                type="button"
                onClick={manejarReiniciar}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(187,167,254,0.28)] px-4 py-3 text-sm font-semibold text-[#bba7fe] transition-colors hover:border-[#bba7fe] hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Nuevo cálculo
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
