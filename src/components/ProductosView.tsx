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
  const [products, setProducts] = useState<Array<{ id: string; name: string; description: string; price: number; image_url: string; image_urls?: string[] }>>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('products').select('id,name,description,price,image_url,image_urls').eq('status', 'published').order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []));
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
            <div className="p-5"><h2 className="text-xl font-bold text-amber-300">{product.name}</h2><p className="mt-2 text-sm text-zinc-400">{product.description}</p><p className="mt-4 text-lg font-semibold text-amber-100">${Number(product.price).toLocaleString('es-AR')}</p></div>
          </article>)}
        </div>}

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
