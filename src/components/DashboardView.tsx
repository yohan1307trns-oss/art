import { useState } from 'react';
import { ArrowUpRight, Calculator, Eye, Palette, Plus, Trash2 } from 'lucide-react';
import {
  Cotizacion,
  MaterialCatalogo,
  SeccionActiva,
  UsuarioCuenta,
} from '../types/artValue';
import { formatearMoneda, formatearNumeroCorto } from '../utils/formatters';
import {
  EstadoCargando,
  EstadoError,
  EstadoVacio,
} from './EstadoFeedback';

interface DashboardViewProps {
  usuarioActivo: UsuarioCuenta | null;
  cotizaciones: Cotizacion[];
  catalogo: MaterialCatalogo[];
  cargando: boolean;
  errorCarga: string | null;
  onReintentarCarga: () => void;
  onIrASeccion: (seccion: SeccionActiva) => void;
  onIniciarCotizacionFormato: (formato: 'Tradicional' | 'Digital') => void;
  onEliminarCotizacion: (id: string) => void;
}

/**
 * Menú principal del artista conectado a los datos persistidos en Python.
 */
export function DashboardView({
  usuarioActivo,
  cotizaciones,
  catalogo,
  cargando,
  errorCarga,
  onReintentarCarga,
  onIrASeccion,
  onIniciarCotizacionFormato,
  onEliminarCotizacion,
}: DashboardViewProps) {
  const [cotizacionSeleccionada, setCotizacionSeleccionada] =
    useState<Cotizacion | null>(null);

  const totalAcumuladoMxn = cotizaciones.reduce(
    (acc, c) => acc + c.totalMxn,
    0
  );
  const promedioHora =
    cotizaciones.length > 0
      ? cotizaciones.reduce((acc, c) => acc + c.precioHoraMxn, 0) /
        cotizaciones.length
      : usuarioActivo?.tarifaBaseMxn ?? 0;

  const tradicionalesCount = catalogo.filter(
    (m) => m.formato === 'Tradicional'
  ).length;
  const digitalesCount = catalogo.filter((m) => m.formato === 'Digital').length;

  return (
    <div className="space-y-8">
      {/* Encabezado de bienvenida */}
      <section className="flex flex-col gap-4 border-b border-[rgba(187,167,254,0.16)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-[#bba7fe]">
            Menú del artista
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#f4f3f8] text-balance">
            {usuarioActivo
              ? `Bienvenido, ${usuarioActivo.nombre}`
              : 'Estudio de cotización artística'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#bba7fe]">
            Organiza tus materiales tradicionales y digitales, calcula el valor
            real de tu mano de obra en MXN y genera presupuestos en la divisa de
            tu cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onIrASeccion('cotizador')}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[#c6ff00] px-4 py-2.5 text-sm font-bold text-[#191820] transition-colors hover:bg-[#b4eb00] md:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva cotización
        </button>
      </section>

      {/* Franja de métricas clave */}
      <section
        aria-label="Resumen del estudio"
        className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[rgba(187,167,254,0.18)] bg-[rgba(187,167,254,0.18)] sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="bg-[#201f29] p-5">
          <p className="text-xs font-medium text-[#bba7fe]">
            Total cotizado acumulado
          </p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#c6ff00]">
            $ {formatearNumeroCorto(totalAcumuladoMxn)}
          </p>
          <p className="mt-1 text-xs text-[#bba7fe]/80">Base en pesos MXN</p>
        </div>

        <div className="bg-[#201f29] p-5">
          <p className="text-xs font-medium text-[#bba7fe]">
            Cotizaciones guardadas
          </p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#f4f3f8]">
            {cotizaciones.length}
          </p>
          <p className="mt-1 text-xs text-[#bba7fe]/80">Proyectos activos</p>
        </div>

        <div className="bg-[#201f29] p-5">
          <p className="text-xs font-medium text-[#bba7fe]">
            Tarifa promedio por hora
          </p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#f4f3f8]">
            $ {formatearNumeroCorto(promedioHora)}
          </p>
          <p className="mt-1 text-xs text-[#bba7fe]/80">MXN / hora de trabajo</p>
        </div>

        <div className="bg-[#201f29] p-5">
          <p className="text-xs font-medium text-[#bba7fe]">
            Materiales registrados
          </p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#f4f3f8]">
            {catalogo.length}
          </p>
          <p className="mt-1 text-xs text-[#bba7fe]/80">
            {tradicionalesCount} tradicionales · {digitalesCount} digitales
          </p>
        </div>
      </section>

      {/* Accesos directos a formatos */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
          <div>
            <p className="text-xs font-medium text-[#bba7fe]">
              Formato tradicional
            </p>
            <h3 className="mt-1.5 font-display text-xl font-semibold text-[#f4f3f8]">
              Obra física, lienzo e insumos
            </h3>
            <p className="mt-2 text-sm text-[#bba7fe]">
              Selecciona lápices, pinturas, hojas, lienzo o barniz y promedia
              el costo real cuando tu compra difiera del precio base.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onIniciarCotizacionFormato('Tradicional')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#7b3aec] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#692bd8] whitespace-nowrap shrink-0"
            >
              <Palette className="h-4 w-4" aria-hidden="true" />
              Cotizar tradicional
            </button>
            <button
              type="button"
              onClick={() => onIrASeccion('catalogo')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#bba7fe] transition-colors hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
            >
              Ver catálogo
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
          <div>
            <p className="text-xs font-medium text-[#bba7fe]">
              Formato digital
            </p>
            <h3 className="mt-1.5 font-display text-xl font-semibold text-[#f4f3f8]">
              Ilustración, diseño y plataformas
            </h3>
            <p className="mt-2 text-sm text-[#bba7fe]">
              Calcula tus proyectos digitales contemplando plataformas, horas por
              nivel profesional y conversión directa a moneda extranjera.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onIniciarCotizacionFormato('Digital')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#c6ff00] px-4 py-2.5 text-sm font-bold text-[#191820] transition-colors duration-150 hover:bg-[#b4eb00] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Cotizar digital
            </button>
            <button
              type="button"
              onClick={() => onIrASeccion('operaciones')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#bba7fe] transition-colors hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
            >
              <Calculator className="h-4 w-4" aria-hidden="true" />
              Operaciones
            </button>
          </div>
        </div>
      </section>

      {/* Historial de cotizaciones */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#f4f3f8]">
              Historial de cotizaciones
            </h3>
            <p className="text-xs text-[#bba7fe]">
              Presupuestos calculados y almacenados por el sistema
            </p>
          </div>
        </div>

        {cargando && <EstadoCargando filas={4} />}

        {!cargando && errorCarga && (
          <EstadoError
            titulo="Error al cargar el historial"
            mensaje={errorCarga}
            onReintentar={onReintentarCarga}
          />
        )}

        {!cargando && !errorCarga && cotizaciones.length === 0 && (
          <EstadoVacio
            titulo="Aún no hay cotizaciones guardadas"
            descripcion="Crea tu primera cotización seleccionando materiales tradicionales o digitales, horas trabajadas y divisa de entrega."
            textoAccion="Crear primera cotización"
            onAccion={() => onIrASeccion('cotizador')}
          />
        )}

        {!cargando && !errorCarga && cotizaciones.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29]">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(187,167,254,0.16)] text-xs font-semibold text-[#bba7fe]">
                  <th className="px-4 py-3.5">Código</th>
                  <th className="px-4 py-3.5">Proyecto y detalles</th>
                  <th className="px-4 py-3.5">Artista</th>
                  <th className="px-4 py-3.5 text-right">Materiales</th>
                  <th className="px-4 py-3.5 text-right">Mano de obra</th>
                  <th className="px-4 py-3.5 text-right">Total MXN</th>
                  <th className="px-4 py-3.5 text-right">Precio sugerido</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(187,167,254,0.1)]">
                {cotizaciones.map((cot) => (
                  <tr
                    key={cot.id}
                    className="transition-colors duration-100 hover:bg-[#272533]"
                  >
                    <td className="px-4 py-3.5 font-mono-tabular text-xs font-semibold text-[#c6ff00] whitespace-nowrap">
                      {cot.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#f4f3f8]">
                        {cot.tituloProyecto}
                      </p>
                      <p className="mt-0.5 text-xs text-[#bba7fe]">
                        {cot.formato}
                        <span aria-hidden="true"> · </span>
                        {cot.nivel}
                        <span aria-hidden="true"> · </span>
                        {cot.metodoPago}
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono-tabular">{cot.fechaISO}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[#f4f3f8] whitespace-nowrap">
                      {cot.artista}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular text-[#bba7fe] whitespace-nowrap">
                      $ {formatearNumeroCorto(cot.costoMaterialesMxn)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular text-[#bba7fe] whitespace-nowrap">
                      $ {formatearNumeroCorto(cot.manoObraMxn)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular font-semibold text-[#f4f3f8] whitespace-nowrap">
                      $ {formatearNumeroCorto(cot.totalMxn)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular font-semibold text-[#c6ff00] whitespace-nowrap">
                      {formatearMoneda(cot.precioFinalDivisa, cot.divisa)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCotizacionSeleccionada(cot)}
                          aria-label={`Ver detalle de ${cot.id}`}
                          className="rounded-lg p-2 text-[#bba7fe] transition-colors hover:bg-[#191820] hover:text-[#f4f3f8]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (cotizacionSeleccionada?.id === cot.id) {
                              setCotizacionSeleccionada(null);
                            }
                            onEliminarCotizacion(cot.id);
                          }}
                          aria-label={`Eliminar ${cot.id}`}
                          className="rounded-lg p-2 text-[#bba7fe] transition-colors hover:bg-[#191820] hover:text-[#ff8aa3]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detalle de cotización seleccionada */}
      {cotizacionSeleccionada && (
        <section
          aria-label="Detalle de cotización"
          className="rounded-xl border border-[#7b3aec] bg-[#201f29] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(187,167,254,0.16)] pb-4">
            <div>
              <p className="font-mono-tabular text-xs font-semibold text-[#c6ff00]">
                {cotizacionSeleccionada.id} · {cotizacionSeleccionada.fechaISO}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-[#f4f3f8]">
                {cotizacionSeleccionada.tituloProyecto}
              </h3>
              <p className="mt-1 text-xs text-[#bba7fe]">
                Artista: {cotizacionSeleccionada.artista} · Nivel:{' '}
                {cotizacionSeleccionada.nivel} · Formato:{' '}
                {cotizacionSeleccionada.formato} · Pago:{' '}
                {cotizacionSeleccionada.metodoPago}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCotizacionSeleccionada(null)}
              className="rounded-lg border border-[rgba(187,167,254,0.28)] px-3 py-1.5 text-xs font-semibold text-[#bba7fe] hover:border-[#bba7fe] hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
            >
              Cerrar detalle
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-[#bba7fe]">
                Materiales incluidos ({cotizacionSeleccionada.materiales.length})
              </h4>
              <ul className="mt-3 divide-y divide-[rgba(187,167,254,0.1)] border-t border-b border-[rgba(187,167,254,0.1)]">
                {cotizacionSeleccionada.materiales.map((mat) => (
                  <li
                    key={mat.uid}
                    className="flex items-center justify-between gap-4 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-medium text-[#f4f3f8]">
                        {mat.nombre}
                      </span>
                      <span className="ml-2 text-xs text-[#bba7fe]">
                        ({mat.cantidad} u. ×{' '}
                        <span className="font-mono-tabular">
                          ${formatearNumeroCorto(mat.precioUnitarioAplicado)}
                        </span>
                        {!mat.usoPrecioBase &&
                          mat.precioPagado !== null &&
                          ` promedio entre base $${mat.precioBase} y pagado $${mat.precioPagado}`}
                        )
                      </span>
                    </div>
                    <span className="font-mono-tabular font-semibold text-[#f4f3f8]">
                      $ {formatearNumeroCorto(mat.subtotalMxn)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5 border-t border-[rgba(187,167,254,0.14)] pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#bba7fe]">Materiales</span>
                <span className="font-mono-tabular text-[#f4f3f8]">
                  $ {formatearNumeroCorto(cotizacionSeleccionada.costoMaterialesMxn)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#bba7fe]">
                  Mano de obra ({cotizacionSeleccionada.horas} h)
                </span>
                <span className="font-mono-tabular text-[#f4f3f8]">
                  $ {formatearNumeroCorto(cotizacionSeleccionada.manoObraMxn)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#bba7fe]">Costos extra</span>
                <span className="font-mono-tabular text-[#f4f3f8]">
                  $ {formatearNumeroCorto(cotizacionSeleccionada.costosExtraMxn)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[rgba(187,167,254,0.16)] pt-2.5 text-sm font-semibold">
                <span className="text-[#f4f3f8]">Total en MXN</span>
                <span className="font-mono-tabular text-[#f4f3f8]">
                  $ {formatearNumeroCorto(cotizacionSeleccionada.totalMxn)} MXN
                </span>
              </div>
              <div className="flex justify-between rounded-lg bg-[#c6ff00] px-3 py-2.5 text-sm font-bold text-[#191820]">
                <span>Precio sugerido</span>
                <span className="font-mono-tabular">
                  {formatearMoneda(
                    cotizacionSeleccionada.precioFinalDivisa,
                    cotizacionSeleccionada.divisa
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
