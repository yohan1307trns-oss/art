import { useState } from 'react';
import { KeyRound, UserCheck, UserPlus } from 'lucide-react';
import {
  apiIniciarSesion,
  apiRegistrarUsuario,
} from '../api/pythonBackendAdapter';
import { UsuarioCuenta } from '../types/artValue';
import { AlertaExito, EstadoError } from './EstadoFeedback';

interface AuthUsersViewProps {
  usuarios: UsuarioCuenta[];
  usuarioActivo: UsuarioCuenta | null;
  onLoginExitoso: (usuario: UsuarioCuenta) => void;
  onRegistrarExitoso: (nuevo: UsuarioCuenta) => void;
  onCerrarSesion: () => void;
}

type ModoAuth = 'login' | 'registro';

/**
 * Gestión de acceso y registro de artistas conectado a archivos.py y usuarios.txt.
 */
export function AuthUsersView({
  usuarios,
  usuarioActivo,
  onLoginExitoso,
  onRegistrarExitoso,
  onCerrarSesion,
}: AuthUsersViewProps) {
  const [modo, setModo] = useState<ModoAuth>('login');
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!nombre.trim() || !contrasena.trim()) {
      setMensajeError('Completa el nombre de usuario y la contraseña.');
      return;
    }

    setCargando(true);
    if (modo === 'login') {
      const res = await apiIniciarSesion(nombre, contrasena);
      setCargando(false);

      if (!res.ok || !res.datos?.usuario) {
        setMensajeError(res.mensaje);
        return;
      }

      onLoginExitoso(res.datos.usuario);
      setMensajeExito(res.mensaje);
      setNombre('');
      setContrasena('');
    } else {
      const res = await apiRegistrarUsuario(nombre, contrasena);
      setCargando(false);

      if (!res.ok || !res.datos?.usuario) {
        setMensajeError(res.mensaje);
        return;
      }

      onRegistrarExitoso(res.datos.usuario);
      setMensajeExito(res.mensaje);
      setModo('login');
      setContrasena('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(187,167,254,0.16)] pb-6">
        <p className="text-xs font-medium text-[#bba7fe]">
          Cuentas de usuario
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[#f4f3f8]">
          Acceso y registro de artistas
        </h2>
        <p className="mt-1 text-sm text-[#bba7fe]">
          Inicia sesión con tu cuenta registrada o crea un nuevo perfil de
          artista.
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
          titulo="Error de autenticación"
          mensaje={mensajeError}
        />
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Formulario Login / Registro */}
        <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6 xl:col-span-6">
          <div
            role="tablist"
            aria-label="Modo de autenticación"
            className="grid grid-cols-2 gap-1 rounded-lg border border-[rgba(187,167,254,0.2)] bg-[#191820] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'login'}
              onClick={() => {
                setModo('login');
                setMensajeError(null);
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                modo === 'login'
                  ? 'bg-[#7b3aec] text-white'
                  : 'text-[#bba7fe] hover:text-[#f4f3f8]'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'registro'}
              onClick={() => {
                setModo('registro');
                setMensajeError(null);
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                modo === 'registro'
                  ? 'bg-[#7b3aec] text-white'
                  : 'text-[#bba7fe] hover:text-[#f4f3f8]'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Registrarse
            </button>
          </div>

          <form onSubmit={manejarEnvio} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="auth-nombre"
                className="block text-xs font-medium text-[#bba7fe]"
              >
                Nombre de usuario
              </label>
              <input
                id="auth-nombre"
                type="text"
                autoComplete="username"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Yohan"
                className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 text-sm text-[#f4f3f8] placeholder-[#bba7fe]/45 focus:border-[#c6ff00] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="auth-pass"
                className="block text-xs font-medium text-[#bba7fe]"
              >
                Contraseña
              </label>
              <input
                id="auth-pass"
                type="password"
                autoComplete={
                  modo === 'login' ? 'current-password' : 'new-password'
                }
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 text-sm text-[#f4f3f8] placeholder-[#bba7fe]/45 focus:border-[#c6ff00] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-[#c6ff00] px-4 py-3 text-sm font-bold text-[#191820] transition-colors hover:bg-[#b4eb00] disabled:opacity-60"
            >
              {cargando
                ? 'Validando credenciales...'
                : modo === 'login'
                ? 'Entrar al menú del artista'
                : 'Registrar cuenta nueva'}
            </button>
          </form>
        </section>

        {/* Sesión actual y directorio de artistas */}
        <div className="space-y-6 xl:col-span-6">
          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
              Sesión activa actual
            </h3>
            {usuarioActivo ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(187,167,254,0.12)] pt-4">
                <div>
                  <p className="text-base font-semibold text-[#c6ff00]">
                    {usuarioActivo.nombre}
                  </p>
                  <p className="mt-0.5 text-xs text-[#bba7fe]">
                    Nivel {usuarioActivo.nivelHabitual} · Formato principal:{' '}
                    {usuarioActivo.formatoPrincipal}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCerrarSesion}
                  className="rounded-lg border border-[rgba(187,167,254,0.28)] px-3.5 py-2 text-xs font-semibold text-[#bba7fe] hover:border-[#bba7fe] hover:text-[#f4f3f8] whitespace-nowrap"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#bba7fe]">
                Inicia sesión para guardar tus cotizaciones con tu nombre de
                artista.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
              Artistas registrados
            </h3>
            <p className="mt-1 text-xs text-[#bba7fe]">
              Cuentas disponibles actualmente en el registro del sistema.
            </p>
            <ul className="mt-4 divide-y divide-[rgba(187,167,254,0.12)] border-t border-[rgba(187,167,254,0.12)]">
              {usuarios.map((u) => (
                <li
                  key={u.nombre}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck
                      className="h-4 w-4 text-[#bba7fe]"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-[#f4f3f8]">
                      {u.nombre}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModo('login');
                      setNombre(u.nombre);
                      setMensajeError(null);
                    }}
                    className="text-xs font-medium text-[#bba7fe] hover:text-[#c6ff00]"
                  >
                    Seleccionar usuario
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
