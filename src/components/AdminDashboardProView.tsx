import React, { useEffect, useState, useCallback } from 'react';
import { Screen, RegisteredUser, Category, Order, HeroConfig } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import ProductEditor from './ProductEditor';
import PagesManager from './PageEditor';
import CoursesManager from './CoursesManager';
import { getDiscountInfo } from '../lib/productHelpers';
import { AlertTriangle, BarChart3, Bell, BookOpen, CheckCircle, ChevronDown, Clock, DollarSign, ExternalLink, FolderTree, Image, LayoutDashboard, LogOut, MessageSquareQuote, Package, Plus, RefreshCw, Search, Settings, ShoppingCart, SquarePen, Star, TrendingUp, Trash2, Users, Check, X, Save, ZapOff } from 'lucide-react';

type Area = 'products' | 'pages' | 'courses' | 'users' | 'testimonials' | 'settings';
type ProductSection = 'Listado' | 'Subir producto' | 'Categorías' | 'Pedidos' | 'Portada / Hero' | 'Métricas';
type Product = { id: string; name: string; price: number; stock: number; description: string; featured: boolean; image_url?: string; materials?: string; brand?: string; discount_enabled?: boolean; discount_type?: 'percentage' | 'fixed'; discount_value?: number; status?: 'draft' | 'published' | 'sold_out' | 'archived'; category_id?: string; created_at?: string; highlights?: string; original_price?: number; image_urls?: string[]; is_new?: boolean; free_shipping?: boolean; };
type Testimonial = { id: string; author: string; quote: string; rating: number; published: boolean };
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
    const [productsResult, categoriesResult, ordersResult, testimonialsResult, heroResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
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
    if (!ordersResult.error) setOrders((ordersResult.data || []) as Order[]);
    if (!testimonialsResult.error) setTestimonials((testimonialsResult.data || []) as Testimonial[]);
    if (!heroResult.error && heroResult.data) {
      setHeroConfig(heroResult.data as HeroConfig);
      setHeroForm({ title: heroResult.data.title || '', subtitle: heroResult.data.subtitle || '', description: heroResult.data.description || '', main_image_url: heroResult.data.main_image_url || '', cta_label: heroResult.data.cta_label || 'Ver catálogo', featured_product_ids: heroResult.data.featured_product_ids || [] });
    }
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

  const exportBackup = () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exported_at: new Date().toISOString(), products, orders, testimonials, users }, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `xlmx-backup-${Date.now()}.json`; link.click(); URL.revokeObjectURL(url); setNotice('Copia JSON descargada.'); };
  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !isSupabaseConfigured) return; if (!confirm('La restauración puede sobrescribir datos. ¿Deseas continuar?')) return; try { const backup = JSON.parse(await file.text()); for (const table of ['products', 'testimonials']) { const rows = backup[table]; if (Array.isArray(rows) && rows.length) { const result = await supabase.from(table).upsert(rows); if (result.error) throw result.error; } } setNotice('Respaldo restaurado.'); await loadData(); } catch (error) { setNotice(`No se pudo restaurar: ${error instanceof Error ? error.message : 'JSON inválido'}`); } event.target.value = ''; };
  const resetInitial = async () => { if (!confirm('Esta acción eliminará productos y testimonios. Escribe ACEPTAR en la siguiente ventana para confirmar.')) return; if (window.prompt('Confirmación') !== 'ACEPTAR') return; for (const table of ['products', 'testimonials']) await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); setNotice('Contenido restablecido.'); await loadData(); };

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

  return <div className="min-h-screen bg-[#FAF9F6] text-[#151515] selection:bg-[#E3C27D]/30">
    <header className="bg-[#1B1B1B] px-4 py-5 text-white sm:px-8 lg:px-12 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><p className="text-xs uppercase tracking-[.2em] text-[#E3C27D]">XLMX Barber</p><h1 className="font-display text-xl font-semibold">Panel administrativo</h1></div><div className="relative flex items-center gap-2"><input type="text" placeholder="Buscar en el panel..." className="border border-white/10 rounded-full px-4 py-2.5 pl-10 text-sm text-white/80 bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#C9A24D] transition-colors" /><Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/40" /></div><div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-white/60"><Bell className="h-4 w-4" /><span className="bg-[#F50078] text-white rounded-full w-2 h-2 absolute -top-1 -right-1"></span></div><div className="flex items-center gap-3"><button onClick={() => onNavigate('home')} className="flex items-center gap-2 border border-white/20 px-3 py-2 text-sm hover:bg-white/5 transition-colors"><ExternalLink className="h-4 w-4" /> Ver sitio</button><button onClick={() => { onLogout(); onNavigate('home'); }} className="flex items-center gap-2 bg-[#C9A24D] px-4 py-2.5 text-sm text-[#151515] rounded-full hover:bg-[#E3C27D] transition-colors"><LogOut className="h-4 w-4" /> Cerrar sesión</button></div></header>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row"><aside className="w-full shrink-0 lg:w-60 flex flex-col h-screen border-r border-[#E8E3DA] bg-[#FAF9F6]"><nav className="space-y-2 p-4 flex-1">{areas.map(({ id, label, icon: Icon }) => id === 'products' ? <div key={id}><button onClick={() => { setArea(id); setProductsOpen((open) => !open); }} className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm ${area === id ? 'bg-[#1B1B1B] text-white' : 'text-[#667085] hover:bg-white'}`}><span className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span><ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} /></button>{area === 'products' && productsOpen && <div className="mt-2 pt-2 border-t border-[#E3C27D] pl-3">{productSections.map(({ id: sectionId, label: sectionLabel, icon: SectionIcon }) => <button key={sectionId} onClick={() => setProductSection(sectionId)} className={`flex w-full items-center gap-2 px-2 py-2 text-left text-xs ${productSection === sectionId ? 'font-semibold text-[#151515]' : 'text-[#667085]'}`}><SectionIcon className="h-3.5 w-3.5" />{sectionLabel}</button>)}</div>}</div> : <button key={id} onClick={() => setArea(id)} className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm ${area === id ? 'bg-[#1B1B1B] text-white' : 'text-[#667085] hover:bg-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav></aside>
      <main className="min-w-0 flex-1"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#C9A24D]">Control del sitio</p><h2 className="font-display text-3xl tracking-tight">{areas.find((item) => item.id === area)?.label}</h2><p className="mt-1 text-sm text-[#667085]">{area==='products' ? ({Listado:'Gestiona catálogo, stock, precios y visibilidad', 'Subir producto':'Alta de producto con validación y previsualización', 'Categorías':'Organiza el catálogo por familias', Pedidos:'Seguimiento y actualización de estados', 'Portada / Hero':'Configura la portada pública de productos', 'Métricas':'Visión operativa del negocio' } as any)[productSection] : area==='pages'? 'Contenido editorial por bloques reordenables' : area==='courses'? 'Oferta formativa, accesos y progreso' : area==='users'? 'Base de usuarios registrados' : area==='testimonials'? 'Moderación de reseñas' : 'Seguridad, copias y conexiones'} </p></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-[#E8E3DA] bg-white px-3 py-1.5 text-xs text-[#667085] sm:flex"><span className={`h-2 w-2 rounded-full ${isSupabaseConfigured? 'bg-emerald-500':'bg-red-500'}`} />{isSupabaseConfigured? 'Supabase conectado':'Supabase desconectado'}<span className="h-3 w-px bg-[#E8E3DA]" />{products.length} productos · {orders.length} pedidos</div><button onClick={() => { onSyncDatabase(); loadData(); }} className="inline-flex items-center gap-2 rounded-full border border-[#E8E3DA] bg-white px-4 py-2 text-sm font-medium text-[#151515] shadow-sm hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><RefreshCw className={isSyncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Actualizar</button></div></div>{notice && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#E3C27D] bg-[#FFF9E9] px-4 py-3 text-sm shadow-sm"><span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#C9A24D] shadow-sm"><Check className="h-4 w-4"/></span>{notice}</span><button onClick={() => setNotice('')} className="rounded-full p-1 text-[#667085] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><X className="h-4 w-4" /></button></div>}

        {/* ============ MÉTRICAS PREMIUM ============ */}
        {area === 'products' && productSection === 'Métricas' && (
          <div className="space-y-6">
            {/* Métricas - premium cards con ícono, variación y tendencia sutil */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Total productos', products.length, Package, products.length ? `${publishedProducts} publicados` : 'Sin datos', products.length ? 'text-emerald-600' : 'text-[#667085]'],
                ['Publicados', publishedProducts, CheckCircle, `${draftProducts} borradores`, publishedProducts ? 'text-emerald-600' : 'text-[#667085]'],
                ['Borradores', draftProducts, SquarePen, `${soldOutProducts} agotados`, 'text-amber-600'],
                ['Agotados', soldOutProducts, ZapOff, soldOutProducts ? 'Requiere reposición' : 'Sin quiebres', soldOutProducts ? 'text-red-600' : 'text-emerald-600'],
              ].map(([label, value, IconCmp, hint, hintCls]: any) => (
                <div key={String(label)} className="group relative overflow-hidden rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9E9]/60 via-transparent to-transparent opacity-60" aria-hidden />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">{label}</p>
                      <p className="mt-2 font-display text-3xl leading-none tracking-tight">{String(value)}</p>
                      <p className={`mt-2 text-xs ${hintCls}`}>{hint}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF9F6] text-[#C9A24D] shadow-sm">
                      <IconCmp className="h-4.5 w-4.5" />
                    </span>
                  </div>
                  {String(label)==='Total productos' && !products.length && (
                    <button onClick={()=>setProductSection('Subir producto')} className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-[#1B1B1B] px-3 py-1.5 text-xs font-medium text-white hover:bg-black"><Plus className="h-3.5 w-3.5"/> Crear primer producto</button>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Categorías activas', activeCategories, FolderTree, `${categories.length} totales`, 'text-[#667085]'],
                ['Stock total', totalStock, Package, lowStockProducts ? `${lowStockProducts} con stock bajo` : 'Stock saludable', lowStockProducts ? 'text-amber-600' : 'text-emerald-600'],
                ['Stock bajo (≤5)', lowStockProducts, AlertTriangle, lowStockProducts ? 'Reabastecer pronto' : 'Sin alertas', lowStockProducts ? 'text-amber-600' : 'text-emerald-600'],
                ['Destacados', products.filter(p => p.featured).length, Star, `${products.filter(p => p.featured).length} en portada`, 'text-[#667085]'],
              ].map(([label, value, IconCmp, hint, hintCls]: any) => (
                <div key={String(label)} className="group relative overflow-hidden rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9E9]/60 via-transparent to-transparent opacity-60" aria-hidden />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">{label}</p>
                      <p className="mt-2 font-display text-3xl leading-none tracking-tight">{String(value)}</p>
                      <p className={`mt-2 text-xs ${hintCls}`}>{hint}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF9F6] text-[#C9A24D] shadow-sm">
                      <IconCmp className="h-4.5 w-4.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Pedidos totales', orders.length, ShoppingCart, confirmedOrders.length ? `${confirmedOrders.length} confirmados` : 'Sin pedidos', 'text-[#667085]'],
                ['Pendientes', orders.filter(o => o.status === 'pendiente' || o.status === 'Consulta enviada').length, Clock, `${confirmedRevenue.toLocaleString('es-AR')} facturado`, 'text-amber-600'],
                ['Confirmados', confirmedOrders.length, CheckCircle, `${orders.length? Math.round(confirmedOrders.length/orders.length*100):0}% del total`, 'text-emerald-600'],
                ['Ingresos confirmados', `$${confirmedRevenue.toLocaleString('es-AR')}`, DollarSign, confirmedRevenue? 'ARS confirmados' : 'Sin ingresos', 'text-emerald-600'],
              ].map(([label, value, IconCmp, hint, hintCls]: any) => (
                <div key={String(label)} className="group relative overflow-hidden rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9E9]/60 via-transparent to-transparent opacity-60" aria-hidden />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">{label}</p>
                      <p className="mt-2 font-display text-3xl leading-none tracking-tight">{String(value)}</p>
                      <p className={`mt-2 text-xs ${hintCls}`}>{hint}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF9F6] text-[#C9A24D] shadow-sm">
                      <IconCmp className="h-4.5 w-4.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Pedidos por estado</h3>
                <span className="rounded-full bg-[#FAF9F6] px-3 py-1 text-xs text-[#667085]">{orders.length} totales</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {ORDER_STATUSES.map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const pct = orders.length? Math.round(count/orders.length*100):0;
                  return (
                  <div key={status} className="rounded-xl border border-[#E8E3DA] bg-[#FAF9F6] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-[#667085]">{status}</p>
                    <p className="mt-1 font-display text-2xl leading-none">{count}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                      <div className="h-full bg-[#C9A24D]" style={{width: `${pct}%`}} />
                    </div>
                    <p className="mt-1 text-[11px] text-[#667085]">{pct}%</p>
                  </div>
                )})}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Pedidos recientes</h3>
                <span className="text-xs text-[#667085]">{recentOrders.length? `${recentOrders.length} últimos` : 'Sin movimientos'}</span>
              </div>
              {recentOrders.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[#E8E3DA] bg-[#FAF9F6] px-6 py-10 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#C9A24D] shadow-sm"><ShoppingCart className="h-5 w-5"/></div>
                  <p className="mt-3 font-medium">Aún no hay pedidos</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-[#667085]">Cuando ingresen consultas o compras, aparecerán aquí con estado y fecha para gestión rápida.</p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-[#E8E3DA] overflow-hidden rounded-xl border border-[#E8E3DA]">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between gap-3 bg-white px-4 py-3 hover:bg-[#FAF9F6]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{order.user_name || 'Anónimo'}</p>
                        <p className="truncate text-xs text-[#667085]">{order.product_name || '—'} · {new Date(order.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-zinc-100 text-zinc-600'}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ LISTADO / SUBIR PRODUCTO ============ */}
        {area === 'products' && (productSection === 'Listado' || productSection === 'Subir producto') && <section><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, marca o SKU (ID)" aria-label="Buscar productos" className="w-full rounded-full border border-[#E8E3DA] bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm placeholder:text-[#667085]/70 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/30" /></div><div className="flex items-center gap-2"><span className="hidden text-xs text-[#667085] sm:inline">{filteredProducts.length} resultados</span><button onClick={() => { setEditingProduct(null); setProductForm(true); }} className="inline-flex items-center gap-2 rounded-full bg-[#1B1B1B] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><Plus className="h-4 w-4" /> Subir producto</button></div></div>{filteredProducts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF9F6] text-[#C9A24D] shadow-sm"><Package className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl">Aún no hay productos</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#667085]">Crea el primer producto real del catálogo. Podrás definir precio, stock, marca, categoría, imágenes y estado de publicación.</p><button type="button" onClick={() => { setEditingProduct(null); setProductForm(true); }} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#C9A24D] px-5 py-2.5 text-sm font-medium text-[#151515] shadow-sm hover:bg-[#E3C27D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><Plus className="h-4 w-4" />Crear primer producto</button><p className="mt-3 text-xs text-[#667085]">Se guardará en Supabase y quedará disponible para portada y pedidos.</p></div> : <div className="overflow-x-auto border border-[#E8E3DA] bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="sticky top-0 z-10 border-b border-[#E8E3DA] bg-[#FAF9F6] text-[11px] uppercase tracking-wide text-[#667085]"><tr><th className="p-3 font-medium">SKU / ID</th><th className="p-3 font-medium">Producto</th><th className="p-3 font-medium">Marca</th><th className="p-3 text-right font-medium">Precio</th><th className="p-3 text-center font-medium">Stock</th><th className="p-3 font-medium">Estado</th><th className="p-3 text-right font-medium">Acciones</th></tr></thead><tbody className="divide-y divide-[#E8E3DA]">{filteredProducts.map((product) => <tr key={product.id} className="group bg-white transition hover:bg-[#FFF9E9]"><td className="p-4 font-mono text-xs text-[#667085]">{product.materials || '—'}</td><td className="p-4">{product.name}</td><td className="p-4">{product.brand || '—'}</td><td className="p-4">{(() => { const discount = getDiscountInfo(product); return discount.active ? <><span className="mr-2 font-semibold text-[#151515]">${product.price}</span><span className="mr-2 text-xs text-[#667085] line-through">${discount.original}</span><span className="bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">{discount.label}</span></> : <span>${product.price}</span>; })()}</td><td className="p-4">{product.stock}</td><td className="p-4"><span className={`px-2 py-1 text-xs ${product.status === 'published' ? 'bg-emerald-100 text-emerald-800' : product.status === 'draft' ? 'bg-zinc-100 text-zinc-600' : 'bg-amber-100 text-amber-800'}`}>{product.status === 'published' ? 'Publicado' : product.status === 'draft' ? 'Borrador' : product.status === 'sold_out' ? 'Agotado' : 'Archivado'}</span></td><td className="p-4"><button onClick={() => { setEditingProduct(product); setProductForm(true); }} className="mr-3 text-[#667085]">Editar</button><button onClick={() => removeProduct(product.id)} className="text-[#F50078]"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}</section>}

        {/* ============ CATEGORÍAS ============ */}
        {area === 'products' && productSection === 'Categorías' && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[#667085]">{categories.length} categoría(s) registrada(s)</p>
              <button onClick={() => { setEditingCategory(null); setCatForm({ name: '', description: '', image_url: '', sort_order: categories.length, active: true }); setCategoryForm(true); }} className="flex items-center gap-2 bg-[#1B1B1B] px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" /> Nueva categoría</button>
            </div>

            {categoryForm && (
              <div className="mb-6 rounded-2xl border border-[#E3C27D]/60 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl tracking-tight">{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h3>
                    <p className="mt-1 text-sm text-[#667085]">Define nombre, descripción, imagen y orden de aparición. Los cambios se reflejan en el catálogo público.</p>
                  </div>
                  <span className="rounded-full bg-[#FFF9E9] px-3 py-1 text-xs text-[#8A6514]">Supabase · categories</span>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium">Nombre *<span className="ml-1 text-xs font-normal text-[#667085]">visible en tienda</span><input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" placeholder="Ej. Cuidado facial" /></label>
                  <label className="block text-sm font-medium">Orden<span className="ml-1 text-xs font-normal text-[#667085]">menor aparece primero</span><input type="number" min="0" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" /></label>
                  <label className="block text-sm font-medium sm:col-span-2">Descripción<span className="ml-1 text-xs font-normal text-[#667085]">opcional, ayuda al SEO</span><textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" rows={2} placeholder="Breve descripción de la categoría" /></label>
                  <label className="block text-sm font-medium sm:col-span-2">Imagen URL<span className="ml-1 text-xs font-normal text-[#667085]">recomendado 800×600</span><input value={catForm.image_url} onChange={e => setCatForm(f => ({ ...f, image_url: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" placeholder="https://..." /></label>
                  <label className="flex items-center gap-2 rounded-xl border border-[#E8E3DA] bg-[#FAF9F6] px-3 py-2.5 text-sm"><input type="checkbox" checked={catForm.active} onChange={e => setCatForm(f => ({ ...f, active: e.target.checked }))} className="rounded border-[#E8E3DA] text-[#C9A24D] focus:ring-[#C9A24D]" /> Activa <span className="text-xs text-[#667085]">— si está inactiva no se muestra en la tienda</span></label>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={saveCategory} className="inline-flex items-center gap-2 rounded-full bg-[#1B1B1B] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><Save className="h-4 w-4" /> Guardar categoría</button>
                  <button onClick={() => { setCategoryForm(false); setEditingCategory(null); }} className="rounded-full border border-[#E8E3DA] bg-white px-5 py-2.5 text-sm font-medium hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]">Cancelar</button>
                </div>
              </div>
            )}

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF9F6] text-[#C9A24D] shadow-sm"><FolderTree className="h-6 w-6" /></div>
                <h3 className="mt-4 font-display text-xl">Aún no hay categorías</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#667085]">Crea familias para organizar el catálogo. Cada categoría puede tener imagen, orden y estado activa/inactiva.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#E8E3DA] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E8E3DA] bg-[#FAF9F6] text-[11px] uppercase tracking-wide text-[#667085]">
                    <tr>
                      <th className="p-3 font-medium">Nombre</th>
                      <th className="p-3 hidden font-medium sm:table-cell">Descripción</th>
                      <th className="p-3 text-center font-medium">Productos</th>
                      <th className="p-3 text-center font-medium">Estado</th>
                      <th className="p-3 text-right font-medium">Acciones</th>
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

        {/* ============ PORTADA / HERO — premium form ============ */}
        {area === 'products' && productSection === 'Portada / Hero' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#E8E3DA] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl tracking-tight">Configuración del Hero / Portada</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#667085]">Define la presentación visual de la parte superior de la página pública de Productos. Todos los campos se guardan en <span className="rounded bg-[#FAF9F6] px-1.5 py-0.5 font-mono text-xs">hero_config</span> en Supabase.</p>
                </div>
                <span className="hidden rounded-full border border-[#E8E3DA] bg-[#FAF9F6] px-3 py-1 text-xs text-[#667085] sm:inline-flex"><Image className="mr-1.5 h-3.5 w-3.5"/> Portada</span>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">Título principal <span className="font-normal text-[#667085]">— H1 de la portada</span><input value={heroForm.title} onChange={e => setHeroForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" placeholder="Catálogo Exclusivo" /></label>
                <label className="block text-sm font-medium">Subtítulo <span className="font-normal text-[#667085]">— bajada</span><input value={heroForm.subtitle} onChange={e => setHeroForm(f => ({ ...f, subtitle: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" placeholder="Selección de productos profesionales" /></label>
                <label className="block text-sm font-medium sm:col-span-2">Descripción <span className="font-normal text-[#667085]">— párrafo introductorio</span><textarea value={heroForm.description} onChange={e => setHeroForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" rows={3} placeholder="Descripción del catálogo..." /></label>
                <label className="block text-sm font-medium">Imagen principal URL <span className="font-normal text-[#667085]">— 1600×900 recomendado</span><input value={heroForm.main_image_url} onChange={e => setHeroForm(f => ({ ...f, main_image_url: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-[#667085]/60 focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" placeholder="https://..." /></label>
                <label className="block text-sm font-medium">Texto del botón CTA<input value={heroForm.cta_label} onChange={e => setHeroForm(f => ({ ...f, cta_label: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2.5 text-sm shadow-sm focus:border-[#C9A24D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/20" /></label>
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
        {area === 'users' && <section><div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Usuarios totales', users.length], ['Nuevos usuarios', 0], ['Usuarios activos', 0], ['Promedio de edad', users.length ? Math.round(users.reduce((sum, user) => sum + user.age, 0) / users.length) : 0]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#E8E3DA] bg-white p-4 shadow-sm"><p className="text-[11px] uppercase tracking-wide text-[#667085]">{label}</p><p className="mt-2 font-display text-2xl">{value}</p></div>)}</div>{users.length === 0 ? <div className="rounded-2xl border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF9F6] text-[#C9A24D] shadow-sm"><Users className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl">Aún no hay usuarios registrados</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">Los usuarios que se registren desde el sitio aparecerán aquí con sus datos y membresía.</p></div> : users.map((user) => <article key={user.id} className="mb-3 flex flex-col gap-3 rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-sm transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="font-display text-lg leading-none">{user.fullname}</h3><p className="mt-1 truncate text-sm text-[#667085]">{user.email} · {user.age} años · <span className="font-mono text-xs">{user.id.slice(0,8)}…</span></p></div><div className="flex shrink-0 gap-2"><button onClick={() => onUpdateUser(user)} className="rounded-full border border-[#E8E3DA] bg-white px-4 py-1.5 text-sm font-medium hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]">Guardar cambios</button><button onClick={() => onDeleteUser(user.id)} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#F50078] ring-1 ring-inset ring-[#F50078]/20 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Eliminar</button></div></article>)}</section>}

        {/* ============ TESTIMONIALS ============ */}
        {area === 'testimonials' && <section>{testimonials.length === 0 ? <div className="rounded-2xl border border-dashed border-[#E8E3DA] bg-white px-6 py-12 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF9F6] text-[#C9A24D] shadow-sm"><MessageSquareQuote className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl">Aún no hay testimonios</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#667085]">Las nuevas calificaciones de clientes aparecerán aquí para moderación. Podrás aprobar, ocultar o eliminar cada reseña.</p></div> : testimonials.map((item) => <article key={item.id} className="mb-3 rounded-2xl border border-[#E8E3DA] bg-white p-5 shadow-sm transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg">{item.author}</h3><p className="mt-1 text-[#C9A24D]">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} <span className="ml-2 rounded-full bg-[#FAF9F6] px-2 py-0.5 text-xs text-[#667085]">{item.rating}/5</span> {item.published && <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Publicado</span>}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.published? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>{item.published? 'Visible':'Pendiente'}</span></div><p className="mt-3 text-sm leading-relaxed">“{item.quote}”</p><div className="mt-4 flex gap-2"><button onClick={() => moderateTestimonial(item)} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E3DA] bg-white px-4 py-1.5 text-sm font-medium hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"><Check className="h-3.5 w-3.5" />{item.published ? 'Ocultar' : 'Aprobar'}</button><button onClick={() => removeTestimonial(item.id)} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#F50078] ring-1 ring-inset ring-[#F50078]/20 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Eliminar</button></div></article>)}</section>}

        {/* ============ SETTINGS ============ */}
        {area === 'settings' && <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E8E3DA] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#1B1B1B] shadow-sm"><Settings className="h-4.5 w-4.5"/></div>
            <h3 className="mt-3 font-display text-lg">Seguridad y roles</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#667085]">Los roles <span className="rounded bg-[#FAF9F6] px-1.5 py-0.5 font-mono text-xs">owner/editor</span> se protegen con Supabase Auth y RLS. Sin credenciales expuestas en el cliente.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFF4CC] px-3 py-1.5 text-xs font-medium text-[#8A6514]"><CheckCircle className="h-3.5 w-3.5"/> RLS activo</span>
            <button onClick={() => setNotice('El cambio de contraseña se realiza con Supabase Auth.')} className="mt-4 inline-flex rounded-full bg-[#1B1B1B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]">Cambiar contraseña</button>
          </div>
          <div className="rounded-2xl border border-[#E8E3DA] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#1B1B1B] shadow-sm"><Save className="h-4.5 w-4.5"/></div>
            <h3 className="mt-3 font-display text-lg">Copias de seguridad</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#667085]">Exporta y restaura únicamente registros disponibles. Útil antes de cambios masivos.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={exportBackup} className="inline-flex rounded-full bg-[#1B1B1B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]">Exportar JSON</button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E8E3DA] bg-white px-4 py-2 text-sm font-medium hover:bg-[#FAF9F6] focus-within:ring-2 focus-within:ring-[#C9A24D]">Restaurar JSON<input type="file" accept="application/json" onChange={restoreBackup} className="sr-only" /></label>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E8E3DA] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#1B1B1B] shadow-sm"><RefreshCw className="h-4.5 w-4.5"/></div>
            <h3 className="mt-3 font-display text-lg">Conexiones</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p className="flex items-center gap-2 text-[#667085]"><span className={`h-2 w-2 rounded-full ${isSupabaseConfigured? 'bg-emerald-500':'bg-red-500'}`}/>Supabase: {isSupabaseConfigured ? 'Configurado' : 'No configurado'}</p>
              <p className="flex items-center gap-2 text-[#667085]"><span className="h-2 w-2 rounded-full bg-emerald-500"/>GitHub: workflow protegido</p>
            </div>
            <button onClick={() => { onSyncDatabase(); loadData(); }} className="mt-4 inline-flex rounded-full bg-[#C9A24D] px-4 py-2 text-sm font-medium text-[#151515] shadow-sm hover:bg-[#E3C27D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]">Aplicar cambios</button>
          </div>
          <div className="rounded-2xl border border-[#F50078]/30 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#F50078] shadow-sm"><AlertTriangle className="h-4.5 w-4.5"/></div>
            <h3 className="mt-3 font-display text-lg">Restablecimiento inicial</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#667085]">Acción destructiva: vacía contenido administrable tras doble confirmación.</p>
            <button onClick={resetInitial} className="mt-4 inline-flex rounded-full border border-[#F50078] bg-white px-4 py-2 text-sm font-medium text-[#F50078] hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Restablecer contenido</button>
          </div>
        </section>}
      </main>
    </div>
    {productForm && <ProductEditor product={editingProduct} categories={categories} onClose={() => { setProductForm(false); setEditingProduct(null); }} onSaved={loadData} />}
  </div>;
}
