/**
 * Persistencia de páginas ediables en Supabase (tabla `site_pages`).
 * El contenido se guarda como JSON de bloques en la columna `content`.
 */
import { supabase } from './supabaseClient';
import { PageBlock, parseBlocks, serializeBlocks } from './pageBlocks';

export interface ManagedPage {
  slug: string;
  label: string;
  hint: string;
}

export const MANAGED_PAGES: ManagedPage[] = [
  { slug: 'inicio', label: 'Inicio', hint: 'Héroe y cabecera de la portada.' },
  { slug: 'servicios', label: 'Servicios', hint: 'Bento/servicios especializados.' },
  { slug: 'aliados', label: 'Aliados', hint: 'Marcas y aliados que confían.' },
  { slug: 'afiliados', label: 'Afiliados', hint: 'Programa de afiliación / membresía.' },
  { slug: 'novedades', label: 'Novedades', hint: 'Últimas novedades y lanzamientos.' },
  { slug: 'cursos', label: 'Cursos', hint: 'Página de cursos y formaciones.' },
  { slug: 'productos', label: 'Productos', hint: 'Héroe y grilla de la tienda.' },
];

export interface SitePage {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  published: boolean;
  blocks: PageBlock[];
  updated_at?: string;
}

const BLOCK_KEYS: Array<keyof SitePage> = ['id', 'slug', 'title', 'description', 'published', 'blocks', 'updated_at'];

function shapeRow(page: SitePage): Record<string, unknown> {
  return {
    slug: page.slug,
    title: page.title,
    description: page.description || '',
    content: serializeBlocks(page.blocks),
    published: page.published,
    updated_at: new Date().toISOString(),
  };
}

function shapeBlock(raw: any): SitePage {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title || '',
    description: raw.description || '',
    published: Boolean(raw.published),
    blocks: parseBlocks(raw.content),
    updated_at: raw.updated_at,
  };
}

export async function loadPage(slug: string): Promise<SitePage | null> {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return shapeBlock(data);
}

export async function savePage(page: SitePage): Promise<{ error?: string }> {
  const payload = shapeRow(page);
  if (page.id) {
    const { error } = await supabase.from('site_pages').update(payload).eq('id', page.id);
    if (error) return { error: error.message };
    return {};
  }
  const { data, error } = await supabase.from('site_pages').insert({ ...payload, id: crypto.randomUUID() }).select('id').single();
  if (error) return { error: error.message };
  return { error: undefined };
}

export function subscribePage(slug: string, onChange: (page: SitePage | null) => void): () => void {
  const channel = supabase
    .channel(`site_page_${slug}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_pages', filter: `slug=eq.${slug}` }, async (payload) => {
      if (payload.new) onChange(shapeBlock(payload.new));
      else onChange(null);
    })
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export async function uploadPageImage(file: File): Promise<{ url: string; error?: string }> {
  const path = `page-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from('page-images').upload(path, file, { upsert: false });
  if (error) return { url: '', error: error.message };
  const { data } = supabase.storage.from('page-images').getPublicUrl(path);
  return { url: data.publicUrl };
}

export { BLOCK_KEYS };