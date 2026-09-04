import React, { useEffect, useState } from 'react';
import { Screen, RegisteredUser } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ExternalLink,
  FolderTree,
  Image,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';

type Area = 'products' | 'pages' | 'courses' | 'users' | 'testimonials' | 'settings';
type ProductSection = 'Productos' | 'Subir producto' | 'Categorías' | 'Pedidos' | 'Portada / Hero' | 'Métricas';
type Product = { id: string; name: string; price: number; stock: number; description: string; featured: boolean; image_url?: string; materials?: string };
type Order = { total: number; status: string };
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
  { id: 'Productos', label: 'Listado de productos', icon: Package },
  { id: 'Subir producto', label: 'Subir producto', icon: Plus },
  { id: 'Categorías', label: 'Categorías', icon: FolderTree },
  { id: 'Pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'Portada / Hero', label: 'Portada / Hero', icon: Image },
  { id: 'Métricas', label: 'Métricas', icon: BarChart3 },
];

const emptyProduct = { name: '', price: '', stock: '', description: '', image_url: '', materials: '', featured: false };

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="border border-dashed border-[#E8E3DA] bg-white px-6 py-16 text-center">
    <Package className="mx-auto mb-3 h-8 w-8 text-[#C9A24D]" />
    <h3 className="font-display text-xl">{title}</h3>
    <p className="mt-2 text-sm text-[#667085]">{text}</p>
  </div>;
}

