import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { ejecutarFallbackNode } from './serverFallback.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUERTO = Number(process.env.PORT || 3000);
const BRIDGE_SCRIPT = path.resolve(__dirname, 'backend', 'api_bridge.py');
const BACKEND_DIR = path.resolve(__dirname, 'backend');

interface RespuestaPython {
  ok: boolean;
  mensaje?: string;
  [clave: string]: unknown;
}

interface ComandoPython {
  comando: string;
  argsBase: string[];
}

/**
 * Detecta automáticamente el ejecutable real de Python 3 en Windows, macOS o Linux.
 * En Windows evita el alias falso de Microsoft Store ("python3") probando "py -3",
 * "python" y rutas estándar de instalación.
 */
function detectarPython(): ComandoPython | null {
  const candidatos: ComandoPython[] = [];

  if (process.env.PYTHON_CMD) {
    candidatos.push({ comando: process.env.PYTHON_CMD, argsBase: [] });
  }

  if (process.platform === 'win32') {
    candidatos.push(
      { comando: 'py', argsBase: ['-3'] },
      { comando: 'python', argsBase: [] },
      { comando: 'python3', argsBase: [] }
    );

    const basesWindows = [
      process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Programs', 'Python')
        : '',
      process.env.ProgramFiles ? path.join(process.env.ProgramFiles) : '',
      'C:\\',
    ].filter(Boolean);

    for (const base of basesWindows) {
      try {
        if (!fs.existsSync(base)) continue;
        const carpetas = fs
          .readdirSync(base)
          .filter((n) => /^Python3\d+$/i.test(n))
          .sort()
          .reverse();
        for (const carpeta of carpetas) {
          const exe = path.join(base, carpeta, 'python.exe');
          if (fs.existsSync(exe)) {
            candidatos.push({ comando: exe, argsBase: [] });
          }
        }
      } catch {
        // Ignorar errores de permisos al explorar carpetas
      }
    }

    if (process.env.USERPROFILE) {
      for (const distro of ['anaconda3', 'miniconda3']) {
        const exe = path.join(process.env.USERPROFILE, distro, 'python.exe');
        if (fs.existsSync(exe)) {
          candidatos.push({ comando: exe, argsBase: [] });
        }
      }
    }
  } else {
    candidatos.push(
      { comando: 'python3', argsBase: [] },
      { comando: 'python', argsBase: [] }
    );
  }

  for (const candidato of candidatos) {
    try {
      const check = spawnSync(
        candidato.comando,
        [...candidato.argsBase, '-c', 'import sys; print(sys.version_info[0])'],
        {
          encoding: 'utf-8',
          timeout: 3000,
          windowsHide: true,
        }
      );
      if (check.status === 0 && (check.stdout || '').trim().startsWith('3')) {
        return candidato;
      }
    } catch {
      // Continuar con el siguiente candidato
    }
  }

  return null;
}

const PYTHON_DETECTADO = detectarPython();

/**
 * Ejecuta backend/api_bridge.py enviando la acción y los datos por stdin
 * para interactuar directamente con archivos.py, catalogo.py, materiales.py y operaciones.py.
 * Si la PC local no tiene Python 3 instalado, utiliza automáticamente compatibilidad directa
 * sobre los mismos archivos backend/*.txt para no interrumpir la aplicación.
 */
function ejecutarPython(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<RespuestaPython> {
  return new Promise((resolve) => {
    const py = PYTHON_DETECTADO;
    if (!py) {
      resolve(ejecutarFallbackNode(BACKEND_DIR, action, payload) as RespuestaPython);
      return;
    }

    const proceso = spawn(py.comando, [...py.argsBase, BRIDGE_SCRIPT], {
      cwd: BACKEND_DIR,
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    });

    let stdout = '';

    proceso.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
    });

    proceso.on('error', () => {
      resolve(ejecutarFallbackNode(BACKEND_DIR, action, payload) as RespuestaPython);
    });

    proceso.on('close', (code) => {
      try {
        const parsed = JSON.parse(stdout.trim() || '{}') as RespuestaPython;
        if (code !== 0 && parsed.ok !== false) {
          resolve(ejecutarFallbackNode(BACKEND_DIR, action, payload) as RespuestaPython);
          return;
        }
        resolve(parsed);
      } catch {
        resolve(ejecutarFallbackNode(BACKEND_DIR, action, payload) as RespuestaPython);
      }
    });

    proceso.stdin.write(JSON.stringify({ action, payload }));
    proceso.stdin.end();
  });
}

