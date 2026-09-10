/**
 * Modelo de bloques de contenido para el editor de páginas.
 * Cada página publicada (site_pages) guarda su orden, visibilidad y campos
 * como JSON. Si una página no tiene bloques publicados, las vistas usan el
 * contenido hardcodeado actual (fallback).
 */
import React from 'react';

export type Cta = { label: string; link: string };

export interface BaseBlock {
  id: string;
  type: BlockType;
  visible: boolean;
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  overlay?: boolean;
  cta?: Cta | null;
  secondaryCta?: Cta | null;
  align?: 'left' | 'center';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  title?: string;
  subtitle?: string;
  body?: string;
  align?: 'left' | 'center';
}

export interface CtaBannerBlock extends BaseBlock {
  type: 'cta_banner';
  title: string;
  description?: string;
  cta?: Cta | null;
}

export interface ImageItem {
  id: string;
  url: string;
  alt?: string;
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  images: ImageItem[];
  columns?: 2 | 3 | 4;
}

export interface SingleImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  link?: string;
}

export interface CardItem {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  link?: string;
  linkLabel?: string;
}

export interface CardsBlock extends BaseBlock {
  type: 'cards';
  title?: string;
  subtitle?: string;
  items: CardItem[];
  columns?: 2 | 3 | 4;
}

export interface LogoItem {
  id: string;
  name?: string;
  url?: string;
  imageUrl: string;
  alt?: string;
}

export interface LogosBlock extends BaseBlock {
  type: 'logos';
  title?: string;
  subtitle?: string;
  items: LogoItem[];
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  date?: string;
  badge?: string;
  imageUrl?: string;
  imageAlt?: string;
  link?: string;
}

export interface NewsBlock extends BaseBlock {
  type: 'news';
  title?: string;
  subtitle?: string;
  items: NewsItem[];
}

export interface ProductGridBlock extends BaseBlock {
  type: 'product_grid';
  title?: string;
  subtitle?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export type PageBlock =
  | HeroBlock
  | TextBlock
  | CtaBannerBlock
  | GalleryBlock
  | SingleImageBlock
  | CardsBlock
  | LogosBlock
  | NewsBlock
  | ProductGridBlock
  | DividerBlock;

export type BlockType = PageBlock['type'];

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  description: string;
  group: 'esenciales' | 'contenido' | 'comercio';
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: 'hero', label: 'Héroe (portada)', description: 'Título grande, subtítulo, CTA e imagen de fondo.', group: 'esenciales' },
  { type: 'text', label: 'Texto', description: 'Título, subtítulo y párrafo de texto.', group: 'esenciales' },
  { type: 'cta_banner', label: 'Llamada a la acción', description: 'Banner con título, texto y botón.', group: 'esenciales' },
  { type: 'cards', label: 'Tarjetas', description: 'Grilla de servicios o destacados con imagen.', group: 'contenido' },
  { type: 'gallery', label: 'Galería de imágenes', description: 'Múltiples imágenes en grilla.', group: 'contenido' },
  { type: 'image', label: 'Imagen simple', description: 'Imagen destacada con pie.', group: 'contenido' },
  { type: 'logos', label: 'Aliados / logos', description: 'Grilla de marcas aliadas.', group: 'contenido' },
  { type: 'news', label: 'Novedades', description: 'Lista de artículos o noticias.', group: 'contenido' },
  { type: 'divider', label: 'Separador', description: 'Línea divisoria.', group: 'esenciales' },
  { type: 'product_grid', label: 'Grilla de productos', description: 'Muestra los productos publicados en vivo.', group: 'comercio' },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createBlock(type: BlockType): PageBlock {
  const base = { id: uid(), type, visible: true };
  switch (type) {
    case 'hero': return { ...base, type, title: '', eyebrow: '', subtitle: '', description: '', imageUrl: '', imageAlt: '', cta: { label: '', link: '' }, secondaryCta: null, align: 'left', overlay: true } as HeroBlock;
    case 'text': return { ...base, type, title: '', subtitle: '', body: '', align: 'left' } as TextBlock;
    case 'cta_banner': return { ...base, type, title: '', description: '', cta: { label: '', link: '' } } as CtaBannerBlock;
    case 'cards': return { ...base, type, title: '', subtitle: '', items: [], columns: 3 } as CardsBlock;
    case 'gallery': return { ...base, type, images: [], columns: 3 } as GalleryBlock;
    case 'image': return { ...base, type, url: '', alt: '', caption: '', link: '' } as SingleImageBlock;
    case 'logos': return { ...base, type, title: '', subtitle: '', items: [] } as LogosBlock;
    case 'news': return { ...base, type, title: '', subtitle: '', items: [] } as NewsBlock;
    case 'divider': return { ...base, type } as DividerBlock;
    case 'product_grid': return { ...base, type, title: '', subtitle: '' } as ProductGridBlock;
  }
}