export default function AdminDashboardProView({ users, onLogout, onNavigate, onDeleteUser, onUpdateUser, onSyncDatabase, isSyncing }: Props) {
  const [area, setArea] = useState<Area>('products');
  const [productsOpen, setProductsOpen] = useState(true);
  const [productSection, setProductSection] = useState<ProductSection>('Productos');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productForm, setProductForm] = useState<typeof emptyProduct | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const loadCommerceData = async () => {
    if (!isSupabaseConfigured) return;
    const [productsResult, ordersResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('total,status').order('created_at', { ascending: false }),
    ]);
    if (productsResult.error) setNotice(productsResult.error.message);
    else setProducts((productsResult.data || []) as Product[]);
    if (!ordersResult.error) setOrders((ordersResult.data || []) as Order[]);
  };

  useEffect(() => {
    loadCommerceData();
  }, []);

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productForm || !isSupabaseConfigured) return;
    const result = await supabase.from('products').insert({
      ...productForm,
      price: Number(productForm.price) || 0,
      stock: Number(productForm.stock) || 0,
    });
    if (result.error) setNotice(result.error.message);
    else {
      setProductForm(null);
      setNotice('Producto guardado correctamente.');
      await loadCommerceData();
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const result = await supabase.from('products').delete().eq('id', id);
    if (result.error) setNotice(result.error.message);
    else await loadCommerceData();
  };

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const revenue = orders.reduce((total, order) => total + Number(order.total || 0), 0);

  return <div className="min-h-screen bg-[#FAF9F6] text-[#151515]">
    <header className="bg-[#1B1B1B] px-4 py-5 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[.25em] text-[#E3C27D]">XLMX Barber</p><h1 className="font-display text-2xl">Panel administrativo</h1></div>
        <div className="flex gap-2"><button onClick={() => onNavigate('home')} className="flex items-center gap-2 border border-white/20 px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Ver sitio</button><button onClick={() => { onLogout(); onNavigate('home'); }} className="flex items-center gap-2 bg-[#C9A24D] px-3 py-2 text-sm text-[#151515]"><LogOut className="h-4 w-4" /> Cerrar sesión</button></div>
      </div>
    </header>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-60">
        <nav className="space-y-1">{areas.map(({ id, label, icon: Icon }) => id === 'products' ? <div key={id}><button onClick={() => { setArea(id); setProductsOpen((open) => !open); }} className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm ${area === id ? 'bg-[#1B1B1B] text-white' : 'text-[#667085] hover:bg-white'}`}><span className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span><ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} /></button>{area === 'products' && productsOpen && <div className="mt-1 space-y-1 border-l-2 border-[#E3C27D] pl-3">{productSections.map(({ id: sectionId, label: sectionLabel, icon: SectionIcon }) => <button key={sectionId} onClick={() => setProductSection(sectionId)} className={`flex w-full items-center gap-2 px-2 py-2 text-left text-xs ${productSection === sectionId ? 'font-semibold text-[#151515]' : 'text-[#667085]'}`}><SectionIcon className="h-3.5 w-3.5" />{sectionLabel}</button>)}</div>}</div> : <button key={id} onClick={() => setArea(id)} className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm ${area === id ? 'bg-[#1B1B1B] text-white' : 'text-[#667085] hover:bg-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-[#C9A24D]">Control del sitio</p><h2 className="font-display text-3xl">{areas.find((item) => item.id === area)?.label}</h2></div><button onClick={() => { onSyncDatabase(); loadCommerceData(); }} className="flex items-center gap-2 border border-[#E8E3DA] bg-white px-3 py-2 text-sm text-[#667085]"><RefreshCw className={isSyncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Actualizar</button></div>
        {notice && <p className="mb-4 border border-[#E3C27D] bg-[#FFF9E9] p-3 text-sm">{notice}</p>}
        {area === 'products' && productSection === 'Métricas' && <div className="grid grid-cols-2 gap-3 md:grid-cols-6">{[['Ventas', orders.length], ['Pedidos', orders.length], ['Ingresos', `$${revenue.toLocaleString('es-AR')}`], ['Productos', products.length], ['Stock bajo', products.filter((product) => product.stock <= 5).length], ['Destacados', products.filter((product) => product.featured).length]].map(([label, value]) => <div key={String(label)} className="border border-[#E8E3DA] bg-white p-5"><p className="text-xs text-[#667085]">{label}</p><p className="mt-3 font-display text-2xl">{value}</p></div>)}</div>}
        {area === 'products' && (productSection === 'Productos' || productSection === 'Subir producto') && <section><div className="mb-4 flex gap-2"><div className="relative flex-1"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos" className="w-full border border-[#E8E3DA] bg-white px-3 py-2 pl-9 text-sm" /></div></div>{productForm && <form onSubmit={saveProduct} className="mb-5 grid gap-3 border border-[#E3C27D] bg-white p-5 sm:grid-cols-2"><input name="name" required placeholder="Nombre" className="border border-[#E8E3DA] p-2" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /><input name="price" type="number" min="0" placeholder="Precio" className="border border-[#E8E3DA] p-2" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /><input name="stock" type="number" min="0" placeholder="Stock" className="border border-[#E8E3DA] p-2" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /><input name="image_url" placeholder="Imagen URL" className="border border-[#E8E3DA] p-2" value={productForm.image_url} onChange={(event) => setProductForm({ ...productForm, image_url: event.target.value })} /><input name="materials" placeholder="Materiales" className="border border-[#E8E3DA] p-2" value={productForm.materials} onChange={(event) => setProductForm({ ...productForm, materials: event.target.value })} /><textarea name="description" placeholder="Descripción" className="border border-[#E8E3DA] p-2" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /><label className="flex items-center gap-2 text-sm"><input name="featured" type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} /> Producto destacado</label><div className="flex gap-2 sm:col-span-2"><button type="submit" className="bg-[#C9A24D] px-4 py-2 text-sm">Guardar cambios</button><button type="button" onClick={() => setProductForm(null)} className="border px-4 py-2 text-sm">Cancelar</button></div></form>}{filteredProducts.length === 0 ? <EmptyState title="Sin productos" text="No hay datos reales cargados." /> : <div className="overflow-x-auto border border-[#E8E3DA] bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-[#E8E3DA] text-xs uppercase text-[#667085]"><tr><th className="p-4">Producto</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4">Acciones</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id} className="border-b border-[#E8E3DA]"><td className="p-4">{product.name}</td><td className="p-4">${product.price}</td><td className="p-4">{product.stock}</td><td className="p-4"><button onClick={() => setProductForm({ ...product, price: String(product.price), stock: String(product.stock), image_url: product.image_url || '', materials: product.materials || '' })} className="mr-3 text-[#667085]">Editar</button><button onClick={() => removeProduct(product.id)} className="text-[#F50078]"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}</section>}
        {area === 'products' && ['Categorías', 'Pedidos', 'Portada / Hero'].includes(productSection) && <EmptyState title="Sin datos configurados" text="Esta sección mostrará únicamente datos reales de Supabase." />}
        {area === 'courses' && <EmptyState title="Sin cursos" text="Cursos, secciones, lecciones, videos y accesos se cargarán desde Supabase." />}
        {area === 'pages' && <EmptyState title="Sin páginas" text="Las páginas se cargarán desde site_pages sin datos ficticios." />}
        {area === 'users' && (users.length ? users.map((user) => <article key={user.id} className="mb-3 border border-[#E8E3DA] bg-white p-4"><p className="font-display text-xl">{user.fullname}</p><p className="text-sm text-[#667085]">ID: {user.id} · {user.email} · {user.age} años</p><button onClick={() => onUpdateUser(user)} className="mt-2 text-sm text-[#C9A24D]">Guardar cambios</button><button onClick={() => onDeleteUser(user.id)} className="ml-4 text-sm text-[#F50078]">Eliminar</button></article>) : <EmptyState title="Sin usuarios" text="Los usuarios reales aparecerán aquí al registrarse." />)}
        {area === 'testimonials' && <EmptyState title="Sin testimonios" text="Las reseñas reales aparecerán aquí para moderación." />}
        {area === 'settings' && <EmptyState title="Ajustes protegidos" text="Roles, contraseñas, copias e integraciones requieren Supabase Auth, RLS y backend seguro." />}
      </main>
    </div>
  </div>;
}

function SearchIcon() { return <span className="pointer-events-none absolute left-3 top-2.5 text-[#667085]">⌕</span>; }
