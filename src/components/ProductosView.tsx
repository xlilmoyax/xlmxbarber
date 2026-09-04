/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Screen } from '../types';
import { Package, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

interface ProductosViewProps {
  onNavigate: (screen: Screen) => void;
}

export default function ProductosView({ onNavigate }: ProductosViewProps) {
  const [products, setProducts] = useState<Array<{ id: string; name: string; description: string; price: number; original_price?: number | null; category_id?: string; materials?: string; highlights?: string; status?: string; featured?: boolean; is_new?: boolean; free_shipping?: boolean; customizable?: boolean; image_url: string; image_urls?: string[]; category?: { name: string } | null }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('products').select('id,name,description,price,original_price,category_id,materials,highlights,status,featured,is_new,free_shipping,customizable,image_url,image_urls,category:categories(name)').eq('status', 'published').order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data || []).map((product) => ({
        ...product,
        category: Array.isArray(product.category) ? product.category[0] || null : product.category,
      }))));
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Package className="w-10 h-10 text-amber-400" />
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">
              Productos
            </h1>
          </div>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Productos profesionales de Sir Fausto e Idraet
          </p>
        </div>

        {products.length === 0 && <div className="digital-maintenance-card rounded-2xl p-10 md:p-14 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl"></div>
              <Sparkles className="relative w-16 h-16 text-amber-400 animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-amber-50 mb-4">
            Catálogo próximamente
          </h2>

          <p className="text-lg text-amber-100/80 mb-6 leading-relaxed">
            Estamos creando una nueva sección para presentarte nuestra selección de productos profesionales de Sir Fausto e Idraet.
          </p>

          <p className="text-amber-100/60 mb-8">
            Esta página aún está en proceso de creación. Pronto podrás conocer nuestros productos y encontrar los ideales para tu cuidado personal.
          </p>

          <button
            onClick={() => onNavigate('home')}
            className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Volver al inicio
          </button>
        </div>}

        {products.length > 0 && <div className="grid gap-6 sm:grid-cols-2">
          {products.map((product) => <article key={product.id} className="overflow-hidden rounded-lg border border-amber-500/20 bg-zinc-900/70">
            {(product.image_urls?.[0] || product.image_url) && <img src={product.image_urls?.[0] || product.image_url} alt={product.name} className="aspect-square w-full object-cover" />}
            <div className="p-5"><div className="mb-2 flex flex-wrap gap-2">{product.category?.name && <span className="rounded-full border border-amber-400/30 px-2 py-1 text-xs text-amber-300">{product.category.name}</span>}{product.is_new && <span className="rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-zinc-900">Nuevo</span>}{product.featured && <span className="rounded-full border border-amber-400 px-2 py-1 text-xs text-amber-300">Destacado</span>}</div><h2 className="text-xl font-bold text-amber-300">{product.name}</h2><p className="mt-2 line-clamp-2 text-sm text-zinc-400">{product.description}</p><div className="mt-4 flex items-end gap-3"><p className="text-lg font-semibold text-amber-100">${Number(product.price).toLocaleString('es-AR')}</p>{product.original_price && product.original_price > product.price && <p className="text-sm text-zinc-500 line-through">${Number(product.original_price).toLocaleString('es-AR')}</p>}</div><button onClick={() => setSelectedProduct(product.id)} className="mt-5 w-full border border-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-300 transition-colors hover:bg-amber-400 hover:text-zinc-950">Ver detalle</button></div>
          </article>)}
        </div>}

        {selectedProduct && (() => {
          const product = products.find((item) => item.id === selectedProduct);
          if (!product) return null;
          const highlights = (product.highlights || '').split('\n').map((item) => item.trim()).filter(Boolean);
          const gallery = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
          return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-8" role="dialog" aria-modal="true" aria-label={`Detalle de ${product.name}`}><article className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-amber-400/30 bg-zinc-950 shadow-2xl"><div className="flex items-center justify-between border-b border-amber-400/20 px-5 py-4"><div><p className="text-xs uppercase tracking-widest text-amber-400">Ficha del producto</p><h2 className="font-display text-2xl text-white">{product.name}</h2></div><button onClick={() => setSelectedProduct(null)} className="px-3 py-2 text-2xl text-zinc-400 hover:text-white" aria-label="Cerrar detalle">×</button></div><div className="grid gap-8 p-5 md:grid-cols-2 md:p-8"><div>{gallery.length > 0 ? <div className="grid grid-cols-2 gap-3">{gallery.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${product.name} ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />)}</div> : <div className="flex aspect-square items-center justify-center rounded-lg border border-amber-400/20 text-zinc-500">Sin imagen disponible</div>}</div><div><div className="mb-4 flex flex-wrap gap-2">{product.category?.name && <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">{product.category.name}</span>}{product.is_new && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-zinc-900">Producto nuevo</span>}{product.featured && <span className="rounded-full border border-amber-400 px-3 py-1 text-xs text-amber-300">Destacado</span>}</div><p className="text-3xl font-semibold text-amber-200">${Number(product.price).toLocaleString('es-AR')}</p>{product.original_price && product.original_price > product.price && <p className="mt-1 text-sm text-zinc-500 line-through">Precio de lista: ${Number(product.original_price).toLocaleString('es-AR')}</p>}<p className="mt-6 leading-relaxed text-zinc-300">{product.description}</p><dl className="mt-6 space-y-3 border-y border-amber-400/20 py-5 text-sm"><div className="flex justify-between gap-4"><dt className="text-zinc-500">Material</dt><dd className="text-right text-zinc-200">{product.materials || 'No especificado'}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-500">Disponibilidad</dt><dd className="text-right text-emerald-300">{product.status === 'published' ? 'Disponible' : product.status}</dd></div>{product.free_shipping && <div className="text-amber-300">Envío gratis</div>}{product.customizable && <div className="text-amber-300">Permite personalización</div>}</dl>{highlights.length > 0 && <div className="mt-6"><h3 className="font-display text-xl text-amber-300">Ficha técnica</h3><ul className="mt-3 space-y-2 text-sm text-zinc-300">{highlights.map((item, index) => <li key={`${item}-${index}`} className="border-l-2 border-amber-400/50 pl-3">{item}</li>)}</ul></div>}</div></div></article></div>;
        })()}

        <div className="grid sm:grid-cols-2 gap-6 mt-14">
          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-lg p-6 text-center">
            <h3 className="text-amber-400 font-bold text-xl mb-2">Sir Fausto</h3>
            <p className="text-zinc-400 text-sm">
              Próximamente conocerás nuestra selección de productos para barbería y cuidado masculino.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-lg p-6 text-center">
            <h3 className="text-amber-400 font-bold text-xl mb-2">Idraet</h3>
            <p className="text-zinc-400 text-sm">
              Muy pronto encontrarás opciones profesionales para el cuidado facial y corporal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
