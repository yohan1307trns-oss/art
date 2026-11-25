/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import {
  apiEliminarCotizacion,
  apiObtenerCatalogo,
  apiObtenerCotizaciones,
  apiObtenerUsuarios,
} from './api/pythonBackendAdapter';
import { AuthUsersView } from './components/AuthUsersView';
import { CatalogMaterialsView } from './components/CatalogMaterialsView';
import { DashboardView } from './components/DashboardView';
import { OperationsView } from './components/OperationsView';
import { QuoteBuilderView } from './components/QuoteBuilderView';
import { SidebarNav } from './components/SidebarNav';
import { TopBar } from './components/TopBar';
import {
  Cotizacion,
  FormatoTrabajo,
  MaterialCatalogo,
  SeccionActiva,
  UsuarioCuenta,
} from './types/artValue';

/**
 * Componente raíz de Art&Value conectado directamente al backend modular en Python.
 */
export default function App() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('panel');
  const [abiertoMovil, setAbiertoMovil] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioCuenta[]>([]);
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioCuenta | null>(
    null
  );

  const [catalogo, setCatalogo] = useState<MaterialCatalogo[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [formatoCotizacion, setFormatoCotizacion] =
    useState<FormatoTrabajo>('Tradicional');

  const cargarDatosBackend = useCallback(async () => {
    setCargandoDatos(true);
    setErrorCarga(null);

    const [resCatalogo, resCotizaciones, resUsuarios] = await Promise.all([
      apiObtenerCatalogo(),
      apiObtenerCotizaciones(),
      apiObtenerUsuarios(),
    ]);

    if (!resCatalogo.ok || !resCotizaciones.ok) {
      setErrorCarga(
        resCatalogo.mensaje ||
          resCotizaciones.mensaje ||
          'No se pudo obtener la información desde el servidor Python.'
      );
      setCargandoDatos(false);
      return;
    }

    if (resCatalogo.datos?.materiales) {
      setCatalogo(resCatalogo.datos.materiales);
    }
    if (resCotizaciones.datos?.cotizaciones) {
      setCotizaciones(resCotizaciones.datos.cotizaciones);
    }
    if (resUsuarios.ok && resUsuarios.datos?.usuarios) {
      setUsuarios(resUsuarios.datos.usuarios);
      setUsuarioActivo((prev) => prev ?? resUsuarios.datos!.usuarios[0] ?? null);
    }

    setCargandoDatos(false);
  }, []);

  useEffect(() => {
    cargarDatosBackend();
  }, [cargarDatosBackend]);

  const manejarIniciarCotizacionFormato = (formato: FormatoTrabajo) => {
    setFormatoCotizacion(formato);
    setSeccionActiva('cotizador');
  };

  const manejarCotizacionGuardada = (nueva: Cotizacion) => {
    setCotizaciones((prev) => [nueva, ...prev]);
  };

  const manejarEliminarCotizacion = async (id: string) => {
    const res = await apiEliminarCotizacion(id);
    if (res.ok) {
      setCotizaciones((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const manejarAgregarMaterial = (nuevo: MaterialCatalogo) => {
    setCatalogo((prev) => [...prev, nuevo]);
  };

  const manejarCerrarSesion = () => {
    setUsuarioActivo(null);
    setSeccionActiva('usuarios');
  };

  const manejarLoginExitoso = (usuario: UsuarioCuenta) => {
    setUsuarioActivo(usuario);
    setSeccionActiva('panel');
  };

  const manejarRegistrarExitoso = (nuevo: UsuarioCuenta) => {
    setUsuarios((prev) => [...prev, nuevo]);
  };

  return (
    <div className="flex min-h-screen bg-[#191820] text-[#f4f3f8]">
      <SidebarNav
        seccionActiva={seccionActiva}
        onCambiarSeccion={setSeccionActiva}
        usuarioActivo={usuarioActivo}
        onCerrarSesion={manejarCerrarSesion}
        abiertoMovil={abiertoMovil}
        onCerrarMovil={() => setAbiertoMovil(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          seccionActiva={seccionActiva}
          onCambiarSeccion={setSeccionActiva}
          onAbrirMovil={() => setAbiertoMovil(true)}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
          {seccionActiva === 'panel' && (
            <DashboardView
              usuarioActivo={usuarioActivo}
              cotizaciones={cotizaciones}
              catalogo={catalogo}
              cargando={cargandoDatos}
              errorCarga={errorCarga}
              onReintentarCarga={cargarDatosBackend}
              onIrASeccion={setSeccionActiva}
              onIniciarCotizacionFormato={manejarIniciarCotizacionFormato}
              onEliminarCotizacion={manejarEliminarCotizacion}
            />
          )}

          {seccionActiva === 'cotizador' && (
            <QuoteBuilderView
              usuarioActivo={usuarioActivo}
              catalogo={catalogo}
              formatoInicial={formatoCotizacion}
              onCotizacionGuardada={manejarCotizacionGuardada}
              onAgregarMaterialCatalogo={manejarAgregarMaterial}
            />
          )}

          {seccionActiva === 'catalogo' && (
            <CatalogMaterialsView
              catalogo={catalogo}
              cargando={cargandoDatos}
              errorCarga={errorCarga}
              onReintentarCarga={cargarDatosBackend}
              onAgregarMaterial={manejarAgregarMaterial}
              onReemplazarCatalogo={setCatalogo}
            />
          )}

          {seccionActiva === 'operaciones' && <OperationsView />}

          {seccionActiva === 'usuarios' && (
            <AuthUsersView
              usuarios={usuarios}
              usuarioActivo={usuarioActivo}
              onLoginExitoso={manejarLoginExitoso}
              onRegistrarExitoso={manejarRegistrarExitoso}
              onCerrarSesion={manejarCerrarSesion}
            />
          )}
        </main>

        <footer className="border-t border-[rgba(187,167,254,0.14)] px-4 py-5 text-xs text-[#bba7fe]/80 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Art&amp;Value · Estudio de cotización y gestión de materiales
              artísticos.
            </p>
            <p>© 2026 Art&amp;Value</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
