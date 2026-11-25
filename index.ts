import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { ejecutarFallbackNode } from '../serverFallback.ts';

const SEED_BACKEND_DIR = path.resolve(process.cwd(), 'backend');
const RUNTIME_BACKEND_DIR = path.join('/tmp', 'artvalue-backend');

/**
 * Copia los archivos iniciales de /backend/ hacia /tmp/artvalue-backend en Vercel
 * para permitir lectura y escritura durante la sesión sin error de sistema de archivos solo lectura.
 */
function prepararDirectorioRuntime(): string {
  try {
    if (!fs.existsSync(RUNTIME_BACKEND_DIR)) {
      fs.mkdirSync(RUNTIME_BACKEND_DIR, { recursive: true });
    }
    const archivosSeed = [
      'usuarios.txt',
      'materiales.txt',
      'materiales_digital.txt',
      'cotizaciones.json',
    ];
    for (const archivo of archivosSeed) {
      const destino = path.join(RUNTIME_BACKEND_DIR, archivo);
      const origen = path.join(SEED_BACKEND_DIR, archivo);
      if (!fs.existsSync(destino) && fs.existsSync(origen)) {
        fs.copyFileSync(origen, destino);
      }
    }
    return RUNTIME_BACKEND_DIR;
  } catch {
    return SEED_BACKEND_DIR;
  }
}

const app = express();
app.use(express.json());

app.post('/api/auth/login', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const resultado = ejecutarFallbackNode(dir, 'login', req.body ?? {});
  res.status(resultado.ok ? 200 : 401).json(resultado);
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const resultado = ejecutarFallbackNode(dir, 'register', req.body ?? {});
  res.status(resultado.ok ? 201 : 409).json(resultado);
});

app.get('/api/usuarios', (_req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  res.json(ejecutarFallbackNode(dir, 'list_users'));
});

app.get('/api/catalogo', (_req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  res.json(ejecutarFallbackNode(dir, 'get_catalog'));
});

app.post('/api/catalogo', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const resultado = ejecutarFallbackNode(dir, 'add_material', req.body ?? {});
  res.status(resultado.ok ? 201 : 400).json(resultado);
});

app.put('/api/catalogo/:id', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const resultado = ejecutarFallbackNode(dir, 'update_material', {
    id: Number(req.params.id),
    ...(req.body ?? {}),
  });
  res.status(resultado.ok ? 200 : 404).json(resultado);
});

app.delete('/api/catalogo/:id', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const formato = String(req.query.formato || 'Tradicional');
  const resultado = ejecutarFallbackNode(dir, 'delete_material', {
    id: Number(req.params.id),
    formato,
  });
  res.status(resultado.ok ? 200 : 404).json(resultado);
});

app.get('/api/cotizaciones', (_req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  res.json(ejecutarFallbackNode(dir, 'list_quotes'));
});

app.post('/api/cotizaciones', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const resultado = ejecutarFallbackNode(dir, 'save_quote', req.body ?? {});
  res.status(resultado.ok ? 201 : 400).json(resultado);
});

app.delete('/api/cotizaciones/:id', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  res.json(ejecutarFallbackNode(dir, 'delete_quote', { id: req.params.id }));
});

app.post('/api/operaciones/calcular', (req: Request, res: Response) => {
  const dir = prepararDirectorioRuntime();
  const resultado = ejecutarFallbackNode(
    dir,
    'operations_calc',
    req.body ?? {}
  );
  res.status(resultado.ok ? 200 : 400).json(resultado);
});

export default app;
