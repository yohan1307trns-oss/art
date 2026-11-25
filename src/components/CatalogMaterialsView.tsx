import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  apiActualizarMaterial,
  apiAgregarMaterial,
  apiEliminarMaterial,
} from '../api/pythonBackendAdapter';
import { FormatoTrabajo, MaterialCatalogo } from '../types/artValue';
import { formatearNumeroCorto } from '../utils/formatters';
import {
  AlertaExito,
  EstadoCargando,
  EstadoError,
  EstadoVacio,
} from './EstadoFeedback';

interface CatalogMaterialsViewProps {
  catalogo: MaterialCatalogo[];
  cargando: boolean;
  errorCarga: string | null;
  onReintentarCarga: () => void;
  onAgregarMaterial: (material: MaterialCatalogo) => void;
  onReemplazarCatalogo: (lista: MaterialCatalogo[]) => void;
}

type FiltroFormato = 'Todos' | FormatoTrabajo;

/**
 * Gestión de catálogo de materiales físicos y digitales conectado a catalogo.py.
 */
export function CatalogMaterialsView({
  catalogo,
  cargando,
  errorCarga,
  onReintentarCarga,
  onAgregarMaterial,
  onReemplazarCatalogo,
}: CatalogMaterialsViewProps) {
  const [filtroFormato, setFiltroFormato] = useState<FiltroFormato>('Todos');
  const [busqueda, setBusqueda] = useState('');

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoFormato, setNuevoFormato] =
    useState<FormatoTrabajo>('Tradicional');
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [editandoClave, setEditandoClave] = useState<string | null>(null);
  const [precioEditado, setPrecioEditado] = useState('');

  const materialesFiltrados = catalogo.filter((item) => {
    const coincideFormato =
      filtroFormato === 'Todos' || item.formato === filtroFormato;
    const coincideTexto = item.nombre
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());
    return coincideFormato && coincideTexto;
  });

  const manejarCrearMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    const precioNum = parseFloat(nuevoPrecio);
    if (!nuevoNombre.trim() || Number.isNaN(precioNum) || precioNum < 0) {
      setMensajeError(
        'Ingresa un nombre válido y un precio en MXN igual o mayor a 0.'
      );
      return;
    }

    setEnviando(true);
    const res = await apiAgregarMaterial(nuevoNombre, precioNum, nuevoFormato);
    setEnviando(false);

    if (!res.ok || !res.datos?.material) {
      setMensajeError(res.mensaje);
      return;
    }

    onAgregarMaterial(res.datos.material);
    setNuevoNombre('');
    setNuevoPrecio('');
    setMensajeExito(res.mensaje);
  };

  const guardarEdicionPrecio = async (id: number, formato: FormatoTrabajo) => {
    const num = parseFloat(precioEditado);
    if (Number.isNaN(num) || num < 0) {
      setMensajeError('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }
    setMensajeError(null);
    const res = await apiActualizarMaterial(id, formato, num);
    if (!res.ok || !res.datos?.materiales) {
      setMensajeError(res.mensaje);
      return;
    }
    onReemplazarCatalogo(res.datos.materiales);
    setEditandoClave(null);
    setMensajeExito(res.mensaje);
  };

  const manejarEliminar = async (id: number, formato: FormatoTrabajo) => {
    setMensajeError(null);
    const res = await apiEliminarMaterial(id, formato);
    if (!res.ok || !res.datos?.materiales) {
      setMensajeError(res.mensaje);
      return;
    }
    onReemplazarCatalogo(res.datos.materiales);
    setMensajeExito(res.mensaje);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(187,167,254,0.16)] pb-6">
        <p className="text-xs font-medium text-[#bba7fe]">
          Inventario del estudio
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[#f4f3f8]">
          Catálogo de materiales físicos y digitales
        </h2>
        <p className="mt-1 text-sm text-[#bba7fe]">
          Consulta, registra y actualiza los precios base para tus cotizaciones
          tradicionales y digitales.
        </p>
      </div>

      {mensajeExito && (
        <AlertaExito
          mensaje={mensajeExito}
          onCerrar={() => setMensajeExito(null)}
        />
      )}

      {mensajeError && (
        <EstadoError
          titulo="Error en el catálogo"
          mensaje={mensajeError}
        />
      )}

      {/* Formulario para registrar nuevo material */}
      <form
        onSubmit={manejarCrearMaterial}
        className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6"
      >
        <h3 className="font-display text-base font-semibold text-[#f4f3f8]">
          Registrar nuevo material
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <label
              htmlFor="catalogo-nombre"
              className="block text-xs font-medium text-[#bba7fe]"
            >
              Nombre del material
            </label>
            <input
              id="catalogo-nombre"
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej. Acuarelas profesionales / Tableta gráfica"
              className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 text-sm text-[#f4f3f8] placeholder-[#bba7fe]/45 focus:border-[#c6ff00] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="catalogo-precio"
              className="block text-xs font-medium text-[#bba7fe]"
            >
              Precio base (MXN)
            </label>
            <input
              id="catalogo-precio"
              type="number"
              min={0}
              step="0.5"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              placeholder="150.00"
              className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="catalogo-formato"
              className="block text-xs font-medium text-[#bba7fe]"
            >
              Formato
            </label>
            <select
              id="catalogo-formato"
              value={nuevoFormato}
              onChange={(e) =>
                setNuevoFormato(e.target.value as FormatoTrabajo)
              }
              className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3 py-2.5 text-sm text-[#f4f3f8] focus:border-[#c6ff00] focus:outline-none"
            >
              <option value="Tradicional">Tradicional</option>
              <option value="Digital">Digital</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#c6ff00] px-4 py-2.5 text-sm font-bold text-[#191820] transition-colors hover:bg-[#b4eb00] disabled:opacity-60 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {enviando ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </form>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filtrar por formato"
          className="inline-flex items-center gap-1 self-start rounded-lg border border-[rgba(187,167,254,0.2)] bg-[#201f29] p-1"
        >
          {(['Todos', 'Tradicional', 'Digital'] as FiltroFormato[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={filtroFormato === tab}
                onClick={() => setFiltroFormato(tab)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  filtroFormato === tab
                    ? 'bg-[#7b3aec] text-white'
                    : 'text-[#bba7fe] hover:text-[#f4f3f8]'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bba7fe]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar material..."
            aria-label="Buscar material en el catálogo"
            className="w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#201f29] py-2 pl-9 pr-3.5 text-sm text-[#f4f3f8] placeholder-[#bba7fe]/55 focus:border-[#c6ff00] focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de catálogo */}
      {cargando && <EstadoCargando filas={5} />}

      {!cargando && errorCarga && (
        <EstadoError
          titulo="Error al cargar el catálogo"
          mensaje={errorCarga}
          onReintentar={onReintentarCarga}
        />
      )}

      {!cargando && !errorCarga && materialesFiltrados.length === 0 && (
        <EstadoVacio
          titulo="No se encontraron materiales"
          descripcion="No hay materiales que coincidan con tu búsqueda actual."
          textoAccion="Mostrar todos"
          onAccion={() => {
            setFiltroFormato('Todos');
            setBusqueda('');
          }}
        />
      )}

      {!cargando && !errorCarga && materialesFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29]">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(187,167,254,0.16)] text-xs font-semibold text-[#bba7fe]">
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Material</th>
                <th className="px-4 py-3.5">Formato</th>
                <th className="px-4 py-3.5 text-right">Precio base (MXN)</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(187,167,254,0.1)]">
              {materialesFiltrados.map((item) => {
                const clave = `${item.formato}-${item.id}`;
                const estaEditando = editandoClave === clave;
                return (
                  <tr
                    key={clave}
                    className="transition-colors duration-100 hover:bg-[#272533]"
                  >
                    <td className="px-4 py-3 font-mono-tabular text-xs font-semibold text-[#bba7fe]">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#f4f3f8]">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          item.formato === 'Digital'
                            ? 'font-semibold text-[#c6ff00]'
                            : 'text-[#bba7fe]'
                        }
                      >
                        {item.formato}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular text-[#f4f3f8]">
                      {estaEditando ? (
                        <div className="inline-flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={precioEditado}
                            onChange={(e) => setPrecioEditado(e.target.value)}
                            className="w-24 rounded border border-[#c6ff00] bg-[#191820] px-2 py-1 text-right text-xs text-[#f4f3f8]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              guardarEdicionPrecio(item.id, item.formato)
                            }
                            className="rounded bg-[#c6ff00] px-2.5 py-1 text-xs font-bold text-[#191820]"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          $ {formatearNumeroCorto(item.precio)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Editar precio de ${item.nombre}`}
                          onClick={() => {
                            setEditandoClave(clave);
                            setPrecioEditado(String(item.precio));
                          }}
                          className="rounded-lg p-2 text-[#bba7fe] transition-colors hover:bg-[#191820] hover:text-[#f4f3f8]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${item.nombre}`}
                          onClick={() =>
                            manejarEliminar(item.id, item.formato)
                          }
                          className="rounded-lg p-2 text-[#bba7fe] transition-colors hover:bg-[#191820] hover:text-[#ff8aa3]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
