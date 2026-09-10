/**
 * Hook para que las vistas públicas lean una página editable con fallback.
 * Si la página no existe, no está publicada o no tiene bloques visibles,
 * devuelve null y la vista sigue mostrando su contenido hardcodeado.
 */
import { useEffect, useState } from 'react';
import { loadPage, subscribePage, SitePage } from './pageStore';

export function publishedBlocks(page: SitePage | null): boolean {
  return Boolean(page && page.published && page.blocks.some((block) => block.visible));
}

export function usePageBlocks(slug: string): { loading: boolean; page: SitePage | null } {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<SitePage | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const found = await loadPage(slug);
      if (!alive) return;
      setPage(found && publishedBlocks(found) ? found : null);
      setLoading(false);
    })();
    const unsubscribe = subscribePage(slug, (next) => {
      if (!alive) return;
      setPage(next && publishedBlocks(next) ? next : null);
    });
    return () => { alive = false; unsubscribe(); };
  }, [slug]);

  return { loading, page };
}