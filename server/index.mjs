/**
 * Backend mínimo de publicación versionada para XLMX Barber.
 *
 * Seguridad:
 * - Verifica que la sesión sea de un administrador real: valida el JWT de
 *   Supabase Auth del usuario y confirma su rol (owner/editor) en `admins`.
 * - El token de GitHub vive SOLO aquí (variable de entorno GITHUB_TOKEN), con
 *   permisos mínimos (contents:write + actions:write sobre un solo repo).
 * - Limita los archivos versionables a la carpeta `site_content/*.json`.
 *
 * Endpoints:
 *   GET  /api/health
 *   POST /api/github/publish  { files: { "site_content/slug.json": "..." }, message }
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN
 *   GITHUB_REPO (default: xlilmoyax/xlmxbarber), GITHUB_BRANCH (default: main)
 *   GITHUB_WORKFLOW (default: deploy.yml), PORT (default: 8787)
 *   CORS_ORIGINS (comma-separated, default: http://localhost:3000,https://xlmxbarber.com)
 */
import dotenv from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: 'server/.env' });

const app = express();
const PORT = Number(process.env.PORT || 8787);
const REPO = process.env.GITHUB_REPO || 'xlilmoyax/xlmxbarber';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const WORKFLOW = process.env.GITHUB_WORKFLOW || 'deploy.yml';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,https://xlmxbarber.com').split(',').map((o) => o.trim());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

function requireEnv() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return 'Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY';
  if (!GITHUB_TOKEN) return 'Falta GITHUB_TOKEN en el servidor';
  return null;
}

async function assertAdmin(authHeader) {
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new Error('Falta el token de sesión.');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !data.user.email) throw new Error('Sesión no válida.');
  const { data: adminRow } = await supabase
    .from('admins')
    .select('email, role')
    .eq('email', data.user.email)
    .maybeSingle();
  const role = adminRow && adminRow.role;
  if (role !== 'owner' && role !== 'editor') throw new Error('El usuario no es administrador autorizado.');
}

async function gh(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}: ${(data && data.message) || text.slice(0, 200)}`);
  }
  return data;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, repo: REPO, branch: BRANCH });
});

app.post('/api/github/publish', async (req, res) => {
  try {
    const envError = requireEnv();
    if (envError) return fail(res, 500, envError);

    await assertAdmin(req.headers.authorization || '');

    const { files } = req.body || {};
    const message = (req.body && typeof req.body.message === 'string' ? req.body.message : '').trim();

    if (!files || typeof files !== 'object' || Array.isArray(files) || Object.keys(files).length === 0) {
      return fail(res, 400, 'El campo `files` es obligatorio ({ ruta: contenido }).');
    }
    if (!message) return fail(res, 400, 'El campo `message` (mensaje del commit) es obligatorio.');

    const entries = Object.entries(files).filter(([key]) => typeof key === 'string').filter(([key, value]) => typeof value === 'string');
    for (const [path] of entries) {
      if (!/^[a-zA-Z0-9_\-./]+\/[a-zA-Z0-9_\-./]+\.json$/.test(path) || !path.startsWith('site_content/')) {
        return fail(res, 400, `Ruta versionable no permitida: ${path}`);
      }
    }
    if (entries.length === 0) return fail(res, 400, 'No hay archivos JSON válidos para commitear.');

    const head = await gh(`git/ref/heads/${BRANCH}`);
    const blobs = [];
    for (const [path, content] of entries) {
      const blob = await gh('git/blobs', { method: 'POST', body: { content, encoding: 'utf-8' } });
      blobs.push({ path, sha: blob.sha });
    }
    const tree = await gh('git/trees', {
      method: 'POST',
      body: { base_tree: head.object.sha, tree: blobs.map(({ path, sha }) => ({ path, mode: '100644', type: 'blob', sha })) },
    });
    const commit = await gh('git/commits', {
      method: 'POST',
      body: { message, parents: [head.object.sha], tree: tree.sha },
    });
    await gh(`git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });

    let workflowDispatched = false;
    try {
      await gh(`actions/workflows/${WORKFLOW}/dispatches`, { method: 'POST', body: { ref: BRANCH } });
      workflowDispatched = true;
    } catch (err) {
      console.error('No se pudo disparar el workflow:', err.message);
      workflowDispatched = false;
    }

    res.json({
      commitSha: commit.sha,
      commitUrl: `https://github.com/${REPO}/commit/${commit.sha}`,
      workflowDispatched,
    });
  } catch (err) {
    console.error('Error en /api/github/publish:', err.message);
    return fail(res, 500, err.message);
  }
});

app.listen(PORT, () => {
  console.log(`XLMX admin backend escuchando en :${PORT} (repo ${REPO}, rama ${BRANCH})`);
  console.log(`  - service_role: ${SERVICE_ROLE_KEY ? 'configurada' : 'FALTA en server/.env'}`);
  console.log(`  - github token: ${GITHUB_TOKEN ? 'configurado' : 'FALTA en server/.env'}`);
});