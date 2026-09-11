import React, { useEffect, useState, useCallback } from 'react';
import { Screen, RegisteredUser, Category, Order, HeroConfig } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import ProductEditor from './ProductEditor';
import PagesManager from './PageEditor';
import CoursesManager from './CoursesManager';
import { getDiscountInfo } from '../lib/productHelpers';
import { BarChart3, BookOpen, ChevronDown, ExternalLink, FolderTree, Image, LayoutDashboard, LogOut, MessageSquareQuote, Package, Plus, RefreshCw, Settings, ShoppingCart, Trash2, Users, Check, X, Save } from 'lucide-react';

type Area = 'products' | 'pages' | 'courses' | 'users' | 'testimonials' | 'settings';
type ProductSection = 'Listado' | 'Subir producto' | 'Categorías' | 'Pedidos' | 'Portada / Hero' | 'Métricas';
type Product = { id: string; name: string; price: number; stock: number; description: string; featured: boolean; image_url?: string; materials?: string; brand?: string; discount_enabled?: boolean; discount_type?: 'percentage' | 'fixed'; discount_value?: number; status?: 'draft' | 'published' | 'sold_out' | 'archived'; category_id?: string; created_at?: string; highlights?: string; original_price?: number; image_urls?: string[]; is_new?: boolean; free_shipping?: boolean; };
type Course = { id: string; title: string; description: string; published: boolean };
type Testimonial = { id: string; author: string; quote: string; rating: number; published: boolean };
type CourseMetrics = { courses: number; sections: number; lessons: number; videos: number; accesses: number };
type Props = { users: RegisteredUser[]; onLogout: () => void; onNavigate: (screen: Screen) => void; onDeleteUser: (id: string) => void; onUpdateUser: (user: RegisteredUser) => Promise<void> | void; onSyncDatabase: () => void; isSyncing: boolean };

const areas: { id: Area; label: string; icon: React.ElementType }[] = [
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'pages', label: 'Páginas', icon: LayoutDashboard },
  { id: 'courses', label: 'Cursos', icon: BookOpen },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'testimonials', label: 'Testimonios', icon: MessageSquareQuote },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];
const productSections: { id: ProductSection; label: string; icon: React.ElementType }[] = [
  { id: 'Listado', label: 'Productos', icon: Package },
  { id: 'Subir producto', label: 'Subir producto', icon: Plus },
  { id: 'Categorías', label: 'Categorías', icon: FolderTree },
  { id: 'Pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'Portada / Hero', label: 'Portada / Hero', icon: Image },
  { id: 'Métricas', label: 'Métricas', icon: BarChart3 },
];

const ORDER_STATUSES = ['pendiente', 'contactado', 'confirmado', 'preparado', 'entregado', 'cancelado'] as const;
const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  contactado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-emerald-100 text-emerald-800',
  preparado: 'bg-purple-100 text-purple-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  'Consulta enviada': 'bg-amber-100 text-amber-800',
};

