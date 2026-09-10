/**
 * Cliente del backend seguro de publicación a GitHub.
 * El backend verifica que el usuario logueado sea administrador (Supabase Auth
 * + tabla `admins`) y ejecuta commit + push + workflow. Ningún token de GitHub
 * vive en el navegador.
 */
import { supabase } from './supabaseClient';

export interface PublishPayload {
  files: Record<string, string>;
  message: string;
}

export interface PublishResult {
  commitSha?: string;
  commitUrl?: string;
  workflowDispatched?: boolean;
}

export type PublishResponse =
  | { ok: true; data: PublishResult }
  | { ok: false; error: string };

const API_BASE = (import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8787').replace(/\/$/, '');

export async function githubPublish(payload: PublishPayload): Promise<PublishResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { ok: false, error: 'No hay sesión de administrador activa. Iniciá sesión otra vez.' };
  }
  try {
    const res = await fetch(`${API_BASE}/api/github/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: (body && body.error) || `Error ${res.status} del backend.` };
    }
    return { ok: true, data: (body || {}) as PublishResult };
  } catch (err) {
    return { ok: false, error: `No se pudo conectar con el backend (${API_BASE}). ${(err as Error).message}` };
  }
}