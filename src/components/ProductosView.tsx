import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Search, Filter, X, ChevronRight, ShoppingBag, MessageCircle, ArrowLeft, Star, Clock } from 'lucide-react';

interface ProductosViewProps {
  onNavigate: (screen: Screen) => void;
}

type Product = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  original_price: number | null;
  stock: number;
  description: string;
  highlights: string;
  status: string;
  featured: boolean;
  is_new: boolean;
  free_shipping: boolean;
  image_url: string;
  image_urls: string[];
};

type Category = {
  id: string;
  name: string;
};

// Categorías fijas, pero también extraeremos dinámicas
const DEFAULT_CATEGORIES: Category[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Barbería' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Capilar' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Dermacosmética' },
];

export default function ProductosView({ onNavigate }: ProductosViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de vista y filtros
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc

  // Detalle de producto
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
    
    // Suscripción a cambios en productos
    const channel = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch productos publicados
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('status', ['published', 'sold_out']);

      if (productsError) throw productsError;

      if (productsData) {
        setProducts(productsData);
        // Extraer categorías dinámicamente si es posible, pero usaremos DEFAULT_CATEGORIES mapeado a los IDs encontrados
        // para tener los nombres, ya que supabase puede no tener tabla de categories
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(p => selectedCategory === 'all' || p.category_id === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0; // newest/default - asumiendo orden de DB
    });

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'General';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  const handleWhatsAppInquiry = (product: Product) => {
    const text = `Hola XLMX Barber, estoy interesado/a en adquirir el producto: *${product.name}* (${formatPrice(product.price)}). ¿Tienen disponibilidad?`;
    window.open(`https://wa.me/5493516851403?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Render vacío si no hay productos en BD
  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="font-display text-4xl text-zinc-900">Nuestra Tienda Exclusiva</h1>
          <p className="text-zinc-500 text-lg">Próximamente tendremos productos de primera calidad disponibles para ti. Estamos seleccionando lo mejor para tu cuidado.</p>
          <button onClick={() => onNavigate('home')} className="mt-8 px-8 py-3 bg-zinc-900 text-amber-400 uppercase tracking-widest text-sm font-semibold hover:bg-zinc-800 transition-colors">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Vista de Detalle de Producto
  if (selectedProduct) {
    const images = selectedProduct.image_urls && selectedProduct.image_urls.length > 0 
      ? selectedProduct.image_urls 
      : (selectedProduct.image_url ? [selectedProduct.image_url] : ['https://via.placeholder.com/600x600?text=XLMX+BARBER']);
      
    const highlightsList = selectedProduct.highlights ? selectedProduct.highlights.split('\n').filter(Boolean) : [];

    // Recomendados: Mismo category_id pero distinto id
    const relatedProducts = products
      .filter(p => p.category_id === selectedProduct.category_id && p.id !== selectedProduct.id)
      .slice(0, 4);

    return (
      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Migas de pan */}
          <nav className="flex items-center text-sm text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
            <button onClick={() => onNavigate('home')} className="hover:text-amber-600">Inicio</button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <button onClick={() => setSelectedProduct(null)} className="hover:text-amber-600">Productos</button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-zinc-900 font-medium truncate">{selectedProduct.name}</span>
          </nav>

          <button onClick={() => setSelectedProduct(null)} className="flex items-center text-sm font-semibold text-zinc-900 mb-6 hover:text-amber-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al catálogo
          </button>

          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {/* Galería */}
            <div className="flex flex-col gap-4">
              <div className="w-full bg-[#FAF9F6] aspect-[4/3] sm:aspect-square lg:aspect-auto lg:h-[500px] border border-zinc-100 flex items-center justify-center relative overflow-hidden group">
                <img src={images[activeImageIndex]} alt={selectedProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {selectedProduct.is_new && <span className="absolute top-4 left-4 bg-zinc-900 text-white text-xs px-3 py-1 font-semibold uppercase tracking-wider">Nuevo</span>}
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)}
                      className={`shrink-0 w-24 h-24 object-cover border transition-all ${activeImageIndex === idx ? 'border-amber-500' : 'border-zinc-200 hover:border-zinc-300'}`}
                    >
                      <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Producto */}
            <div className="flex flex-col">
              <span className="text-sm tracking-widest text-amber-600 font-semibold uppercase mb-2">{getCategoryName(selectedProduct.category_id)}</span>
              <h1 className="font-display text-3xl sm:text-4xl text-zinc-900 mb-4 leading-tight">{selectedProduct.name}</h1>
              
              <div className="flex items-end gap-3 mb-6">
                <span className="text-2xl font-semibold text-zinc-900">{formatPrice(selectedProduct.price)}</span>
                {selectedProduct.original_price && selectedProduct.original_price > selectedProduct.price && (
                  <span className="text-lg text-zinc-400 line-through mb-0.5">{formatPrice(selectedProduct.original_price)}</span>
                )}
              </div>

              <div className="prose prose-zinc prose-sm text-zinc-600 mb-8 max-w-none">
                <h3 className="font-semibold text-zinc-900 mb-4 text-sm uppercase tracking-wider">Descripción del Producto</h3>
                <p>{selectedProduct.description}</p>
              </div>

              {highlightsList.length > 0 && (
                <div className="mb-8 border-t border-b border-zinc-100 py-6">
                  <h3 className="font-semibold text-zinc-900 mb-4 text-sm uppercase tracking-wider">Ficha Técnica & Detalles</h3>
                  <ul className="space-y-2">
                    {highlightsList.map((hl, i) => (
                      <li key={i} className="flex items-start text-sm text-zinc-600">
                        <Check className="h-4 w-4 text-amber-500 mr-3 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center border border-zinc-200">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-zinc-500 hover:bg-zinc-50 transition-colors">-</button>
                  <span className="w-12 text-center font-semibold text-zinc-900">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-zinc-500 hover:bg-zinc-50 transition-colors">+</button>
                </div>
                <div className="text-sm text-zinc-500">
                  {selectedProduct.stock > 0 ? (
                    <span className="flex items-center text-emerald-600"><Check className="h-4 w-4 mr-1"/> En stock ({selectedProduct.stock})</span>
                  ) : (
                    <span className="flex items-center text-red-500"><X className="h-4 w-4 mr-1"/> Agotado</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  disabled={selectedProduct.stock <= 0}
                  className="w-full bg-zinc-900 text-amber-400 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedProduct.stock > 0 ? 'Agregar al Carrito (Próximamente)' : 'Sin stock momentáneo'}
                </button>
                <button 
                  onClick={() => handleWhatsAppInquiry(selectedProduct)}
                  className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
                </button>
              </div>

              {/* Indicadores de Confianza */}
              <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-zinc-100">
                <div className="flex flex-col items-center text-center p-3">
                  <ShoppingBag className="h-6 w-6 text-zinc-300 mb-2" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Retiro en Local</span>
                </div>
                {selectedProduct.free_shipping && (
                  <div className="flex flex-col items-center text-center p-3">
                    <Star className="h-6 w-6 text-zinc-300 mb-2" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Envío Gratis</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Relacionados */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-zinc-100 pt-20 mt-12">
              <div className="text-center mb-10">
                <span className="text-[10px] tracking-[0.2em] text-zinc-400 font-semibold uppercase block mb-3">Combinaciones Perfectas</span>
                <h2 className="font-display text-3xl text-zinc-900">También te puede interesar</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => { setSelectedProduct(p); window.scrollTo(0,0); setActiveImageIndex(0); setQuantity(1); }} categoryName={getCategoryName(p.category_id)} formatPrice={formatPrice} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Vista de Catálogo
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Tienda */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl text-zinc-900 mb-4">Catálogo Exclusivo</h1>
          <p className="text-zinc-500 max-w-2xl mx-auto">Selección de productos profesionales utilizados por nuestros expertos. Eleva tu rutina de cuidado con las mejores marcas.</p>
        </div>

        {/* Toolbar (Buscador y Orden) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-4 border-b border-zinc-200">
          <button 
            className="lg:hidden w-full sm:w-auto flex items-center justify-center gap-2 border border-zinc-300 px-4 py-2 bg-white text-sm"
            onClick={() => setShowFiltersMobile(true)}
          >
            <Filter className="h-4 w-4" /> Filtros
          </button>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 bg-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-zinc-500 whitespace-nowrap">Ordenar por:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto border border-zinc-200 bg-white text-sm py-2 px-3 focus:outline-none focus:border-amber-500"
            >
              <option value="newest">Novedades</option>
              <option value="price_asc">Menor Precio</option>
              <option value="price_desc">Mayor Precio</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="font-semibold text-zinc-900 tracking-wider text-sm uppercase mb-6">Categorías</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`text-sm hover:text-amber-600 transition-colors ${selectedCategory === 'all' ? 'text-amber-600 font-medium' : 'text-zinc-600'}`}
                  >
                    Todos los productos
                  </button>
                </li>
                {categories.map(c => (
                  <li key={c.id}>
                    <button 
                      onClick={() => setSelectedCategory(c.id)}
                      className={`text-sm hover:text-amber-600 transition-colors text-left ${selectedCategory === c.id ? 'text-amber-600 font-medium' : 'text-zinc-600'}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Grid de Productos */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => { setSelectedProduct(product); window.scrollTo(0,0); setActiveImageIndex(0); setQuantity(1); }} 
                    categoryName={getCategoryName(product.category_id)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-dashed border-zinc-200">
                <Search className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 mb-2">No se encontraron productos</h3>
                <p className="text-zinc-500">Prueba con otra búsqueda o cambia los filtros.</p>
                <button onClick={() => {setSearchQuery(''); setSelectedCategory('all');}} className="mt-4 text-sm font-semibold text-amber-600 hover:text-amber-700">Limpiar filtros</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Drawer Filters Mobile */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowFiltersMobile(false)}></div>
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-xl flex flex-col">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <span className="font-semibold text-zinc-900 uppercase tracking-widest text-sm">Filtros</span>
              <button onClick={() => setShowFiltersMobile(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <h3 className="font-semibold text-zinc-900 tracking-wider text-sm uppercase mb-4 mt-2">Categorías</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => { setSelectedCategory('all'); setShowFiltersMobile(false); }}
                    className={`block w-full text-left text-sm ${selectedCategory === 'all' ? 'text-amber-600 font-medium' : 'text-zinc-600'}`}
                  >
                    Todos los productos
                  </button>
                </li>
                {categories.map(c => (
                  <li key={c.id}>
                    <button 
                      onClick={() => { setSelectedCategory(c.id); setShowFiltersMobile(false); }}
                      className={`block w-full text-left text-sm ${selectedCategory === c.id ? 'text-amber-600 font-medium' : 'text-zinc-600'}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-zinc-100 mt-auto">
              <button onClick={() => setShowFiltersMobile(false)} className="w-full bg-zinc-900 text-white py-3 text-sm font-semibold tracking-widest uppercase">Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente helper para simplificar Check
function Check(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"></polyline></svg>
}

// Componente Tarjeta
function ProductCard({ product, onClick, categoryName, formatPrice }: { product: Product, onClick: () => void, categoryName: string, formatPrice: (price: number) => string }) {
  const imageUrl = product.image_url || (product.image_urls && product.image_urls[0]) || 'https://via.placeholder.com/400x500?text=XLMX';
  
  return (
    <div className="group cursor-pointer flex flex-col" onClick={onClick}>
      <div className="relative aspect-[4/5] bg-white border border-zinc-100 overflow-hidden mb-4">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_new && <span className="bg-zinc-900 text-white text-[10px] px-2 py-1 font-semibold uppercase tracking-widest">Nuevo</span>}
          {product.original_price && product.original_price > product.price && <span className="bg-amber-500 text-white text-[10px] px-2 py-1 font-semibold uppercase tracking-widest">Oferta</span>}
        </div>
        
        {/* Overlay Hover Action */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
          <button className="w-full bg-zinc-900/95 backdrop-blur text-white text-xs py-3 font-semibold tracking-widest uppercase">Ver Detalles</button>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-1">
        <span className="text-xs tracking-widest text-zinc-400 uppercase mb-1">{categoryName}</span>
        <h3 className="text-sm font-medium text-zinc-900 mb-2 leading-tight">{product.name}</h3>
        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-zinc-400 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
