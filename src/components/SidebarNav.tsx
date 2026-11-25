import {
  Calculator,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Palette,
  Users,
  X,
} from 'lucide-react';
import { SeccionActiva, UsuarioCuenta } from '../types/artValue';

interface SidebarNavProps {
  seccionActiva: SeccionActiva;
  onCambiarSeccion: (seccion: SeccionActiva) => void;
  usuarioActivo: UsuarioCuenta | null;
  onCerrarSesion: () => void;
  abiertoMovil: boolean;
  onCerrarMovil: () => void;
}

const ELEMENTOS_MENU: {
  id: SeccionActiva;
  etiqueta: string;
  Icono: typeof LayoutDashboard;
}[] = [
  { id: 'panel', etiqueta: 'Menú principal', Icono: LayoutDashboard },
  { id: 'cotizador', etiqueta: 'Nueva cotización', Icono: FileSpreadsheet },
  { id: 'catalogo', etiqueta: 'Catálogo', Icono: Palette },
  { id: 'operaciones', etiqueta: 'Operaciones', Icono: Calculator },
  { id: 'usuarios', etiqueta: 'Mi cuenta', Icono: Users },
];

export function SidebarNav({
  seccionActiva,
  onCambiarSeccion,
  usuarioActivo,
  onCerrarSesion,
  abiertoMovil,
  onCerrarMovil,
}: SidebarNavProps) {
  const contenido = (
    <div className="flex h-full flex-col justify-between bg-[#191820] px-4 py-6 border-r border-[rgba(187,167,254,0.18)]">
      <div>
        <div className="flex items-center justify-between px-2 pb-6 border-b border-[rgba(187,167,254,0.14)]">
          <button
            type="button"
            onClick={() => {
              onCambiarSeccion('panel');
              onCerrarMovil();
            }}
            className="text-left font-display text-2xl font-bold tracking-tight text-[#f4f3f8] whitespace-nowrap shrink-0"
          >
            Art<span className="text-[#c6ff00]">&amp;</span>Value
          </button>
          <button
            type="button"
            onClick={onCerrarMovil}
            aria-label="Cerrar menú lateral"
            className="rounded-lg p-2 text-[#bba7fe] transition-colors hover:bg-[#272533] hover:text-[#f4f3f8] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="mt-6 space-y-1.5">
          {ELEMENTOS_MENU.map(({ id, etiqueta, Icono }) => {
            const activo = seccionActiva === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onCambiarSeccion(id);
                  onCerrarMovil();
                }}
                aria-current={activo ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors duration-150 ${
                  activo
                    ? 'bg-[#7b3aec] text-white'
                    : 'text-[#bba7fe] hover:bg-[#242230] hover:text-[#f4f3f8]'
                }`}
              >
                <Icono
                  className={`h-4 w-4 shrink-0 ${
                    activo
                      ? 'text-[#c6ff00]'
                      : 'text-[#bba7fe] group-hover:text-[#f4f3f8]'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium whitespace-nowrap">
                  {etiqueta}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 border-t border-[rgba(187,167,254,0.14)] pt-5">
        {usuarioActivo ? (
          <div className="space-y-3 px-2">
            <div>
              <p className="text-sm font-semibold text-[#f4f3f8] truncate">
                {usuarioActivo.nombre}
              </p>
              <p className="mt-0.5 text-xs text-[#bba7fe]">
                {usuarioActivo.nivelHabitual}
                <span aria-hidden="true"> · </span>
                <span className="font-mono-tabular">
                  ${usuarioActivo.tarifaBaseMxn}/h
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onCerrarSesion();
                onCerrarMovil();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(187,167,254,0.28)] px-3 py-2 text-xs font-semibold text-[#bba7fe] transition-colors duration-150 hover:border-[#bba7fe] hover:bg-[#242230] hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="px-2">
            <p className="text-xs text-[#bba7fe]">Sin sesión activa</p>
            <button
              type="button"
              onClick={() => {
                onCambiarSeccion('usuarios');
                onCerrarMovil();
              }}
              className="mt-2.5 w-full rounded-lg bg-[#7b3aec] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#692bd8] whitespace-nowrap shrink-0"
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-0 h-screen">{contenido}</div>
      </aside>

      {abiertoMovil && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCerrarMovil}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-72 max-w-[85vw]">
            {contenido}
          </div>
        </div>
      )}
    </>
  );
}
