import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Check, GripVertical, ImagePlus, Save, Star, Trash2, X, Barcode, Tag } from 'lucide-react';
import { computeFinalPrice, generateProductCode, randomCodeDigits } from '../lib/productHelpers';

type Product = {
  id?: string;
  name: string;
  category_id?: string | null;
  price: number | string;
  original_price?: number | string | null;
  materials?: string;
  brand?: string;
  discount_enabled?: boolean;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number | string;
  stock: number | string;
  description: string;
  highlights?: string;
  status?: 'draft' | 'published' | 'sold_out' | 'archived';
  featured?: boolean;
  is_new?: boolean;
  free_shipping?: boolean;
  customizable?: boolean;
  image_url?: string;
  image_urls?: string[];
};

type Category = { id: string; name: string };
type ProductImage = { id: string; preview: string; url?: string; file?: File; isPrimary: boolean };

const DEFAULT_CATEGORIES: Category[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Barbería' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Capilar' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Dermacosmética' },
];

type Props = {
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const statusLabels = { draft: 'Borrador', published: 'Publicado', sold_out: 'Agotado', archived: 'Archivado' } as const;

export default function ProductEditor({ product, categories, onClose, onSaved }: Props) {
  const availableCategories = DEFAULT_CATEGORIES.map((defaultCategory) => categories.find((category) => category.name.toLowerCase() === defaultCategory.name.toLowerCase()) || defaultCategory);
  const [form, setForm] = useState<Product>({ name: '', category_id: '', price: '', original_price: '', materials: '', brand: '', discount_enabled: false, discount_type: 'percentage', discount_value: '', stock: '', description: '', highlights: '', status: 'draft', featured: false, is_new: false, free_shipping: false, customizable: false });
  const [productType, setProductType] = useState<'A' | 'B'>('A');
  const [skuDigits, setSkuDigits] = useState(randomCodeDigits);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    const code = product.materials?.trim() || '';
    const prefix = /^B-/.test(code) ? 'B' : 'A';
    setProductType(prefix as 'A' | 'B');
    const basePrice = product.discount_enabled && Number(product.original_price) > 0 ? Number(product.original_price) : product.price;
    setForm({ ...product, category_id: product.category_id || '', highlights: product.highlights || '', brand: product.brand || '', discount_enabled: product.discount_enabled ?? false, discount_type: product.discount_type || 'percentage', discount_value: product.discount_value ?? '', price: basePrice, original_price: product.original_price ?? '' });
    const urls = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
    setImages(urls.map((url, index) => ({ id: `existing-${index}`, preview: url, url, isPrimary: index === 0 })));
  }, [product]);

  const update = (field: keyof Product, value: string | number | boolean) => setForm((current) => ({ ...current, [field]: value }));

  const selectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const nextErrors: Record<string, string> = {};
    const valid = files.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) { nextErrors.images = 'Usa JPG, JPEG, PNG, WEBP o AVIF.'; return false; }
      if (file.size > MAX_FILE_SIZE) { nextErrors.images = 'Cada imagen debe pesar como máximo 5 MB.'; return false; }
      return true;
    });
    setErrors((current) => ({ ...current, ...nextErrors }));
    setImages((current) => [...current, ...valid.map((file, index) => ({ id: `${file.name}-${file.lastModified}-${index}`, preview: URL.createObjectURL(file), file, isPrimary: current.length === 0 && index === 0 }))]);
    event.target.value = '';
  };

  const addUrl = () => {
    const url = imageUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) { setErrors((current) => ({ ...current, images: 'La URL debe comenzar con http:// o https://' })); return; }
    setImages((current) => [...current, { id: `url-${Date.now()}`, preview: url, url, isPrimary: current.length === 0 }]);
    setImageUrl('');
  };

  const removeImage = (id: string) => setImages((current) => {
    const remaining = current.filter((image) => image.id !== id);
    if (remaining.length && !remaining.some((image) => image.isPrimary)) remaining[0].isPrimary = true;
    return remaining;
  });
  const setPrimary = (id: string) => setImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === id })));
  const moveImage = (index: number, direction: -1 | 1) => setImages((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });

  const computeFinal = () => computeFinalPrice(form.price, Boolean(form.discount_enabled), form.discount_type, form.discount_value);

  const validate = () => {
    const next: Record<string, string> = {};
    const base = Number(form.price) || 0;
    const final = computeFinal();
    const discountValue = Number(form.discount_value) || 0;
    if (!form.name?.trim()) next.name = 'El nombre es obligatorio.';
    if (!form.category_id) next.category_id = 'Selecciona una categoría.';
    if (form.price === '' || base <= 0) next.price = 'Indica un precio válido.';
    if (form.discount_enabled) {
      if (discountValue <= 0) next.discount = 'Ingresa un valor de descuento mayor a 0.';
      else if (final <= 0) next.discount = 'El precio final no puede quedar en cero o negativo.';
    }
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Indica un stock válido.';
    if (!form.description?.trim()) next.description = 'La descripción es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true); setMessage('');
    try {
      const productId = product?.id || crypto.randomUUID();
      const finalPrice = computeFinal();
      const basePrice = Number(form.price) || 0;
      const hasDiscount = Boolean(form.discount_enabled) && Number(form.discount_value) > 0 && finalPrice > 0 && finalPrice < basePrice;

      let sku = product?.materials?.trim() || '';
      if (!sku) {
        const { data: existing } = await supabase.from('products').select('materials');
        const codes = (existing || []).map((row: any) => row.materials || '');
        sku = generateProductCode(productType, codes);
      }

      const uploadedUrls = new Map<string, string>();
      for (const image of images) {
        if (!image.file) continue;
        const path = `${productId}/${crypto.randomUUID()}-${image.file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const upload = await supabase.storage.from('product-images').upload(path, image.file, { upsert: false, contentType: image.file.type });
        if (upload.error) throw new Error(`No se pudo subir ${image.file.name}: ${upload.error.message}`);
        const publicUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        uploadedUrls.set(image.id, publicUrl);
      }
      const orderedUrls = images.map((image) => image.url || uploadedUrls.get(image.id)).filter(Boolean) as string[];
      const primaryIndex = images.findIndex((image) => image.isPrimary);
      const result = await supabase.from('products').upsert({ id: productId, name: form.name.trim(), category_id: form.category_id, price: finalPrice, original_price: hasDiscount ? basePrice : null, materials: sku, brand: form.brand?.trim() || '', discount_enabled: hasDiscount, discount_type: form.discount_type || 'percentage', discount_value: hasDiscount ? Number(form.discount_value) : 0, stock: Number(form.stock), description: form.description.trim(), highlights: form.highlights?.trim() || '', status: form.status || 'draft', featured: Boolean(form.featured), is_new: Boolean(form.is_new), free_shipping: Boolean(form.free_shipping), customizable: Boolean(form.customizable), image_urls: orderedUrls, image_url: orderedUrls[primaryIndex >= 0 ? primaryIndex : 0] || '' });
      if (result.error) throw new Error(result.error.message);
      setMessage('Producto guardado correctamente.');
      await onSaved();
      setTimeout(onClose, 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#151515]/55 px-3 py-6 sm:px-6">
    <div className="mx-auto max-w-5xl bg-[#FAF9F6] shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#E8E3DA] bg-white px-5 py-5 sm:px-8"><div><p className="text-xs font-semibold tracking-[.22em] text-[#C9A24D]">NUEVO PRODUCTO</p><h2 className="mt-1 font-display text-2xl text-[#151515] sm:text-3xl">{product ? 'Editar Pieza del Catálogo' : 'Añadir Pieza al Catálogo'}</h2></div><button type="button" onClick={() => { if (confirm('¿Descartar los cambios no guardados?')) onClose(); }} className="p-2 text-[#667085] hover:text-[#151515]" aria-label="Cerrar formulario"><X className="h-5 w-5" /></button></div>
      <form onSubmit={save} className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <label className="block text-sm font-medium">Nombre de la pieza *<input value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" />{errors.name && <small className="text-[#F50078]">{errors.name}</small>}</label>
          <label className="block text-sm font-medium">Categoría *<select value={form.category_id || ''} onChange={(e) => update('category_id', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5"><option value="">Selecciona una categoría</option>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.category_id && <small className="text-[#F50078]">{errors.category_id}</small>}</label><label className="mt-4 block text-sm font-medium">Marca<input value={form.brand || ''} onChange={(e) => update('brand', e.target.value)} placeholder="Ej: Sir Fausto, Idraet, Filler, L3VEL3..." className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Precio base (ARS) *<input type="number" min="0" step=".01" value={form.price} onChange={(e) => update('price', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" />{errors.price && <small className="text-[#F50078]">{errors.price}</small>}</label><div className="flex items-end justify-between rounded bg-[#F6F4EF] px-3 py-2.5"><span className="text-sm text-[#667085]">Precio final</span><span className="text-lg font-bold text-[#151515]">$ {computeFinal().toLocaleString('es-AR')}</span></div></div>
          <div className="rounded border border-[#E8E3DA] bg-white p-4"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold"><Tag className="h-4 w-4 text-[#C9A24D]" />Descuento</p><label className="flex items-center gap-2 text-sm text-[#151515]"><input type="checkbox" checked={Boolean(form.discount_enabled)} onChange={(e) => update('discount_enabled', e.target.checked)} />Activo</label></div>{Boolean(form.discount_enabled) && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Tipo<select value={form.discount_type || 'percentage'} onChange={(e) => update('discount_type', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5"><option value="percentage">Porcentaje (%)</option><option value="fixed">Monto fijo (ARS)</option></select></label><label className="block text-sm font-medium">{form.discount_type === 'fixed' ? 'Valor (ARS)' : 'Porcentaje (%)'} *<input type="number" min="0" step={form.discount_type === 'fixed' ? '.01' : '1'} value={form.discount_value ?? ''} onChange={(e) => update('discount_value', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" /></label>{errors.discount && <small className="text-[#F50078] sm:col-span-2">{errors.discount}</small>}<p className="text-xs text-[#667085] sm:col-span-2">En la tienda se mostrará el precio base tachado y el final en color. Cuando el descuento está inactivo o deja de ser real, no se muestran etiquetas.</p></div>}</div>
          <div className="rounded border border-[#E8E3DA] bg-white p-4"><div className="flex items-center justify-between"><label className="block text-sm font-medium">ID de producto *</label>{(product?.materials || '').trim() ? <span className="rounded bg-[#F6F4EF] px-2 py-0.5 font-mono text-xs font-semibold text-[#151515]">{product.materials}</span> : null}</div>{!product?.materials ? <><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-sm text-[#667085]">Tipo de pieza</p><div className="mt-1 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setProductType('A'); setSkuDigits(randomCodeDigits()); }} className={`border px-3 py-2 text-left text-xs ${productType === 'A' ? 'border-[#C9A24D] bg-[#FFF9E9] text-[#8A6514]' : 'border-[#E8E3DA] text-[#667085]'}`}><span className="block font-mono text-sm font-semibold">A-68420</span>Consumible (capilar, barba, cuidado)</button><button type="button" onClick={() => { setProductType('B'); setSkuDigits(randomCodeDigits()); }} className={`border px-3 py-2 text-left text-xs ${productType === 'B' ? 'border-[#C9A24D] bg-[#FFF9E9] text-[#8A6514]' : 'border-[#E8E3DA] text-[#667085]'}`}><span className="block font-mono text-sm font-semibold">B-42103</span>Herramienta (máquinas, accesorios)</button></div></div><div><p className="text-sm text-[#667085]">Vista previa del ID</p><p className="mt-1 border border-dashed border-[#C9A24D] bg-[#FFF9E9] px-3 py-2.5 font-mono text-sm font-semibold text-[#8A6514]">{productType}-{skuDigits}</p></div></div><p className="mt-2 flex items-center gap-1.5 text-xs text-[#667085]"><Barcode className="h-3.5 w-3.5" />El ID se genera automáticamente al guardar y no se repite. Prefijo A para consumibles, B para herramientas.</p></> : null}</div><label className="block text-sm font-medium">Stock disponible<input type="number" min="0" value={form.stock} onChange={(e) => update('stock', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" />{errors.stock && <small className="text-[#F50078]">{errors.stock}</small>}</label>
          <label className="block text-sm font-medium">Estado<select value={form.status || 'draft'} onChange={(e) => update('status', e.target.value)} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block text-sm font-medium">Descripción completa<textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="mt-1 min-h-32 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" />{errors.description && <small className="text-[#F50078]">{errors.description}</small>}</label>
          <label className="block text-sm font-medium">Ficha técnica / puntos destacados <span className="font-normal text-[#667085]">(uno por línea)</span><textarea value={form.highlights || ''} onChange={(e) => update('highlights', e.target.value)} className="mt-1 min-h-24 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" /></label>
          <div className="grid gap-2 text-sm sm:grid-cols-2">{[['featured', 'Producto destacado'], ['is_new', 'Producto nuevo'], ['free_shipping', 'Envío gratis'], ['customizable', 'Permite personalización']].map(([field, label]) => <label key={field} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form[field as keyof Product])} onChange={(e) => update(field as keyof Product, e.target.checked)} />{label}</label>)}</div>
        </div>
        <div className="space-y-4"><div className="border border-[#E8E3DA] bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-xl">Imágenes del producto</h3><p className="mt-1 text-xs text-[#667085]">JPG, PNG, WEBP o AVIF · máximo 5 MB</p></div><ImagePlus className="h-6 w-6 text-[#C9A24D]" /></div><label className="mt-4 flex cursor-pointer items-center justify-center border border-dashed border-[#C9A24D] bg-[#FFF9E9] px-4 py-5 text-sm font-semibold text-[#8A6514]">Subir imágenes<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectFiles} className="sr-only" /></label><div className="mt-3 flex gap-2"><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Agregar imagen mediante URL" className="min-w-0 flex-1 border border-[#E8E3DA] px-3 py-2 text-sm" /><button type="button" onClick={addUrl} className="border border-[#1B1B1B] px-3 py-2 text-sm">Agregar</button></div>{errors.images && <p className="mt-2 text-xs text-[#F50078]">{errors.images}</p>}{images.length === 0 ? <p className="py-8 text-center text-sm text-[#667085]">Aún no hay imágenes seleccionadas.</p> : <div className="mt-4 grid grid-cols-2 gap-3">{images.map((image, index) => <div key={image.id} className="relative border border-[#E8E3DA] bg-[#FAF9F6] p-2"><img src={image.preview} alt={`Vista previa ${index + 1}`} className="aspect-square w-full object-cover" /><div className="mt-2 flex items-center justify-between gap-1"><button type="button" onClick={() => setPrimary(image.id)} className={`text-xs ${image.isPrimary ? 'font-bold text-[#C9A24D]' : 'text-[#667085]'}`}><Star className="mr-1 inline h-3.5 w-3.5" />{image.isPrimary ? 'Principal' : 'Elegir'}</button><button type="button" onClick={() => removeImage(image.id)} className="text-[#F50078]" aria-label="Eliminar imagen"><Trash2 className="h-3.5 w-3.5" /></button></div><div className="mt-1 flex gap-1"><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="text-xs text-[#667085] disabled:opacity-30">←</button><GripVertical className="h-3.5 w-3.5 text-[#667085]" /><button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="text-xs text-[#667085] disabled:opacity-30">→</button></div></div>)}</div>}</div>{message && <p className={`border px-3 py-2 text-sm ${message.includes('correctamente') ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]' : 'border-[#F50078]/30 bg-[#FFF1F7] text-[#F50078]'}`}><Check className="mr-1 inline h-4 w-4" />{message}</p>}</div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#E8E3DA] pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { if (confirm('¿Descartar los cambios no guardados?')) onClose(); }} className="border border-[#1B1B1B] px-5 py-2.5 text-sm">Cancelar</button><button type="submit" disabled={saving} className="flex items-center justify-center gap-2 bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Guardando...' : form.status === 'draft' ? 'Guardar borrador' : 'Publicar producto'}</button></div>
      </form>
    </div>
  </div>;
}