export function serializeBlocks(blocks: PageBlock[]): string {
  return JSON.stringify(blocks);
}

export function parseBlocks(raw: string | null | undefined): PageBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const known = new Set(BLOCK_TYPES.map((meta) => meta.type));
    return parsed.filter((block: any) => block && known.has(block.type) && typeof block.id === 'string');
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Renderer público (preview y página pública) — diseño responsive    */
/* ------------------------------------------------------------------ */

export interface RenderContext {
  products?: Array<{ id: string; name: string; price: number; image_url?: string; image_urls?: string[] }>;
}

const ACCENT = 'text-amber-600';
const LINK_CLASS = 'text-amber-600 hover:text-amber-700 font-medium transition-colors';

function PrimaryCta({ cta, secondary }: { cta?: Cta | null; secondary?: Cta | null }) {
  if (!cta && !secondary) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      {cta && cta.label && (
        <a href={cta.link || '#'} target={cta.link && cta.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
          className="inline-flex items-center bg-zinc-900 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-amber-400 transition-colors hover:bg-zinc-800">
          {cta.label}
        </a>
      )}
      {secondary && secondary.label && (
        <a href={secondary.link || '#'} target={secondary.link && secondary.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
          className="inline-flex items-center border border-zinc-300 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-900 transition-colors hover:border-zinc-900">
          {secondary.label}
        </a>
      )}
    </div>
  );
}

function SectionHead({ kicker, title, subtitle, align = 'left' }: { kicker?: string; title?: string; subtitle?: string; align?: 'left' | 'center' }) {
  if (!kicker && !title && !subtitle) return null;
  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'}`}>
      {kicker && <p className={`text-xs font-semibold uppercase tracking-[.22em] ${ACCENT} mb-3`}>{kicker}</p>}
      {title && <h2 className="font-display text-3xl text-zinc-900 sm:text-4xl leading-tight">{title}</h2>}
      {subtitle && <p className={`mt-4 text-base text-zinc-500 leading-relaxed ${align === 'center' ? 'mx-auto' : ''}`}>{subtitle}</p>}
    </div>
  );
}

function HeroBlockView({ block }: { block: HeroBlock }) {
  const centered = block.align === 'center';
  return (
    <section className="relative bg-[#FAF9F6]">
      {block.imageUrl && (
        <div className="absolute inset-0">
          <img src={block.imageUrl} alt={block.imageAlt || ''} className="h-full w-full object-cover" />
          {block.overlay !== false && <div className="absolute inset-0 bg-zinc-950/60" />}
        </div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''}`}>
          {block.eyebrow && <p className={`text-xs font-semibold uppercase tracking-[.22em] text-amber-400 mb-4 ${centered ? 'mx-auto' : ''}`}>{block.eyebrow}</p>}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight text-white">{block.title || 'Titular de la página'}</h1>
          {block.subtitle && <p className="mt-5 text-lg text-zinc-200 sm:text-xl">{block.subtitle}</p>}
          {block.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">{block.description}</p>}
          <PrimaryCta cta={block.cta} secondary={block.secondaryCta} />
        </div>
      </div>
    </section>
  );
}

function TextBlockView({ block }: { block: TextBlock }) {
  const centered = block.align === 'center';
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''}`}>
        {block.title && <h2 className="font-display text-3xl text-zinc-900 sm:text-4xl leading-tight">{block.title}</h2>}
        {block.subtitle && <p className={`mt-3 text-sm font-semibold uppercase tracking-widest ${ACCENT}`}>{block.subtitle}</p>}
        {block.body && <p className="mt-6 text-base leading-relaxed text-zinc-600 whitespace-pre-line">{block.body}</p>}
      </div>
    </section>
  );
}

function CtaBannerBlockView({ block }: { block: CtaBannerBlock }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="bg-zinc-900 px-6 py-14 text-center sm:px-16">
        <h2 className="font-display text-3xl text-white sm:text-4xl">{block.title}</h2>
        {block.description && <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">{block.description}</p>}
        {block.cta && block.cta.label && (
          <a href={block.cta.link || '#'} className="mt-8 inline-flex items-center bg-amber-500 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-amber-400">
            {block.cta.label}
          </a>
        )}
      </div>
    </section>
  );
}

