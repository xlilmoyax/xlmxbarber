/**
 * Editor de páginas del panel administrativo.
 * - Listado de las 7 páginas gestionadas.
 * - Editor por bloques reordenables (drag & drop), visibilidad por bloque,
 *   imágenes con carga a Supabase Storage, vista previa desktop/móvil,
 *   validación y pipeline de guardado (Supabase + commit/push/workflow opcional).
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  GripVertical, Eye, EyeOff, Trash2, Plus, ChevronDown, ChevronRight, Save, X,
  Monitor, Smartphone, ImagePlus, CheckCircle2, XCircle, Loader2, GitBranch,
  Rocket, Globe, AlertTriangle, ArrowUp, ArrowDown, FileJson,
} from 'lucide-react';
import { PageBlock, BlockType, BLOCK_TYPES, createBlock, renderBlocks, Cta } from '../lib/pageBlocks';
import { loadPage, savePage, uploadPageImage, MANAGED_PAGES, SitePage, ManagedPage } from '../lib/pageStore';
import { githubPublish, PublishResult } from '../lib/githubPublish';

type StageState = 'pendiente' | 'procesando' | 'ok' | 'error' | 'skip';
type BlockErrors = Record<string, Record<string, string>>;

const STAGE_META: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'validar', label: 'Validar', icon: CheckCircle2 },
  { key: 'guardar', label: 'Supabase', icon: Globe },
  { key: 'commit', label: 'Commit', icon: GitBranch },
  { key: 'push', label: 'Push', icon: Rocket },
  { key: 'workflow', label: 'Workflow', icon: Rocket },
];

function stageUi(status: StageState): { cls: string; dot: string; icon?: React.ElementType } {
  switch (status) {
    case 'procesando': return { cls: 'border-amber-400 text-amber-700 bg-amber-50', dot: 'bg-amber-500 animate-pulse' };
    case 'ok': return { cls: 'border-emerald-300 text-emerald-800 bg-emerald-50', dot: 'bg-emerald-500' };
    case 'error': return { cls: 'border-red-300 text-red-800 bg-red-50', dot: 'bg-red-500' };
    case 'skip': return { cls: 'border-zinc-200 text-zinc-400 bg-zinc-50', dot: 'bg-zinc-300' };
    default: return { cls: 'border-zinc-200 text-zinc-500 bg-white', dot: 'bg-zinc-300' };
  }
}

/* ----------------------------- helpers de campos ----------------------------- */

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#3A3A3A]">{label}{required && <span className="text-[#F50078]"> *</span>}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-[11px] text-[#F50078]">{error}</span>}
    </label>
  );
}

const inputCls = (invalid?: boolean) => `w-full border ${invalid ? 'border-[#F50078]' : 'border-[#E8E3DA]'} bg-white px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#C9A24D]`;

function TextInput({ value, onChange, required, error, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; required?: boolean; error?: string; placeholder?: string; type?: string }) {
  return (
    <Field label={labelFromPlaceholder(placeholder)} required={required} error={error}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls(!!error)} />
    </Field>
  );
}

function labelFromPlaceholder(placeholder?: string): string {
  return placeholder || 'Texto';
}