async function iniciarServidor() {
  if (PYTHON_DETECTADO) {
    console.log(
      `Python detectado: ${PYTHON_DETECTADO.comando} ${PYTHON_DETECTADO.argsBase.join(' ')}`.trim()
    );
  } else {
    console.warn(
      'Advertencia: No se encontró Python 3 en PATH ni en rutas estándar.'
    );
  }

  const app = express();
  app.use(express.json());

  // ========================================================================
  // RUTAS API -> CONEXIÓN DIRECTA CON LOS MÓDULOS PYTHON (/backend/*.py)
  // ========================================================================

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('login', req.body ?? {});
      res.status(resultado.ok ? 200 : 401).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error
            ? err.message
            : 'Error de conexión con archivos.py',
      });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('register', req.body ?? {});
      res.status(resultado.ok ? 201 : 409).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error
            ? err.message
            : 'Error al registrar en archivos.py',
      });
    }
  });

  app.get('/api/usuarios', async (_req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('list_users');
      res.json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error al leer usuarios.txt',
      });
    }
  });

  app.get('/api/catalogo', async (_req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('get_catalog');
      res.json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error al consultar catalogo.py',
      });
    }
  });

  app.post('/api/catalogo', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('add_material', req.body ?? {});
      res.status(resultado.ok ? 201 : 400).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error
            ? err.message
            : 'Error al agregar material en catalogo.py',
      });
    }
  });

  app.put('/api/catalogo/:id', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('update_material', {
        id: Number(req.params.id),
        ...(req.body ?? {}),
      });
      res.status(resultado.ok ? 200 : 404).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error al actualizar material',
      });
    }
  });

  app.delete('/api/catalogo/:id', async (req: Request, res: Response) => {
    try {
      const formato = String(req.query.formato || 'Tradicional');
      const resultado = await ejecutarPython('delete_material', {
        id: Number(req.params.id),
        formato,
      });
      res.status(resultado.ok ? 200 : 404).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error al eliminar material',
      });
    }
  });

  app.get('/api/cotizaciones', async (_req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('list_quotes');
      res.json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error al listar cotizaciones',
      });
    }
  });

  app.post('/api/cotizaciones', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('save_quote', req.body ?? {});
      res.status(resultado.ok ? 201 : 400).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error
            ? err.message
            : 'Error al calcular cotización en Python',
      });
    }
  });

  app.delete('/api/cotizaciones/:id', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython('delete_quote', {
        id: req.params.id,
      });
      res.json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error al eliminar cotización',
      });
    }
  });

  app.post('/api/operaciones/calcular', async (req: Request, res: Response) => {
    try {
      const resultado = await ejecutarPython(
        'operations_calc',
        req.body ?? {}
      );
      res.status(resultado.ok ? 200 : 400).json(resultado);
    } catch (err) {
      res.status(500).json({
        ok: false,
        mensaje:
          err instanceof Error ? err.message : 'Error en operaciones.py',
      });
    }
  });

  // ========================================================================
  // SERVICIO DE FRONTEND (Vite middleware en desarrollo / dist en producción)
  // ========================================================================
  const esProduccion = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (!esProduccion || !fs.existsSync(distDir)) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PUERTO, '0.0.0.0', () => {
    console.log(`Art&Value servidor activo en http://0.0.0.0:${PUERTO}`);
  });
}

iniciarServidor();