export default function AdminDashboardProView({ users, onLogout, onNavigate, onDeleteUser, onUpdateUser, onSyncDatabase, isSyncing }: Props) {
  const [area, setArea] = useState<Area>('products');
  const [productsOpen, setProductsOpen] = useState(true);
  const [productSection, setProductSection] = useState<ProductSection>('Listado');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseMetrics, setCourseMetrics] = useState<CourseMetrics>({ courses: 0, sections: 0, lessons: 0, videos: 0, accesses: 0 });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroConfig, setHeroConfig] = useState<HeroConfig | null>(null);
  const [productForm, setProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  // Category form state
  const [categoryForm, setCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', image_url: '', sort_order: 0, active: true });

  // Hero form state
  const [heroForm, setHeroForm] = useState({ title: '', subtitle: '', description: '', main_image_url: '', cta_label: 'Ver catálogo', featured_product_ids: [] as string[] });

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) { setNotice('Supabase no está configurado.'); return; }
    const [productsResult, categoriesResult, coursesResult, ordersResult, testimonialsResult, sectionsResult, lessonsResult, accessResult, heroResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('courses').select('id,title,description,published').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('course_sections').select('id'),
      supabase.from('course_lessons').select('id,video_url'),
      supabase.from('course_access').select('course_id'),
      supabase.from('hero_config').select('*').eq('active', true).maybeSingle(),
    ]);
    if (!productsResult.error) setProducts((productsResult.data || []) as Product[]);
    if (!categoriesResult.error) {
      const cats = (categoriesResult.data || []) as Category[];
      const productCounts = (productsResult.data || []).reduce((acc: Record<string, number>, p: any) => {
        if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
        return acc;
      }, {});
      setCategories(cats.map(c => ({ ...c, product_count: productCounts[c.id] || 0 })));
    }
    if (!coursesResult.error) setCourses((coursesResult.data || []) as Course[]);
    if (!ordersResult.error) setOrders((ordersResult.data || []) as Order[]);
    if (!testimonialsResult.error) setTestimonials((testimonialsResult.data || []) as Testimonial[]);
    if (!heroResult.error && heroResult.data) {
      setHeroConfig(heroResult.data as HeroConfig);
      setHeroForm({ title: heroResult.data.title || '', subtitle: heroResult.data.subtitle || '', description: heroResult.data.description || '', main_image_url: heroResult.data.main_image_url || '', cta_label: heroResult.data.cta_label || 'Ver catálogo', featured_product_ids: heroResult.data.featured_product_ids || [] });
    }
    setCourseMetrics({
      courses: coursesResult.data?.length || 0,
      sections: sectionsResult.data?.length || 0,
      lessons: lessonsResult.data?.length || 0,
      videos: lessonsResult.data?.filter((l: any) => Boolean(l.video_url)).length || 0,
      accesses: accessResult.data?.length || 0,
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await supabase.from('products').insert({ name: data.get('name'), description: data.get('description'), price: Number(data.get('price')) || 0, stock: Number(data.get('stock')) || 0, image_url: data.get('image_url') || '', materials: data.get('materials') || '', featured: data.get('featured') === 'on' });
    if (result.error) setNotice(result.error.message); else { setProductForm(false); setNotice('Producto guardado.'); await loadData(); }
  };
  const removeProduct = async (id: string) => { if (!confirm('¿Eliminar este producto?')) return; const result = await supabase.from('products').delete().eq('id', id); if (result.error) setNotice(result.error.message); else await loadData(); };
  const moderateTestimonial = async (item: Testimonial) => { const result = await supabase.from('testimonials').update({ published: !item.published }).eq('id', item.id); if (result.error) setNotice(result.error.message); else await loadData(); };
  const removeTestimonial = async (id: string) => { if (!confirm('¿Eliminar esta reseña?')) return; const result = await supabase.from('testimonials').delete().eq('id', id); if (result.error) setNotice(result.error.message); else await loadData(); };

  // Category CRUD
  const saveCategory = async () => {
    if (!catForm.name.trim()) { setNotice('El nombre es obligatorio.'); return; }
    const payload = { name: catForm.name.trim(), description: catForm.description.trim(), image_url: catForm.image_url.trim(), sort_order: catForm.sort_order, active: catForm.active };
    if (editingCategory) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
      if (error) { setNotice(error.message); return; }
      setNotice('Categoría actualizada.');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { setNotice(error.message); return; }
      setNotice('Categoría creada.');
    }
    setCategoryForm(false); setEditingCategory(null); setCatForm({ name: '', description: '', image_url: '', sort_order: 0, active: true }); await loadData();
  };
  const removeCategory = async (cat: Category) => {
    if (cat.product_count && cat.product_count > 0) {
      if (!confirm(`La categoría "${cat.name}" tiene ${cat.product_count} producto(s). Se eliminarán también. ¿Continuar?`)) return;
    } else {
      if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    }
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) setNotice(error.message); else { setNotice('Categoría eliminada.'); await loadData(); }
  };

  // Order status update
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) setNotice(error.message); else { setNotice('Estado actualizado.'); await loadData(); }
  };

  // Hero config save
  const saveHero = async () => {
    const payload = { ...heroForm, active: true, updated_at: new Date().toISOString() };
    if (heroConfig) {
      const { error } = await supabase.from('hero_config').update(payload).eq('id', heroConfig.id);
      if (error) { setNotice(error.message); return; }
    } else {
      const { data, error } = await supabase.from('hero_config').insert(payload).select().maybeSingle();
      if (error) { setNotice(error.message); return; }
      if (data) setHeroConfig(data as HeroConfig);
    }
    setNotice('Portada/Hero guardada.'); await loadData();
  };

  const exportBackup = () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exported_at: new Date().toISOString(), products, courses, orders, testimonials, users }, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `xlmx-backup-${Date.now()}.json`; link.click(); URL.revokeObjectURL(url); setNotice('Copia JSON descargada.'); };
  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !isSupabaseConfigured) return; if (!confirm('La restauración puede sobrescribir datos. ¿Deseas continuar?')) return; try { const backup = JSON.parse(await file.text()); for (const table of ['products', 'courses', 'testimonials']) { const rows = backup[table]; if (Array.isArray(rows) && rows.length) { const result = await supabase.from(table).upsert(rows); if (result.error) throw result.error; } } setNotice('Respaldo restaurado.'); await loadData(); } catch (error) { setNotice(`No se pudo restaurar: ${error instanceof Error ? error.message : 'JSON inválido'}`); } event.target.value = ''; };
  const resetInitial = async () => { if (!confirm('Esta acción eliminará productos, cursos y testimonios. Escribe ACEPTAR en la siguiente ventana para confirmar.')) return; if (window.prompt('Confirmación') !== 'ACEPTAR') return; for (const table of ['products', 'courses', 'testimonials']) await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); setNotice('Contenido restablecido.'); await loadData(); };

  const filteredProducts = products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()));

  // Metrics calculations
  const publishedProducts = products.filter(p => p.status === 'published').length;
  const draftProducts = products.filter(p => p.status === 'draft').length;
  const soldOutProducts = products.filter(p => p.status === 'sold_out').length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const activeCategories = categories.filter(c => c.active !== false).length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmado' || o.status === 'entregado');
  const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const recentOrders = orders.slice(0, 5);

  return <div className="min-h-screen bg-[#FAF9F6] text-[#151515]">
    <header className="bg-[#1B1B1B] px-4 py-5 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.25em] text-[#E3C27D]">XLMX Barber</p><h1 className="font-display text-2xl">Panel administrativo</h1></div><div className="flex gap-2"><button onClick={() => onNavigate('home')} className="flex items-center gap-2 border border-white/20 px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Ver sitio</button><button onClick={() => { onLogout(); onNavigate('home'); }} className="flex items-center gap-2 bg-[#C9A24D] px-3 py-2 text-sm text-[#151515]"><LogOut className="h-4 w-4" /> Cerrar sesión</button></div></div></header>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row"><aside className="w-full shrink-0 lg:w-60"><nav className="space-y-1">{areas.map(({ id, label, icon: Icon }) => id === 'products' ? <div key={id}><button onClick={() => { setArea(id); setProductsOpen((open) => !open); }} className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm ${area === id ? 'bg-[#1B1B1B] text-white' : 'text-[#667085] hover:bg-white'}`}><span className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span><ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} /></button>{area === 'products' && productsOpen && <div className="mt-1 space-y-1 border-l-2 border-[#E3C27D] pl-3">{productSections.map(({ id: sectionId, label: sectionLabel, icon: SectionIcon }) => <button key={sectionId} onClick={() => setProductSection(sectionId)} className={`flex w-full items-center gap-2 px-2 py-2 text-left text-xs ${productSection === sectionId ? 'font-semibold text-[#151515]' : 'text-[#667085]'}`}><SectionIcon className="h-3.5 w-3.5" />{sectionLabel}</button>)}</div>}</div> : <button key={id} onClick={() => setArea(id)} className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm ${area === id ? 'bg-[#1B1B1B] text-white' : 'text-[#667085] hover:bg-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav></aside>
      <main className="min-w-0 flex-1"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-[#C9A24D]">Control del sitio</p><h2 className="font-display text-3xl">{areas.find((item) => item.id === area)?.label}</h2></div><button onClick={() => { onSyncDatabase(); loadData(); }} className="flex items-center gap-2 border border-[#E8E3DA] bg-white px-3 py-2 text-sm text-[#667085]"><RefreshCw className={isSyncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Actualizar</button></div>{notice && <div className="mb-4 border border-[#E3C27D] bg-[#FFF9E9] p-3 text-sm flex items-center justify-between"><span>{notice}</span><button onClick={() => setNotice('')} className="text-[#667085]"><X className="h-4 w-4" /></button></div>}

        {/* ============ MÉTRICAS ============ */}
        {area === 'products' && productSection === 'Métricas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Total productos', products.length],
                ['Publicados', publishedProducts],
                ['Borradores', draftProducts],
                ['Agotados', soldOutProducts],
              ].map(([label, value]) => (
                <div key={String(label)} className="border border-[#E8E3DA] bg-white p-5">
                  <p className="text-xs text-[#667085]">{label}</p>
                  <p className="mt-3 font-display text-2xl">{String(value)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Categorías activas', activeCategories],
                ['Stock total', totalStock],
                ['Stock bajo (≤5)', lowStockProducts],
                ['Destacados', products.filter(p => p.featured).length],
              ].map(([label, value]) => (
                <div key={String(label)} className="border border-[#E8E3DA] bg-white p-5">
                  <p className="text-xs text-[#667085]">{label}</p>
                  <p className="mt-3 font-display text-2xl">{String(value)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Pedidos totales', orders.length],
                ['Pendientes', orders.filter(o => o.status === 'pendiente' || o.status === 'Consulta enviada').length],
                ['Confirmados', confirmedOrders.length],
                ['Ingresos confirmados', `$${confirmedRevenue.toLocaleString('es-AR')}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="border border-[#E8E3DA] bg-white p-5">
                  <p className="text-xs text-[#667085]">{label}</p>
                  <p className="mt-3 font-display text-2xl">{String(value)}</p>
                </div>
              ))}
            </div>
            <div className="border border-[#E8E3DA] bg-white p-5">
              <h3 className="font-display text-xl mb-3">Pedidos por estado</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {ORDER_STATUSES.map(status => (
                  <div key={status} className="text-center">
                    <p className="text-2xl font-display">{orders.filter(o => o.status === status).length}</p>
                    <p className="text-xs text-[#667085] capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </div>
            {recentOrders.length > 0 && (
              <div className="border border-[#E8E3DA] bg-white p-5">
                <h3 className="font-display text-xl mb-3">Pedidos recientes</h3>
                <div className="space-y-2">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between border-b border-[#E8E3DA] py-2 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{order.user_name || 'Anónimo'}</p>
                        <p className="text-xs text-[#667085]">{order.product_name || '—'} · {new Date(order.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs ${STATUS_COLORS[order.status] || 'bg-zinc-100 text-zinc-600'}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ LISTADO / SUBIR PRODUCTO ============ */}
        {area === 'products' && (productSection === 'Listado' || productSection === 'Subir producto') && <section><div className="mb-4 flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos" className="flex-1 border border-[#E8E3DA] bg-white px-3 py-2 text-sm" /><button onClick={() => { setEditingProduct(null); setProductForm(true); }} className="flex items-center gap-2 bg-[#1B1B1B] px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" /> Subir producto</button></div>{filteredProducts.length === 0 ? <div className="border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center"><Package className="mx-auto mb-3 h-8 w-8 text-[#C9A24D]" /><h3 className="font-display text-xl">0 productos</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">Aún no hay registros. Carga el primer producto real del catálogo.</p><button type="button" onClick={() => { setEditingProduct(null); setProductForm(true); }} className="mt-5 bg-[#C9A24D] px-4 py-2 text-sm text-[#151515]"><Plus className="mr-1 inline h-4 w-4" />Crear primer producto</button></div> : <div className="overflow-x-auto border border-[#E8E3DA] bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-[#E8E3DA] text-xs uppercase text-[#667085]"><tr><th className="p-4">ID</th><th className="p-4">Producto</th><th className="p-4">Marca</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id} className="border-b border-[#E8E3DA]"><td className="p-4 font-mono text-xs text-[#667085]">{product.materials || '—'}</td><td className="p-4">{product.name}</td><td className="p-4">{product.brand || '—'}</td><td className="p-4">{(() => { const discount = getDiscountInfo(product); return discount.active ? <><span className="mr-2 font-semibold text-[#151515]">${product.price}</span><span className="mr-2 text-xs text-[#667085] line-through">${discount.original}</span><span className="bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">{discount.label}</span></> : <span>${product.price}</span>; })()}</td><td className="p-4">{product.stock}</td><td className="p-4"><span className={`px-2 py-1 text-xs ${product.status === 'published' ? 'bg-emerald-100 text-emerald-800' : product.status === 'draft' ? 'bg-zinc-100 text-zinc-600' : 'bg-amber-100 text-amber-800'}`}>{product.status === 'published' ? 'Publicado' : product.status === 'draft' ? 'Borrador' : product.status === 'sold_out' ? 'Agotado' : 'Archivado'}</span></td><td className="p-4"><button onClick={() => { setEditingProduct(product); setProductForm(true); }} className="mr-3 text-[#667085]">Editar</button><button onClick={() => removeProduct(product.id)} className="text-[#F50078]"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}</section>}

        {/* ============ CATEGORÍAS ============ */}
        {area === 'products' && productSection === 'Categorías' && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[#667085]">{categories.length} categoría(s) registrada(s)</p>
              <button onClick={() => { setEditingCategory(null); setCatForm({ name: '', description: '', image_url: '', sort_order: categories.length, active: true }); setCategoryForm(true); }} className="flex items-center gap-2 bg-[#1B1B1B] px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" /> Nueva categoría</button>
            </div>

            {categoryForm && (
              <div className="mb-6 border border-[#E3C27D] bg-white p-5">
                <h3 className="font-display text-xl mb-4">{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">Nombre *<input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" /></label>
                  <label className="block text-sm font-medium">Descripción<textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" rows={2} /></label>
                  <label className="block text-sm font-medium">Imagen URL<input value={catForm.image_url} onChange={e => setCatForm(f => ({ ...f, image_url: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" placeholder="https://..." /></label>
                  <label className="block text-sm font-medium">Orden<input type="number" min="0" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" /></label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={catForm.active} onChange={e => setCatForm(f => ({ ...f, active: e.target.checked }))} /> Activa</label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={saveCategory} className="flex items-center gap-2 bg-[#C9A24D] px-4 py-2 text-sm text-[#151515]"><Save className="h-4 w-4" /> Guardar</button>
                  <button onClick={() => { setCategoryForm(false); setEditingCategory(null); }} className="border border-[#1B1B1B] px-4 py-2 text-sm">Cancelar</button>
                </div>
              </div>
            )}

            {categories.length === 0 ? (
              <div className="border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center">
                <FolderTree className="mx-auto mb-3 h-8 w-8 text-[#C9A24D]" />
                <h3 className="font-display text-xl">0 categorías</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">Crea categorías para organizar los productos del catálogo.</p>
              </div>
            ) : (
              <div className="border border-[#E8E3DA] bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E8E3DA] text-xs uppercase text-[#667085]">
                    <tr>
                      <th className="p-4">Nombre</th>
                      <th className="p-4 hidden sm:table-cell">Descripción</th>
                      <th className="p-4 text-center">Productos</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id} className="border-b border-[#E8E3DA]">
                        <td className="p-4 font-medium">{cat.name}</td>
                        <td className="p-4 text-[#667085] hidden sm:table-cell max-w-[200px] truncate">{cat.description || '—'}</td>
                        <td className="p-4 text-center">{cat.product_count || 0}</td>
                        <td className="p-4 text-center"><span className={`px-2 py-1 text-xs ${cat.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>{cat.active !== false ? 'Activa' : 'Inactiva'}</span></td>
                        <td className="p-4">
                          <button onClick={() => { setEditingCategory(cat); setCatForm({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '', sort_order: cat.sort_order || 0, active: cat.active !== false }); setCategoryForm(true); }} className="mr-3 text-[#667085]">Editar</button>
                          <button onClick={() => removeCategory(cat)} className="text-[#F50078]"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============ PEDIDOS ============ */}
        {area === 'products' && productSection === 'Pedidos' && (
          <section>
            <p className="text-sm text-[#667085] mb-4">{orders.length} pedido(s) registrado(s)</p>
            {orders.length === 0 ? (
              <div className="border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center">
                <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-[#C9A24D]" />
                <h3 className="font-display text-xl">0 pedidos</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">Los pedidos realizados por los clientes a través de WhatsApp aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              <div className="border border-[#E8E3DA] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b border-[#E8E3DA] text-xs uppercase text-[#667085]">
                      <tr>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Producto</th>
                        <th className="p-4 text-center">Cant.</th>
                        <th className="p-4">Precio</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b border-[#E8E3DA]">
                          <td className="p-4">
                            <p className="font-medium">{order.user_name || 'Anónimo'}</p>
                            <p className="text-xs text-[#667085]">{order.user_email || '—'}</p>
                          </td>
                          <td className="p-4">{order.product_name || '—'}</td>
                          <td className="p-4 text-center">{order.quantity || 1}</td>
                          <td className="p-4">${Number(order.total || 0).toLocaleString('es-AR')}</td>
                          <td className="p-4 text-xs">{new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4"><span className={`px-2 py-1 text-xs ${STATUS_COLORS[order.status] || 'bg-zinc-100 text-zinc-600'}`}>{order.status}</span></td>
                          <td className="p-4">
                            <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="border border-[#E8E3DA] bg-white px-2 py-1 text-xs">
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============ PORTADA / HERO ============ */}
        {area === 'products' && productSection === 'Portada / Hero' && (
          <section>
            <div className="border border-[#E8E3DA] bg-white p-5">
              <h3 className="font-display text-xl mb-4">Configuración del Hero / Portada</h3>
              <p className="text-sm text-[#667085] mb-6">Configura la presentación visual que se muestra en la parte superior de la página pública de Productos.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Título principal<input value={heroForm.title} onChange={e => setHeroForm(f => ({ ...f, title: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" placeholder="Catálogo Exclusivo" /></label>
                <label className="block text-sm font-medium">Subtítulo<input value={heroForm.subtitle} onChange={e => setHeroForm(f => ({ ...f, subtitle: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" placeholder="Selección de productos profesionales" /></label>
                <label className="block text-sm font-medium sm:col-span-2">Descripción<textarea value={heroForm.description} onChange={e => setHeroForm(f => ({ ...f, description: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" rows={3} placeholder="Descripción del catálogo..." /></label>
                <label className="block text-sm font-medium">Imagen principal URL<input value={heroForm.main_image_url} onChange={e => setHeroForm(f => ({ ...f, main_image_url: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" placeholder="https://..." /></label>
                <label className="block text-sm font-medium">Texto del botón CTA<input value={heroForm.cta_label} onChange={e => setHeroForm(f => ({ ...f, cta_label: e.target.value }))} className="mt-1 w-full border border-[#E8E3DA] bg-white px-3 py-2.5" /></label>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium mb-2">Productos destacados (selecciona)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-[#E8E3DA] p-3">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={heroForm.featured_product_ids.includes(p.id)} onChange={e => setHeroForm(f => ({ ...f, featured_product_ids: e.target.checked ? [...f.featured_product_ids, p.id] : f.featured_product_ids.filter(id => id !== p.id) }))} />
                        {p.name}
                      </label>
                    ))}
                    {products.length === 0 && <p className="text-xs text-[#667085]">No hay productos disponibles.</p>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={saveHero} className="flex items-center gap-2 bg-[#C9A24D] px-4 py-2 text-sm text-[#151515]"><Save className="h-4 w-4" /> Guardar Hero</button>
              </div>
              {heroConfig && <p className="mt-3 text-xs text-[#667085]">Última actualización: {new Date(heroConfig.updated_at || '').toLocaleString('es-AR')}</p>}
            </div>
          </section>
        )}

        {/* ============ COURSES ============ */}
        {area === 'courses' && <CoursesManager onNavigate={onNavigate} />}

        {/* ============ PAGES ============ */}
        {area === 'pages' && <PagesManager />}

        {/* ============ USERS ============ */}
        {area === 'users' && <section><div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Usuarios totales', users.length], ['Nuevos usuarios', 0], ['Usuarios activos', 0], ['Promedio de edad', users.length ? Math.round(users.reduce((sum, user) => sum + user.age, 0) / users.length) : 0]].map(([label, value]) => <div key={String(label)} className="border border-[#E8E3DA] bg-white p-4"><p className="text-xs text-[#667085]">{label}</p><p className="mt-3 font-display text-2xl">{value}</p></div>)}</div>{users.length === 0 ? <div className="border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-[#C9A24D]" /><h3 className="font-display text-xl">0 usuarios</h3></div> : users.map((user) => <article key={user.id} className="mb-3 border border-[#E8E3DA] bg-white p-5"><h3 className="font-display text-xl">{user.fullname}</h3><p className="text-sm text-[#667085]">ID: {user.id} · {user.email} · {user.age} años</p><button onClick={() => onUpdateUser(user)} className="mt-3 text-sm text-[#C9A24D]">Guardar cambios</button><button onClick={() => onDeleteUser(user.id)} className="ml-4 text-sm text-[#F50078]">Eliminar</button></article>)}</section>}

        {/* ============ TESTIMONIALS ============ */}
        {area === 'testimonials' && <section>{testimonials.length === 0 ? <div className="border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center"><MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-[#C9A24D]" /><h3 className="font-display text-xl">0 testimonios</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">Las nuevas calificaciones aparecerán aquí para moderación.</p></div> : testimonials.map((item) => <article key={item.id} className="mb-3 border border-[#E8E3DA] bg-white p-5"><h3 className="font-display text-xl">{item.author}</h3><p className="text-[#C9A24D]">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p><p className="mt-2 text-sm">{item.quote}</p><button onClick={() => moderateTestimonial(item)} className="mt-3 text-sm text-[#667085]"><Check className="mr-1 inline h-3 w-3" />{item.published ? 'Ocultar' : 'Aprobar'}</button><button onClick={() => removeTestimonial(item.id)} className="ml-4 text-sm text-[#F50078]">Eliminar</button></article>)}</section>}

        {/* ============ SETTINGS ============ */}
        {area === 'settings' && <section className="grid gap-4 md:grid-cols-2"><div className="border border-[#E8E3DA] bg-white p-5"><h3 className="font-display text-xl">Seguridad y roles</h3><p className="mt-3 text-sm text-[#667085]">Los roles owner/editor y los administradores se protegen con Supabase Auth y RLS.</p><span className="mt-4 inline-block bg-[#FFF4CC] px-3 py-2 text-xs text-[#8A6514]">Sin credenciales expuestas</span><button onClick={() => setNotice('El cambio de contraseña se realiza con Supabase Auth.')} className="mt-4 block bg-[#1B1B1B] px-4 py-2 text-sm text-white">Cambiar contraseña</button></div><div className="border border-[#E8E3DA] bg-white p-5"><h3 className="font-display text-xl">Copias de seguridad</h3><p className="mt-3 text-sm text-[#667085]">Exporta y restaura únicamente registros disponibles.</p><button onClick={exportBackup} className="mt-4 bg-[#1B1B1B] px-4 py-2 text-sm text-white">Exportar JSON</button><label className="mt-3 block text-sm text-[#667085]">Restaurar JSON<input type="file" accept="application/json" onChange={restoreBackup} className="mt-2 block w-full text-sm" /></label></div><div className="border border-[#E8E3DA] bg-white p-5"><h3 className="font-display text-xl">Conexiones</h3><p className="mt-3 text-sm text-[#667085]">Supabase: {isSupabaseConfigured ? 'Configurado' : 'No configurado'}</p><p className="text-sm text-[#667085]">GitHub: workflow protegido</p><button onClick={() => { onSyncDatabase(); loadData(); }} className="mt-4 bg-[#C9A24D] px-4 py-2 text-sm">Aplicar cambios</button></div><div className="border border-[#F50078]/30 bg-white p-5"><h3 className="font-display text-xl">Restablecimiento inicial</h3><p className="mt-3 text-sm text-[#667085]">Acción destructiva para vaciar contenido administrable.</p><button onClick={resetInitial} className="mt-4 border border-[#F50078] px-4 py-2 text-sm text-[#F50078]">Restablecer contenido</button></div></section>}
      </main>
    </div>
    {productForm && <ProductEditor product={editingProduct} categories={categories} onClose={() => { setProductForm(false); setEditingProduct(null); }} onSaved={loadData} />}
  </div>;
}