function TextArea({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) {
  return (
    <Field label={placeholder || 'Texto'} error={error}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className={inputCls(!!error)} />
    </Field>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls()}>
        {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </Field>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-xs font-medium text-[#3A3A3A]">{label}</span>
      <span className="relative inline-flex">

        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className={`h-5 w-9 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-300'}`}><span className={`block h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} /></span>
      </span>
    </label>
  );
}

function CtaFields({ value, onChange }: { value: Cta | null; onChange: (v: Cta | null) => void }) {
  const current = value || { label: '', link: '' };
  return (
    <div className="space-y-2 rounded border border-[#E8E3DA] bg-[#FAF9F6] p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#3A3A3A]">Botón (CTA)</span>
        <button type="button" onClick={() => onChange(null)} className="text-[11px] text-[#F50078]">Quitar botón</button>
      </div>
      <TextInput value={current.label} onChange={(v) => onChange({ ...current, label: v })} placeholder="Texto del botón" />
      <TextInput value={current.link} onChange={(v) => onChange({ ...current, link: v })} placeholder="Enlace (https://… o #seccion)" />
    </div>
  );
}

function ImageField({ label, value, onChange, altValue, onAltChange, required, error }: {
  label: string; value: string; onChange: (v: string) => void; altValue?: string; onAltChange?: (v: string) => void; required?: boolean; error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const result = await uploadPageImage(file);
    setBusy(false);
    if (result.url) onChange(result.url);
    else alert('No se pudo subir la imagen: ' + result.error);
    event.target.value = '';
  }
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-[#3A3A3A]">{label}{required && <span className="text-[#F50078]"> *</span>}</span>
      {value ? (
        <div className="flex items-start gap-3">
          <img src={value} alt="Vista previa" className="h-20 w-20 border border-[#E8E3DA] object-cover" />
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => fileRef.current?.click()} className="border border-[#1B1B1B] px-3 py-1.5 text-xs">Reemplazar</button>
            <button type="button" onClick={() => onChange('')} className="border border-[#F50078]/40 px-3 py-1.5 text-xs text-[#F50078]">Quitar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 border border-dashed border-[#C9A24D] bg-[#FFF9E9] px-3 py-3 text-xs font-semibold text-[#8A6514]">
          <ImagePlus className="h-4 w-4" /> Subir imagen desde tu equipo
          <span className="font-normal text-[#A88A4A]">JPG · PNG · WEBP</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleFile} />
      {onAltChange && <input value={altValue || ''} onChange={(e) => onAltChange(e.target.value)} placeholder="Texto alternativo (accesibilidad)" className={inputCls()} />}
      {busy && <p className="text-xs text-[#667085]">Subiendo…</p>}
      {error && <span className="block text-[11px] text-[#F50078]">{error}</span>}
    </div>
  );
}

/* ---------------------------- formulario por bloque ---------------------------- */

function BlockFields({ block, errors, patch, patchItem, addItem, removeItem }: {
  block: PageBlock; errors?: Record<string, string>;
  patch: (patch: Partial<any>) => void; patchItem: (field: string, index: number, patch: Partial<any>) => void;
  addItem: (field: string) => void; removeItem: (field: string, index: number) => void;
}) {
  switch (block.type) {
    case 'hero': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.eyebrow || ''} onChange={(v) => patch({ eyebrow: v })} placeholder="Texto superior pequeño (opcional)" />
          <TextInput value={b.title} onChange={(v) => patch({ title: v })} required error={errors?.title} placeholder="Título principal *" />
          <TextInput value={b.subtitle || ''} onChange={(v) => patch({ subtitle: v })} placeholder="Subtítulo" />
          <TextArea value={b.description || ''} onChange={(v) => patch({ description: v })} placeholder="Descripción" />
          <ImageField label="Imagen de fondo" value={b.imageUrl || ''} onChange={(v) => patch({ imageUrl: v })} altValue={b.imageAlt} onAltChange={(v) => patch({ imageAlt: v })} />
          <SelectField label="Alineación" value={b.align || 'left'} onChange={(v) => patch({ align: v })} options={[['left', 'Izquierda'], ['center', 'Centro']]} />
          <ToggleField label="Fondo oscurecido sobre la imagen" checked={b.overlay !== false} onChange={(v) => patch({ overlay: v })} />
          <CtaFields value={b.cta} onChange={(v) => patch({ cta: v })} />
          <CtaFields value={b.secondaryCta} onChange={(v) => patch({ secondaryCta: v })} />
        </div>
      );
    }
    case 'text': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.title || ''} onChange={(v) => patch({ title: v })} placeholder="Título" />
          <TextInput value={b.subtitle || ''} onChange={(v) => patch({ subtitle: v })} placeholder="Subtítulo / etiqueta" />
          <TextArea value={b.body || ''} onChange={(v) => patch({ body: v })} placeholder="Cuerpo del texto" />
          <SelectField label="Alineación" value={b.align || 'left'} onChange={(v) => patch({ align: v })} options={[['left', 'Izquierda'], ['center', 'Centro']]} />
        </div>
      );
    }
    case 'cta_banner': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.title} onChange={(v) => patch({ title: v })} required error={errors?.title} placeholder="Título del banner *" />
          <TextArea value={b.description || ''} onChange={(v) => patch({ description: v })} placeholder="Descripción" />
          <CtaFields value={b.cta} onChange={(v) => patch({ cta: v })} />
        </div>
      );
    }
    case 'cards': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.title || ''} onChange={(v) => patch({ title: v })} placeholder="Título de la sección" />
          <TextInput value={b.subtitle || ''} onChange={(v) => patch({ subtitle: v })} placeholder="Etiqueta superior" />
          <SelectField label="Columnas" value={String(b.columns || 3)} onChange={(v) => patch({ columns: Number(v) as 2 | 3 | 4 })} options={[['2', '2 columnas'], ['3', '3 columnas'], ['4', '4 columnas']]} />
          <div className="space-y-3">
            {b.items.map((item, index) => (
              <div key={item.id} className="space-y-2 rounded border border-[#E8E3DA] bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#667085]">Tarjeta {index + 1}{errors?.[`items:${index}`] && <span className="ml-2 text-[#F50078] normal-case">{errors[`items:${index}`]}</span>}</span>
                  <button type="button" onClick={() => removeItem('items', index)} className="text-[#F50078]"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <TextInput value={item.title || ''} onChange={(v) => patchItem('items', index, { title: v })} placeholder="Título de la tarjeta" />
                <TextArea value={item.description || ''} onChange={(v) => patchItem('items', index, { description: v })} placeholder="Descripción" />
                <ImageField label="Imagen" value={item.imageUrl || ''} onChange={(v) => patchItem('items', index, { imageUrl: v })} altValue={item.imageAlt} onAltChange={(v) => patchItem('items', index, { imageAlt: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput value={item.badge || ''} onChange={(v) => patchItem('items', index, { badge: v })} placeholder="Etiqueta (opcional)" />
                  <TextInput value={item.linkLabel || ''} onChange={(v) => patchItem('items', index, { linkLabel: v })} placeholder="Texto del enlace" />
                </div>
                <TextInput value={item.link || ''} onChange={(v) => patchItem('items', index, { link: v })} placeholder="Enlace (URL)" />
              </div>
            ))}
            <button type="button" onClick={() => addItem('items')} className="flex w-full items-center justify-center gap-2 border border-dashed border-[#C9A24D] px-3 py-2.5 text-xs font-semibold text-[#8A6514]"><Plus className="h-4 w-4" />Añadir tarjeta</button>
            {errors?.items && <p className="text-[11px] text-[#F50078]">{errors.items}</p>}
          </div>
        </div>
      );
    }
    case 'gallery': {
      const b = block;
      return (
        <div className="space-y-3">
          <SelectField label="Columnas" value={String(b.columns || 3)} onChange={(v) => patch({ columns: Number(v) as 2 | 3 | 4 })} options={[['2', '2 columnas'], ['3', '3 columnas'], ['4', '4 columnas']]} />
          {b.images.map((image, index) => (
            <div key={image.id} className="space-y-2 rounded border border-[#E8E3DA] bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#667085]">Imagen {index + 1}</span>
                <button type="button" onClick={() => removeItem('images', index)} className="text-[#F50078]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <ImageField label="Imagen" value={image.url} onChange={(v) => patchItem('images', index, { url: v })} altValue={image.alt} onAltChange={(v) => patchItem('images', index, { alt: v })} />
            </div>
          ))}
          <button type="button" onClick={() => addItem('images')} className="flex w-full items-center justify-center gap-2 border border-dashed border-[#C9A24D] px-3 py-2.5 text-xs font-semibold text-[#8A6514]"><Plus className="h-4 w-4" />Añadir imagen</button>
          {errors?.images && <p className="text-[11px] text-[#F50078]">{errors.images}</p>}
        </div>
      );
    }
    case 'image': {
      const b = block;
      return (
        <div className="space-y-3">
          <ImageField label="Imagen" value={b.url} onChange={(v) => patch({ url: v })} required error={errors?.url} altValue={b.alt} onAltChange={(v) => patch({ alt: v })} />
          <TextInput value={b.caption || ''} onChange={(v) => patch({ caption: v })} placeholder="Pie de foto" />
          <TextInput value={b.link || ''} onChange={(v) => patch({ link: v })} placeholder="Enlace al hacer clic (opcional)" />
        </div>
      );
    }
    case 'logos': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.title || ''} onChange={(v) => patch({ title: v })} placeholder="Título de la sección" />
          <TextInput value={b.subtitle || ''} onChange={(v) => patch({ subtitle: v })} placeholder="Subtexto" />
          {b.items.map((logo, index) => (
            <div key={logo.id} className="space-y-2 rounded border border-[#E8E3DA] bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#667085]">Aliado {index + 1}{errors?.[`items:${index}`] && <span className="ml-2 text-[#F50078] normal-case">{errors[`items:${index}`]}</span>}</span>
                <button type="button" onClick={() => removeItem('items', index)} className="text-[#F50078]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <ImageField label="Logo" value={logo.imageUrl} onChange={(v) => patchItem('items', index, { imageUrl: v })} altValue={logo.alt} onAltChange={(v) => patchItem('items', index, { alt: v })} />
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={logo.name || ''} onChange={(v) => patchItem('items', index, { name: v })} placeholder="Nombre (si no usa imagen)" />
                <TextInput value={logo.url || ''} onChange={(v) => patchItem('items', index, { url: v })} placeholder="Enlace del aliado" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addItem('items')} className="flex w-full items-center justify-center gap-2 border border-dashed border-[#C9A24D] px-3 py-2.5 text-xs font-semibold text-[#8A6514]"><Plus className="h-4 w-4" />Añadir aliado</button>
          {errors?.items && <p className="text-[11px] text-[#F50078]">{errors.items}</p>}
        </div>
      );
    }
    case 'news': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.title || ''} onChange={(v) => patch({ title: v })} placeholder="Título de la sección" />
          <TextInput value={b.subtitle || ''} onChange={(v) => patch({ subtitle: v })} placeholder="Subtexto" />
          {b.items.map((item, index) => (
            <div key={item.id} className="space-y-2 rounded border border-[#E8E3DA] bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#667085]">Novedad {index + 1}{errors?.[`items:${index}`] && <span className="ml-2 text-[#F50078] normal-case">{errors[`items:${index}`]}</span>}</span>
                <button type="button" onClick={() => removeItem('items', index)} className="text-[#F50078]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <TextInput value={item.title} onChange={(v) => patchItem('items', index, { title: v })} placeholder="Título *" />
              <TextArea value={item.excerpt || ''} onChange={(v) => patchItem('items', index, { excerpt: v })} placeholder="Extracto" />
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={item.badge || ''} onChange={(v) => patchItem('items', index, { badge: v })} placeholder="Etiqueta (ej: Lanzamiento)" />
                <TextInput value={item.date || ''} onChange={(v) => patchItem('items', index, { date: v })} placeholder="Fecha (ej: 12 Sep)" />
              </div>
              <TextInput value={item.link || ''} onChange={(v) => patchItem('items', index, { link: v })} placeholder="Enlace al artículo" />
              <ImageField label="Imagen" value={item.imageUrl || ''} onChange={(v) => patchItem('items', index, { imageUrl: v })} altValue={item.imageAlt} onAltChange={(v) => patchItem('items', index, { imageAlt: v })} />
            </div>
          ))}
          <button type="button" onClick={() => addItem('items')} className="flex w-full items-center justify-center gap-2 border border-dashed border-[#C9A24D] px-3 py-2.5 text-xs font-semibold text-[#8A6514]"><Plus className="h-4 w-4" />Añadir novedad</button>
          {errors?.items && <p className="text-[11px] text-[#F50078]">{errors.items}</p>}
        </div>
      );
    }
    case 'product_grid': {
      const b = block;
      return (
        <div className="space-y-3">
          <TextInput value={b.title || ''} onChange={(v) => patch({ title: v })} placeholder="Título de la sección" />
          <TextInput value={b.subtitle || ''} onChange={(v) => patch({ subtitle: v })} placeholder="Subtexto" />
          <p className="text-xs text-[#667085]">Muestra los productos publicados en la tienda, en vivo.</p>
        </div>
      );
    }
    case 'divider':
      return <p className="text-xs text-[#667085]">Separador visual. No tiene opciones.</p>;
    default:
      return null;
  }
}

/* ------------------------------- formulario por bloque ------------------------------- */

function BlockCard({ block, index, total, errors, onPatch, onDelete, onMove, onToggle, dragIndex, onDragStart, onDragOver, onDrop }: {
  block: PageBlock; index: number; total: number; errors?: Record<string, string>;
  onPatch: (patch: Partial<any>) => void; onDelete: () => void; onMove: (dir: -1 | 1) => void;
  onToggle: () => void; dragIndex: number | null; onDragStart: (index: number) => void;
  onDragOver: (index: number) => void; onDrop: () => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const meta = BLOCK_TYPES.find((meta) => meta.type === block.type);
  const hasErrors = errors && Object.keys(errors).length > 0;

  function patchItem(field: string, itemIndex: number, patch: Partial<any>) {
    const itemsRef = (block as any)[field];
    if (!Array.isArray(itemsRef)) return;
    const next = itemsRef.map((item: any, i: number) => (i === itemIndex ? { ...item, ...patch } : item));
    onPatch({ [field]: next });
  }
  function addItem(field: string) {
    const itemsRef = (block as any)[field];
    if (!Array.isArray(itemsRef)) return;
    onPatch({ [field]: [...itemsRef, { id: Math.random().toString(36).slice(2, 10) }] });
  }
  function removeItem(field: string, itemIndex: number) {
    const itemsRef = (block as any)[field];
    if (!Array.isArray(itemsRef)) return;
    onPatch({ [field]: itemsRef.filter((_: any, i: number) => i !== itemIndex) });
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className={`rounded border bg-white ${dragIndex === index ? 'border-[#C9A24D] ring-2 ring-[#C9A24D]/30' : 'border-[#E8E3DA]'}`}
    >
      <div className="flex items-center gap-2 border-b border-[#E8E3DA] px-3 py-2.5">
        <span className="cursor-grab text-[#C9A24D]" title="Arrastrar para reordenar"><GripVertical className="h-4 w-4" /></span>
        <button type="button" onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {open ? <ChevronDown className="h-4 w-4 text-[#667085]" /> : <ChevronRight className="h-4 w-4 text-[#667085]" />}
          <span className="truncate text-sm font-semibold text-[#151515]">{meta?.label || block.type}</span>
        </button>
        <button type="button" onClick={onToggle} className={`p-1 ${block.visible ? 'text-emerald-600' : 'text-zinc-300'}`} title={block.visible ? 'Visible' : 'Oculto'}>
          {block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onDelete} className="p-1 text-[#F50078]" title="Eliminar bloque"><Trash2 className="h-4 w-4" /></button>
      </div>
      {open && (
        <div className="space-y-3 p-3">
          <BlockFields block={block} errors={errors} patch={onPatch} patchItem={patchItem} addItem={addItem} removeItem={removeItem} />
          <div className="flex items-center justify-between border-t border-[#E8E3DA] pt-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-300">{index + 1} / {total}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="flex items-center gap-1 border border-[#E8E3DA] px-2 py-1 text-xs disabled:opacity-40"><ArrowUp className="h-3 w-3" /> Mover arriba</button>
              <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="flex items-center gap-1 border border-[#E8E3DA] px-2 py-1 text-xs disabled:opacity-40"><ArrowDown className="h-3 w-3" /> Mover abajo</button>
            </div>
          </div>
          {hasErrors && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">Completá los campos marcados para poder publicar esta sección.</div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ editor de una página ------------------------------ */

function validatePage(p: SitePage): { top: string[]; blocks: BlockErrors } {
  const top: string[] = [];
  const blocks: BlockErrors = {};
  if (!p.title.trim()) top.push('El título de la página es obligatorio.');
  if (p.published && p.blocks.filter((b) => b.visible).length === 0) top.push('Para publicar la página debe haber al menos un bloque visible.');
  for (const block of p.blocks) {
    if (!block.visible) continue;
    const errs: Record<string, string> = {};
    switch (block.type) {
      case 'hero': if (!block.title.trim()) errs.title = 'El título del héroe es obligatorio.'; break;
      case 'cta_banner': if (!block.title.trim()) errs.title = 'El título del banner es obligatorio.'; break;
      case 'image': if (!block.url.trim()) errs.url = 'Seleccioná una imagen.'; break;
      case 'cards':
        if (block.items.length === 0) errs.items = 'Agregá al menos una tarjeta.';
        else block.items.forEach((item, i) => { if (!item.title?.trim() && !item.imageUrl?.trim()) errs[`items:${i}`] = 'Cada tarjeta necesita título o imagen.'; });
        break;
      case 'gallery':
        if (block.images.length === 0) errs.images = 'Agregá al menos una imagen.';
        break;
      case 'logos': {
        if (block.items.length === 0) errs.items = 'Agregá al menos un aliado.';
        else block.items.forEach((item, i) => { if (!item.imageUrl?.trim() && !item.name?.trim()) errs[`items:${i}`] = 'Cada aliado necesita nombre o logo.'; });
        break;
      }
      case 'news': {
        if (block.items.length === 0) errs.items = 'Agregá al menos una novedad.';
        else block.items.forEach((item, i) => { if (!item.title?.trim()) errs[`items:${i}`] = 'Cada novedad necesita un título.'; });
        break;
      }
      default: break;
    }
    if (Object.keys(errs).length > 0) blocks[block.id] = errs;
  }
  return { top, blocks };
}

function Pipeline({ stages }: { stages: Record<string, StageState> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STAGE_META.map(({ key, label, icon: Icon }, i) => {
        const status = stages[key] || 'pendiente';
        const ui = stageUi(status);
        return (
          <React.Fragment key={key}>
            {i > 0 && <span className="text-zinc-300">·</span>}
            <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${ui.cls}`}>
              {status === 'procesando' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
              {label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PageEditorModal({ meta, initial, onClose, onSaved }: {
  meta: ManagedPage; initial: SitePage | null; onClose: () => void; onSaved: (p: SitePage) => void;
}) {
  const [draft, setDraft] = useState<SitePage>(initial || { slug: meta.slug, title: meta.label, description: '', published: false, blocks: [] });
  const [loading, setLoading] = useState(!initial);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [topErrors, setTopErrors] = useState<string[]>([]);
  const [blockErrors, setBlockErrors] = useState<BlockErrors>({});
  const [stages, setStages] = useState<Record<string, StageState>>({ validar: 'pendiente', guardar: 'pendiente', commit: 'skip', push: 'skip', workflow: 'skip' });
  const [versioned, setVersioned] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [addType, setAddType] = useState<BlockType | ''>('');

  React.useEffect(() => {
    if (!loading) return;
    (async () => {
      const found = await loadPage(meta.slug);
      setDraft(found || { slug: meta.slug, title: meta.label, description: '', published: false, blocks: [] });
      setLoading(false);
    })();
  }, [loading, meta.slug, meta.label]);

  const patchBlock = (blockId: string, patch: Partial<any>) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } as PageBlock : b)) }));
  const removeBlock = (blockId: string) => setDraft((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== blockId) }));
  const toggleBlock = (blockId: string) => setDraft((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, visible: !b.visible } as PageBlock : b)) }));
  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= draft.blocks.length) return;
    setDraft((d) => { const next = [...d.blocks]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return { ...d, blocks: next }; });
  };
  const dropBlock = () => {
    if (dragIndex === null) return;
    if (dragOverIndex !== null && dragOverIndex !== dragIndex) moveBlock(dragIndex, dragOverIndex);
    setDragIndex(null); setDragOverIndex(null);
  };
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addBlock = () => {
    if (!addType) return;
    setDraft((d) => ({ ...d, blocks: [...d.blocks, createBlock(addType)] }));
    setAddType('');
  };

  const handleSave = async () => {
    if (busy) return;
    setSavedOk(false); setSaveError('');
    const validation = validatePage(draft);
    setTopErrors(validation.top);
    setBlockErrors(validation.blocks);
    if (validation.top.length > 0 || Object.keys(validation.blocks).length > 0) {
      setStages((s) => ({ ...s, validar: 'error' }));
      return;
    }
    setBusy(true);
    setStages((s) => ({ ...s, validar: 'ok', guardar: 'procesando', commit: versioned ? 'pendiente' : 'skip', push: versioned ? 'pendiente' : 'skip', workflow: versioned ? 'pendiente' : 'skip' }));
    const res = await savePage(draft);
    if (res.error) {
      setStages((s) => ({ ...s, guardar: 'error' }));
      setSaveError('Supabase: ' + res.error);
      setBusy(false);
      return;
    }
    setStages((s) => ({ ...s, guardar: 'ok' }));
    const persisted = { ...draft, updated_at: new Date().toISOString() };
    onSaved(persisted);
    if (versioned) {
      setStages((s) => ({ ...s, commit: 'procesando' }));
      const snapshot = JSON.stringify({ slug: persisted.slug, title: persisted.title, published: persisted.published, updated_at: persisted.updated_at, blocks: persisted.blocks }, null, 2);
      const pub = await githubPublish({ files: { [`site_content/${persisted.slug}.json`]: snapshot }, message: `Actualizar contenido de la página ${persisted.slug}` });
      if (pub.ok === false) {
        setStages((s) => ({ ...s, commit: 'error' }));
        setSaveError('Commit: ' + pub.error);
        setSavedOk(false);
      } else {
        setStages((s) => ({ ...s, commit: 'ok', push: 'ok', workflow: pub.data.workflowDispatched ? 'ok' : 'error' }));
        setPublishResult(pub.data);
        setSavedOk(true);
      }
    } else {
      setStages((s) => ({ ...s, commit: 'skip', push: 'skip', workflow: 'skip' }));
      setSavedOk(true);
    }
    setBusy(false);
  };

  const visibleCount = draft.blocks.filter((b) => b.visible).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#151515]/60">
      <div className="flex h-full flex-col">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-[#E8E3DA] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[.22em] text-[#C9A24D]">EDITOR DE PÁGINA</p>
            <h2 className="mt-1 font-display text-2xl text-[#151515]">{meta.label}</h2>
            <p className="text-xs text-[#667085]">{meta.hint}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-[#667085] hover:text-[#151515]" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center bg-[#FAF9F6]">
            <Loader2 className="h-6 w-6 animate-spin text-[#C9A24D]" />
            <span className="ml-3 text-sm text-[#667085]">Cargando página…</span>
          </div>
        ) : (
          <div className="grid flex-1 overflow-hidden lg:grid-cols-[460px_1fr]">
            {/* Panel de edición */}
            <div className="flex min-h-0 flex-col border-r border-[#E8E3DA] bg-[#FAF9F6]">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {topErrors.length > 0 && (
                  <div className="rounded border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-800">
                    <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Revisá estos datos antes de guardar:</div>
                    <ul className="list-disc pl-5">{topErrors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                  </div>
                )}
                {saveError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{saveError}</div>}
                {savedOk && !versioned && (
                  <div className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Guardado y publicado en Supabase. La página pública se actualizó de inmediato.{publishResult && publishResult.commitUrl && <a href={publishResult.commitUrl} target="_blank" rel="noreferrer" className="ml-1 font-semibold underline">Ver commit</a>}
                  </div>
                )}

                <Field label="Título de la página" required>
                  <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className={inputCls()} />
                </Field>
                <Field label="Descripción (SEO)">
                  <textarea value={draft.description || ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2} className={inputCls()} />
                </Field>
                <ToggleField label="Página publicada (visible en la web)" checked={draft.published} onChange={(v) => setDraft((d) => ({ ...d, published: v }))} />

                <div className="flex items-center justify-between border-t border-[#E8E3DA] pt-3">
                  <p className="text-sm font-semibold text-[#151515]">Bloques de la página <span className="ml-1 text-xs font-normal text-[#667085]">({visibleCount} visibles de {draft.blocks.length})</span></p>
                </div>

                {draft.blocks.length === 0 && (
                  <p className="rounded border border-dashed border-[#E8E3DA] bg-white px-4 py-6 text-center text-xs text-[#667085]">
                    Todavía no hay bloques. Agregá el primero abajo. Mientras no publiques bloques, la web seguirá mostrando el contenido actual.
                  </p>
                )}

                <div className="space-y-3">
                  {draft.blocks.map((block, index) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      index={index}
                      total={draft.blocks.length}
                      errors={blockErrors[block.id]}
                      onPatch={(patch) => patchBlock(block.id, patch)}
                      onDelete={() => removeBlock(block.id)}
                      onMove={(dir) => moveBlock(index, index + dir)}
                      onToggle={() => toggleBlock(block.id)}
                      dragIndex={dragIndex}
                      onDragStart={setDragIndex}
                      onDragOver={setDragOverIndex}
                      onDrop={dropBlock}
                    />
                  ))}
                </div>

                <div className="rounded border border-[#E8E3DA] bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#151515]"><Plus className="h-4 w-4 text-[#C9A24D]" /> Añadir bloque</div>
                  <div className="flex gap-2">
                    <select value={addType} onChange={(e) => setAddType(e.target.value as BlockType | '')} className="flex-1 border border-[#E8E3DA] bg-white px-3 py-2 text-sm">
                      <option value="">Elegí un tipo…</option>
                      {BLOCK_TYPES.map((meta) => <option key={meta.type} value={meta.type}>{meta.label}</option>)}
                    </select>
                    <button type="button" onClick={addBlock} disabled={!addType} className="flex items-center gap-1 bg-[#1B1B1B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Añadir</button>
                  </div>
                </div>

                {/* Avanzado: snapshot versionado */}
                <div className="rounded border border-[#E8E3DA] bg-white p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#151515]"><FileJson className="h-4 w-4 text-[#C9A24D]" /> Snapshot versionado (GitHub)</div>
                  <p className="mb-2 text-xs text-[#667085]">Solo para cambios que deban quedar versionados o desplegar nuevas plantillas/configuración. Guarda un snapshot de esta página en el repositorio y dispara el workflow de despliegue. Requiere el backend seguro configurado.</p>
                  <ToggleField label="Commit + push + workflow al guardar" checked={versioned} onChange={setVersioned} />
                  <p className="mt-2 text-[10px] text-[#667085]">La credencial de GitHub vive en el servidor; acá solo se envía tu sesión de admin verificada.</p>
                </div>
              </div>

              {/* Barra inferior */}
              <div className="space-y-3 border-t border-[#E8E3DA] bg-white p-4">
                <Pipeline stages={stages} />
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={onClose} className="border border-[#1B1B1B] px-5 py-2.5 text-sm">Cancelar</button>
                  <button type="button" onClick={handleSave} disabled={busy} className="flex items-center gap-2 bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#151515] disabled:opacity-60">
                    <Save className="h-4 w-4" /> {busy ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>

            {/* Vista previa */}
            <div className="flex min-h-0 flex-col bg-zinc-100">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500"><Monitor className="h-4 w-4" /> Vista previa</span>
                <div className="flex overflow-hidden rounded border border-zinc-200">
                  <button type="button" onClick={() => setDevice('desktop')} className={`flex items-center gap-1 px-3 py-1.5 text-xs ${device === 'desktop' ? 'bg-zinc-900 text-white' : 'text-zinc-500'}`}><Monitor className="h-3.5 w-3.5" /> Escritorio</button>
                  <button type="button" onClick={() => setDevice('mobile')} className={`flex items-center gap-1 px-3 py-1.5 text-xs ${device === 'mobile' ? 'bg-zinc-900 text-white' : 'text-zinc-500'}`}><Smartphone className="h-3.5 w-3.5" /> Móvil</button>
                </div>
              </div>
              <div className="min-h-0 flex-1 p-4">
                <div className={`mx-auto overflow-y-auto rounded border border-zinc-200 bg-white shadow-lg ${device === 'mobile' ? 'max-w-[375px]' : 'max-w-[1100px]'}`} style={{ maxHeight: 'calc(100vh - 210px)' }}>
                  {draft.blocks.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center text-sm text-zinc-400">
                      <p className="font-display text-lg text-zinc-600">Contenido actual (no editado)</p>
                      <p className="mt-2 text-xs">Esta sección sigue mostrando el diseño original de la web hasta que agregues y publiques bloques.</p>
                    </div>
                  ) : (
                    renderBlocks(draft.blocks)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ listado de páginas ------------------------------ */

export default function PagesManager({ onNavigate }: { onNavigate?: (screen: string) => void } = {}) {
  const [pages, setPages] = useState<Record<string, SitePage | null>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ManagedPage | null>(null);
  const [notice, setNotice] = useState('');

  React.useEffect(() => {
    (async () => {
      const entries: Record<string, SitePage | null> = {};
      await Promise.all(MANAGED_PAGES.map(async (meta) => { entries[meta.slug] = await loadPage(meta.slug); }));
      setPages(entries);
      setLoading(false);
    })();
  }, []);

  const onSaved = (page: SitePage) => {
    setPages((p) => ({ ...p, [page.slug]: page }));
    setNotice(`Página “${page.title}” guardada${page.published ? ' y publicada' : ' como borrador'}.`);
    setTimeout(() => setNotice(''), 5000);
  };

  if (loading) {
    return <div className="flex items-center gap-3 py-12 text-sm text-[#667085]"><Loader2 className="h-5 w-5 animate-spin text-[#C9A24D]" /> Cargando páginas…</div>;
  }

  const publishedCount = Object.values(pages).filter(p=> p?.published && p.blocks.filter(b=>b.visible).length>0).length;
  const draftCount = Object.values(pages).filter(p=> p?.published && p.blocks.filter(b=>b.visible).length===0).length;
  const pendingCount = MANAGED_PAGES.length - publishedCount - draftCount;
  const slugToScreen: Record<string,string> = { inicio: 'home', servicios: 'servicio-domicilio', aliados: 'sobre-nosotros', afiliados: 'membresias', novedades: 'home', cursos: 'cursos', productos: 'productos' };

  return (
    <section className="space-y-5">
      {/* Header premium */}
      <div className="rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl tracking-tight">Páginas del sitio</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#667085]">Editá bloques reordenables, textos, imágenes y visibilidad. Guardá para publicar al instante en Supabase — sin commit. Usa <span className="rounded bg-[#FAF9F6] px-1.5 py-0.5 font-mono text-xs">Snapshot versionado</span> solo para plantillas o despliegue.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-[#E8E3DA] bg-[#FAF9F6] px-3 py-1 text-xs text-[#667085] sm:inline-flex"><Globe className="h-3.5 w-3.5"/> {MANAGED_PAGES.length} páginas gestionadas</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center ring-1 ring-emerald-200"><p className="text-[11px] uppercase tracking-wide text-emerald-700">Publicadas</p><p className="font-display text-xl">{publishedCount}</p></div>
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-center ring-1 ring-amber-200"><p className="text-[11px] uppercase tracking-wide text-amber-700">Borrador</p><p className="font-display text-xl">{draftCount}</p></div>
          <div className="rounded-xl bg-zinc-50 px-3 py-2 text-center ring-1 ring-zinc-200"><p className="text-[11px] uppercase tracking-wide text-zinc-600">Sin editar</p><p className="font-display text-xl">{pendingCount}</p></div>
        </div>
      </div>

      {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm"><CheckCircle2 className="h-4 w-4" /> {notice}</div>}

      <div className="overflow-hidden rounded-2xl border border-[#E8E3DA] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-[#E8E3DA] bg-[#FAF9F6] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">Listado de páginas</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-[#E8E3DA]">{MANAGED_PAGES.length} totales</span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#E8E3DA] bg-white text-[11px] uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-4 py-3 font-medium">Página</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Contenido</th>
              <th className="px-4 py-3 font-medium">Última actualización</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {MANAGED_PAGES.map((meta) => {
              const page = pages[meta.slug] || null;
              const isCustom = Boolean(page && page.published && page.blocks.filter((b) => b.visible).length > 0);
              const updatedAt = page?.updated_at;
              return (
                <tr key={meta.slug} className="border-b border-[#E8E3DA] bg-white hover:bg-[#FFF9E9]/60">
                  <td className="p-4">
                    <p className="font-semibold text-[#151515]">{meta.label}</p>
                    <p className="text-xs text-[#667085]">{meta.hint}</p>
                  </td>
                  <td className="p-4">
                    {isCustom ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3"/> Publicado</span>
                      : page?.published ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200"><AlertTriangle className="h-3 w-3"/> Borrador</span>
                      : <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200">Sin editar</span>}
                  </td>
                  <td className="p-4 text-xs text-[#667085]">{isCustom ? `${page!.blocks.length} bloques` : 'Usa el diseño actual de la web'}</td>
                  <td className="p-4 text-xs text-[#667085]">{updatedAt ? new Date(updatedAt).toLocaleString('es-AR') : '—'}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => { const screen = slugToScreen[meta.slug]; if(onNavigate && screen){ onNavigate(screen); } else { window.location.hash = `#${screen||meta.slug}`; } }} className="inline-flex items-center gap-1 rounded-full border border-[#E8E3DA] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><Eye className="h-3.5 w-3.5"/> Ver</button>
                      <button onClick={() => { setEditing(meta); }} className="inline-flex items-center gap-1 rounded-full bg-[#1B1B1B] px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><Save className="h-3.5 w-3.5"/> Editar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-[#667085]">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A24D]" />
        Los cambios de contenido se guardan y publican directo en Supabase (sin commit). Usá la opción <em>Snapshot versionado</em> dentro de cada página solo cuando cambies plantillas, configuración o archivos que sí requieran despliegue a GitHub.
      </p>

      {editing && (
        <PageEditorModal
          meta={editing}
          initial={pages[editing.slug] || null}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </section>
  );
}