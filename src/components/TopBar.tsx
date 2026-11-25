import { Menu, Plus } from 'lucide-react';
import { SeccionActiva } from '../types/artValue';

interface TopBarProps {
  seccionActiva: SeccionActiva;
  onCambiarSeccion: (seccion: SeccionActiva) => void;
  onAbrirMovil: () => void;
}

const TITULOS_SECCION: Record<SeccionActiva, string> = {
  panel: 'Menú principal',
  cotizador: 'Nueva cotización',
  catalogo: 'Catálogo y materiales',
  operaciones: 'Operaciones y cálculo',
  usuarios: 'Acceso y usuarios',
};

export function TopBar({
  seccionActiva,
  onCambiarSeccion,
  onAbrirMovil,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-[rgba(187,167,254,0.18)] bg-[#191820]/95 px-4 py-3.5 backdrop-blur sm:px-8">
      {/* Zona 1: Contexto actual / Marca en móvil */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onAbrirMovil}
          aria-label="Abrir navegación"
          className="rounded-lg border border-[rgba(187,167,254,0.22)] p-2 text-[#bba7fe] transition-colors hover:border-[#bba7fe] hover:text-[#f4f3f8] lg:hidden shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-display font-semibold text-[#bba7fe] whitespace-nowrap shrink-0">
            Art&amp;Value
          </span>
          <span aria-hidden="true" className="text-[#bba7fe]/45 shrink-0">
            /
          </span>
          <h1 className="truncate font-display font-semibold text-[#f4f3f8]">
            {TITULOS_SECCION[seccionActiva]}
          </h1>
        </div>
      </div>

      {/* Zona 2: Enlaces rápidos de una sola línea */}
      <nav
        aria-label="Accesos rápidos"
        className="hidden md:flex items-center gap-6 text-sm font-medium text-[#bba7fe]"
      >
        <button
          type="button"
          onClick={() => onCambiarSeccion('panel')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#f4f3f8] ${
            seccionActiva === 'panel'
              ? 'text-[#f4f3f8] underline decoration-[#c6ff00] decoration-2 underline-offset-8'
              : ''
          }`}
        >
          Resumen
        </button>
        <button
          type="button"
          onClick={() => onCambiarSeccion('catalogo')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#f4f3f8] ${
            seccionActiva === 'catalogo'
              ? 'text-[#f4f3f8] underline decoration-[#c6ff00] decoration-2 underline-offset-8'
              : ''
          }`}
        >
          Materiales
        </button>
        <button
          type="button"
          onClick={() => onCambiarSeccion('operaciones')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#f4f3f8] ${
            seccionActiva === 'operaciones'
              ? 'text-[#f4f3f8] underline decoration-[#c6ff00] decoration-2 underline-offset-8'
              : ''
          }`}
        >
          Fórmulas
        </button>
        <button
          type="button"
          onClick={() => onCambiarSeccion('usuarios')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#f4f3f8] ${
            seccionActiva === 'usuarios'
              ? 'text-[#f4f3f8] underline decoration-[#c6ff00] decoration-2 underline-offset-8'
              : ''
          }`}
        >
          Usuarios
        </button>
      </nav>

      {/* Zona 3: Acción principal única */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => onCambiarSeccion('cotizador')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c6ff00] px-4 py-2 text-xs font-bold text-[#191820] transition-colors duration-150 hover:bg-[#b4eb00] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva cotización
        </button>
      </div>
    </header>
  );
}
