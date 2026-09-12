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

function uuid() { return crypto.randomUUID(); }

function getDefaultBlocks(slug: string): PageBlock[] {
  switch (slug) {
    case 'inicio': return [
      { id: uuid(), type: 'hero', visible: true, eyebrow: 'XLMX', title: 'BARBER SHOP', subtitle: 'Experiencia premium en cortes, barba y cuidado masculino.', description: 'Más que una barbería: un espacio donde el detalle y la técnica se encuentran para ofrecerte el mejor servicio.', imageUrl: '/src/assets/hero_bg.png', imageAlt: 'Interior de XLMX Barber Shop', overlay: true, cta: { label: 'CONOCÉ MÁS', link: '/sobre-nosotros' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'text', visible: true, title: 'Afiliación Exclusiva para Miembros VIP', body: 'Formá parte de nuestra comunidad selecta y accedé a beneficios de primer nivel, cobros automatizados, descuentos preferenciales y prioridad absoluta en tus reservas.', align: 'left' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'cards', visible: true, title: 'Servicios Especializados', subtitle: 'Experiencia XLMX', items: [
        { id: uuid(), title: 'Permanentes', description: 'Rizos o rulos definidos con una duración de 2 a 3 meses. El estilo que buscabas, sin esfuerzo diario.', imageUrl: '/src/assets/service_bento_curls.jpg', imageAlt: 'Permanentes', badge: '✨' },
        { id: uuid(), title: 'Alisados', description: 'Cabello liso, sedoso y sin frizz por meses. Tratamiento profesional con keratina de alta gama.', imageUrl: '/src/assets/service_bento_straight.jpg', imageAlt: 'Alisados', badge: '✨' },
        { id: uuid(), title: 'Servicio a Domicilio', description: 'La experiencia XLMX en la comodidad de tu hogar u oficina. Privacidad y distinción sin traslados.', imageUrl: '/src/assets/service_bento_domicilio.jpg', imageAlt: 'Servicio a Domicilio', badge: '🏠' },
        { id: uuid(), title: 'Spa Capilar', description: 'Tratamientos profundos de hidratación, nutrición y reconstrucción para devolverle la vida a tu cabello.', imageUrl: '/src/assets/service_bento_spa.jpg', imageAlt: 'Spa Capilar', badge: '💧' },
      ], columns: 2 },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'logos', visible: true, title: 'Confiamos en lo Mejor para Vos', subtitle: 'Calidad Garantizada', items: [
        { id: uuid(), name: 'IDRAET', imageUrl: '/src/assets/idraet_logo.png', alt: 'IDRAET', url: '#' },
        { id: uuid(), name: 'SIR FAUSTO', imageUrl: '/src/assets/sir_fausto_logo.png', alt: 'SIR FAUSTO', url: '#' },
      ] },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'news', visible: true, title: 'Lo Último en XLMX', subtitle: 'Novedades', items: [
        { id: uuid(), title: '¿QUERÉS SER MIEMBRO VIP?', excerpt: 'Conocé mas sobre el Sistema de Membresías para nuestros Miembros Afiliados...', date: '2026-08-07', imageUrl: '/src/assets/latest_news_post.jpg', imageAlt: 'Membresías VIP', link: '/membresias' },
        { id: uuid(), title: 'Nuevos tratamientos capilares', excerpt: 'Incorporamos la línea completa de spa capilar con tecnología de vanguardia.', date: '2026-07-15', imageUrl: '/src/assets/spa_treatment.jpg', imageAlt: 'Spa Capilar', link: '/servicios' },
      ] },
    ];

    case 'servicios': return [
      { id: uuid(), type: 'hero', visible: true, title: 'Servicios Especializados', subtitle: 'Experiencia XLMX', description: 'Cada servicio está diseñado con técnica de vanguardia y productos de primera línea.', imageUrl: '/src/assets/service_hero.jpg', imageAlt: 'Servicios XLMX', overlay: true, cta: { label: 'RESERVAR AHORA', link: '/reservas' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'cards', visible: true, title: 'Nuestros Servicios', items: [
        { id: uuid(), title: 'Permanentes', description: 'Rizos definidos por 2-3 meses.', imageUrl: '/src/assets/service_bento_curls.jpg', imageAlt: 'Permanentes', link: '/servicios/permanentes', linkLabel: 'Ver detalle' },
        { id: uuid(), title: 'Alisados', description: 'Liso perfecto sin frizz por meses.', imageUrl: '/src/assets/service_bento_straight.jpg', imageAlt: 'Alisados', link: '/servicios/alisados', linkLabel: 'Ver detalle' },
        { id: uuid(), title: 'Servicio a Domicilio', description: 'La experiencia XLMX en tu hogar.', imageUrl: '/src/assets/service_bento_domicilio.jpg', imageAlt: 'Domicilio', badge: '🏠', link: '/servicios/domicilio', linkLabel: 'Ver detalle' },
        { id: uuid(), title: 'Spa Capilar', description: 'Hidratación y reconstrucción profunda.', imageUrl: '/src/assets/service_bento_spa.jpg', imageAlt: 'Spa Capilar', link: '/servicios/spa', linkLabel: 'Ver detalle' },
      ], columns: 2 },
    ];

    case 'aliados': return [
      { id: uuid(), type: 'hero', visible: true, title: 'Nuestros Aliados', subtitle: 'Calidad Garantizada', description: 'Porque tu imagen y salud son nuestra prioridad, trabajamos exclusivamente con las marcas líderes del mercado.', imageUrl: '/src/assets/aliados_hero.jpg', imageAlt: 'Aliados XLMX', overlay: true, cta: { label: 'VER PRODUCTOS', link: '/productos' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'logos', visible: true, title: 'Marcas que Confían en XLMX', items: [
        { id: uuid(), name: 'IDRAET', imageUrl: '/src/assets/idraet_logo.png', alt: 'IDRAET', url: '#' },
        { id: uuid(), name: 'SIR FAUSTO', imageUrl: '/src/assets/sir_fausto_logo.png', alt: 'SIR FAUSTO', url: '#' },
      ] },
    ];

    case 'afiliados': return [
      { id: uuid(), type: 'hero', visible: true, eyebrow: 'PROGRAMA VIP', title: 'Afiliación Exclusiva', subtitle: 'Membresía XLMX', description: 'Accedé a beneficios de primer nivel, cobros automatizados, descuentos preferenciales y prioridad absoluta en tus reservas.', imageUrl: '/src/assets/membresia_hero.jpg', imageAlt: 'Membresía XLMX', overlay: true, cta: { label: 'QUIERO SER MIEMBRO', link: '/membresias' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'cards', visible: true, title: 'Beneficios', items: [
        { id: uuid(), title: 'Descuentos preferenciales', description: 'Hasta 25% off en todos los servicios y productos.', badge: '💰' },
        { id: uuid(), title: 'Prioridad en reservas', description: 'Acceso anticipado a horarios premium.', badge: '⚡' },
        { id: uuid(), title: 'Cobro automatizado', description: 'Suscripción mensual sin fricciones.', badge: '🔄' },
        { id: uuid(), title: 'Productos exclusivos', description: 'Lanzamientos y ediciones limitadas solo para miembros.', badge: '🎁' },
      ], columns: 2 },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'cta_banner', visible: true, title: 'Unite hoy', description: 'Formá parte de la comunidad XLMX y viví la experiencia completa.', cta: { label: 'VER PLANES Y PRECIOS', link: '/membresias' } },
    ];

    case 'novedades': return [
      { id: uuid(), type: 'hero', visible: true, title: 'Novedades', subtitle: 'Lo Último en XLMX', description: 'Mantenete al día con nuestros lanzamientos, eventos y promociones.', imageUrl: '/src/assets/news_hero.jpg', imageAlt: 'Novedades XLMX', overlay: true, cta: { label: 'SUSCRIBIRME', link: '/contacto' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'news', visible: true, title: 'Últimas Publicaciones', items: [
        { id: uuid(), title: '¿QUERÉS SER MIEMBRO VIP?', excerpt: 'Conocé mas sobre el Sistema de Membresías para nuestros Miembros Afiliados...', date: '2026-08-07', imageUrl: '/src/assets/latest_news_post.jpg', imageAlt: 'Membresías VIP', link: '/membresias' },
        { id: uuid(), title: 'Nuevos tratamientos capilares', excerpt: 'Incorporamos la línea completa de spa capilar con tecnología de vanguardia.', date: '2026-07-15', imageUrl: '/src/assets/spa_treatment.jpg', imageAlt: 'Spa Capilar', link: '/servicios' },
        { id: uuid(), title: 'Lanzamiento Sir Fausto', excerpt: 'La línea exclusiva para el cuidado del cabello y la barba ya disponible.', date: '2026-06-20', imageUrl: '/src/assets/sir_fausto_launch.jpg', imageAlt: 'Sir Fausto', link: '/productos' },
      ] },
    ];

    case 'cursos': return [
      { id: uuid(), type: 'hero', visible: true, title: 'Cursos', subtitle: 'Formación Profesional', description: 'Próximamente: formación en barbería, técnicas avanzadas de cuidado capilar y servicios especializados.', imageUrl: '/src/assets/cursos_hero.jpg', imageAlt: 'Cursos XLMX', overlay: true, cta: { label: 'VOLVER AL INICIO', link: '/' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'cards', visible: true, title: 'Próximos Cursos', items: [
        { id: uuid(), title: 'Cursos Teóricos', description: 'Aprende los fundamentos y técnicas esenciales.', badge: '📚', imageUrl: '/src/assets/course_theory.jpg', imageAlt: 'Cursos Teóricos' },
        { id: uuid(), title: 'Prácticas Presenciales', description: 'Manos a la obra en nuestras instalaciones.', badge: '✂️', imageUrl: '/src/assets/course_practice.jpg', imageAlt: 'Prácticas' },
        { id: uuid(), title: 'Certificación', description: 'Obtené tu certificado profesional.', badge: '🏆', imageUrl: '/src/assets/course_cert.jpg', imageAlt: 'Certificación' },
      ], columns: 3 },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'cta_banner', visible: true, title: 'Estate atento a nuestras novedades', cta: { label: 'IR A NOVEDADES', link: '/novedades' } },
    ];

    case 'productos': return [
      { id: uuid(), type: 'hero', visible: true, title: 'Catálogo Exclusivo', subtitle: 'Productos Profesionales', description: 'Selección de productos profesionales utilizados por nuestros expertos. Eleva tu rutina de cuidado con las mejores marcas.', imageUrl: '/src/assets/productos_hero.jpg', imageAlt: 'Catálogo XLMX', overlay: true, cta: { label: 'VER CATÁLOGO', link: '#productos' }, align: 'center' },
      { id: uuid(), type: 'divider', visible: true },
      { id: uuid(), type: 'product_grid', visible: true, title: 'Nuestros Productos', subtitle: 'Filtrá por marca, categoría o precio' },
    ];

    default: return [];
  }
}

export async function loadPage(slug: string): Promise<SitePage | null> {
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    return {
      slug,
      title: MANAGED_PAGES.find(p => p.slug === slug)?.label || slug,
      description: MANAGED_PAGES.find(p => p.slug === slug)?.hint || '',
      published: false,
      blocks: getDefaultBlocks(slug),
    };
  }
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