function gridCols(cols: 2 | 3 | 4): string {
  if (cols === 2) return 'sm:grid-cols-2';
  if (cols === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
  return 'sm:grid-cols-2 lg:grid-cols-3';
}

function CardsBlockView({ block }: { block: CardsBlock }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead kicker={block.subtitle} title={block.title} />
      <div className={`grid grid-cols-1 gap-6 ${gridCols(block.columns || 3)}`}>
        {block.items.map((item) => (
          <article key={item.id} className="group border border-zinc-100 bg-white overflow-hidden flex flex-col">
            {item.imageUrl && (
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                <img src={item.imageUrl} alt={item.imageAlt || ''} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {item.badge && <span className="absolute top-3 left-3 bg-zinc-900 text-white text-[10px] px-2 py-1 font-semibold uppercase tracking-widest">{item.badge}</span>}
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              {item.title && <h3 className="font-display text-xl text-zinc-900">{item.title}</h3>}
              {item.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">{item.description}</p>}
              {item.link && item.linkLabel && (
                <a href={item.link} className={`mt-4 text-xs font-semibold uppercase tracking-widest ${LINK_CLASS}`}>{item.linkLabel}</a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GalleryBlockView({ block }: { block: GalleryBlock }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className={`grid grid-cols-1 gap-4 ${gridCols(block.columns || 3)}`}>
        {block.images.map((image) => (
          <figure key={image.id} className="group overflow-hidden bg-zinc-100">
            <img src={image.url} alt={image.alt || ''} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {image.alt && <figcaption className="px-3 py-2 text-xs text-zinc-500">{image.alt}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

function ImageBlockView({ block }: { block: SingleImageBlock }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <figure className="mx-auto max-w-4xl">
        <img src={block.url} alt={block.alt || ''} className="w-full object-cover" />
        {block.caption && <figcaption className="mt-3 text-sm text-zinc-500">{block.caption}</figcaption>}
      </figure>
    </section>
  );
}

function LogosBlockView({ block }: { block: LogosBlock }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead title={block.title} subtitle={block.subtitle} align="center" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {block.items.map((logo) => (
          <div key={logo.id} className="flex items-center justify-center border border-zinc-100 bg-white p-6">
            {logo.imageUrl ? <img src={logo.imageUrl} alt={logo.alt || logo.name || ''} className="max-h-16 object-contain" /> : <span className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{logo.name || 'Logo'}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function NewsBlockView({ block }: { block: NewsBlock }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead title={block.title} subtitle={block.subtitle} />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {block.items.map((item) => (
          <article key={item.id} className="group flex flex-col border border-zinc-100 bg-white overflow-hidden">
            {item.imageUrl && (
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                <img src={item.imageUrl} alt={item.imageAlt || ''} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 flex items-center gap-3 text-[11px] uppercase tracking-widest text-zinc-400">
                {item.badge && <span className={`font-semibold ${ACCENT}`}>{item.badge}</span>}
                {item.date && <span>{item.date}</span>}
              </div>
              <h3 className="font-display text-lg text-zinc-900 leading-snug">{item.title}</h3>
              {item.excerpt && <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">{item.excerpt}</p>}
              {item.link && <a href={item.link} target="_blank" rel="noreferrer" className={`mt-4 text-xs font-semibold uppercase tracking-widest ${LINK_CLASS}`}>Leer más</a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductGridBlockView({ block, products }: { block: ProductGridBlock; products?: RenderContext['products'] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead title={block.title} subtitle={block.subtitle} />
      {!products || products.length === 0 ? (
        <p className="text-sm text-zinc-400">Los productos publicados aparecerán aquí en vivo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const image = product.image_url || (product.image_urls && product.image_urls[0]) || '';
            return (
              <article key={product.id} className="group border border-zinc-100 bg-white overflow-hidden">
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                  {image && <img src={image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-zinc-900">{product.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">$ {Number(product.price).toLocaleString('es-AR')}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DividerBlockView() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-t border-zinc-100" />
    </div>
  );
}

export function renderBlock(block: PageBlock, context?: RenderContext): React.ReactElement | null {
  if (!block.visible) return null;
  switch (block.type) {
    case 'hero': return <HeroBlockView block={block} />;
    case 'text': return <TextBlockView block={block} />;
    case 'cta_banner': return <CtaBannerBlockView block={block} />;
    case 'cards': return <CardsBlockView block={block} />;
    case 'gallery': return <GalleryBlockView block={block} />;
    case 'image': return <ImageBlockView block={block} />;
    case 'logos': return <LogosBlockView block={block} />;
    case 'news': return <NewsBlockView block={block} />;
    case 'divider': return <DividerBlockView />;
    case 'product_grid': return <ProductGridBlockView block={block} products={context?.products} />;
    default: return null;
  }
}

export function renderBlocks(blocks: PageBlock[], context?: RenderContext): React.ReactElement {
  const visible = blocks.filter((block) => block.visible);
  return <>{visible.map((block) => <React.Fragment key={block.id}>{renderBlock(block, context)}</React.Fragment>)}</>;
}