import { AlertTriangle, CheckCircle2, FolderOpen, RefreshCw } from 'lucide-react';

/**
 * Componentes reutilizables para los cuatro estados visuales requeridos:
 * - Cargando (Skeletons fieles a la geometría del contenido)
 * - Vacío (Explicación clara + botón de acción principal)
 * - Error (Mensaje explícito + icono + botón de reintento)
 * - Éxito (Confirmación en verde neón #c6ff00 con texto oscuro #191820)
 */

export function EstadoCargando({ filas = 4 }: { filas?: number }) {
  return (
    <div
      role="status"
      aria-label="Cargando información del servidor"
      className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-44 animate-pulse rounded bg-[#2b2938]" />
        <div className="h-4 w-28 animate-pulse rounded bg-[#2b2938]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: filas }).map((_, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 items-center gap-4 border-t border-[rgba(187,167,254,0.1)] pt-3"
          >
            <div className="col-span-2 h-4 animate-pulse rounded bg-[#2b2938]" />
            <div className="col-span-5 h-4 animate-pulse rounded bg-[#2b2938]" />
            <div className="col-span-3 h-4 animate-pulse rounded bg-[#2b2938]" />
            <div className="col-span-2 h-4 animate-pulse rounded bg-[#2b2938]" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#bba7fe]">
        Sincronizando datos con los módulos de Art&amp;Value...
      </p>
    </div>
  );
}

export function EstadoVacio({
  titulo,
  descripcion,
  textoAccion,
  onAccion,
}: {
  titulo: string;
  descripcion: string;
  textoAccion?: string;
  onAccion?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(187,167,254,0.2)] bg-[#201f29] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(187,167,254,0.25)] bg-[#191820] text-[#bba7fe]">
        <FolderOpen className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
        {titulo}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-[#bba7fe]">{descripcion}</p>
      {textoAccion && onAccion && (
        <button
          type="button"
          onClick={onAccion}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#7b3aec] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#692bd8] whitespace-nowrap shrink-0"
        >
          {textoAccion}
        </button>
      )}
    </div>
  );
}

export function EstadoError({
  titulo = 'No se pudo completar la operación',
  mensaje,
  onReintentar,
}: {
  titulo?: string;
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-xl border border-[#ff6b8b]/45 bg-[#2a1d26] p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-[#ff8aa3]"
          aria-hidden="true"
        />
        <div>
          <h3 className="font-display text-sm font-semibold text-[#ffdce4]">
            {titulo}
          </h3>
          <p className="mt-1 text-sm text-[#f7b7c6]">{mensaje}</p>
        </div>
      </div>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#bba7fe]/40 bg-[#191820] px-4 py-2 text-xs font-semibold text-[#f4f3f8] transition-colors duration-150 hover:border-[#bba7fe] hover:text-[#bba7fe] sm:self-center whitespace-nowrap shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}

export function AlertaExito({
  mensaje,
  onCerrar,
}: {
  mensaje: string;
  onCerrar?: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 rounded-xl bg-[#c6ff00] px-4 py-3 text-[#191820]"
    >
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#191820]" aria-hidden="true" />
        <span>{mensaje}</span>
      </div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-md px-2 py-1 text-xs font-semibold text-[#191820]/80 transition-colors hover:bg-[#191820]/10 hover:text-[#191820] whitespace-nowrap shrink-0"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}
