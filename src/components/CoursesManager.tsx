/**
 * Panel de gestión de Cursos para administradores
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, Eye, Copy, BookOpen, Video, Users, BarChart2, Settings, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchCourses, fetchCategories, fetchCourseTypes, fetchCourseMetrics, grantCourseAccess, revokeCourseAccess, updateCourseAccess, generateSlug } from '../lib/courseHelpers';
import type { Course, CourseCategory, CourseStatus, CourseAccess } from '../types';

interface CoursesManagerProps {
    onNavigate?: (screen: string) => void;
}

export default function CoursesManager({ onNavigate }: CoursesManagerProps) {
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'sections' | 'videos' | 'access'>('list');
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [courseTypes, setCourseTypes] = useState<{id: string, label: string}[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [accessSearch, setAccessSearch] = useState('');
    const [accessUserResults, setAccessUserResults] = useState<any[]>([]);
    const [accessLoading, setAccessLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [coursesRes, cats, types, mets] = await Promise.all([
                fetchCourses({ search, status: statusFilter !== 'all' ? statusFilter : undefined, category_id: categoryFilter !== 'all' ? categoryFilter : undefined }),
                fetchCategories(),
                fetchCourseTypes(),
                fetchCourseMetrics(),
            ]);
            setCourses(coursesRes.courses);
            setCategories(cats);
            setCourseTypes(types);
            setMetrics(mets);
        } catch (err) {
            console.error('Error cargando cursos:', err);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, categoryFilter]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreateCourse = () => {
        setSelectedCourse(null);
        setActiveTab('create');
    };

    const handleEditCourse = (course: Course) => {
        setSelectedCourse(course);
        setActiveTab('edit');
    };

    const handleViewSections = (course: Course) => {
        setSelectedCourse(course);
        setActiveTab('sections');
    };

    const handleViewVideos = (course: Course) => {
        setSelectedCourse(course);
        setActiveTab('videos');
    };

    const handleViewAccess = async (course: Course) => {
        setSelectedCourse(course);
        setActiveTab('access');
        // Cargar accesos existentes
        const { data } = await supabase
            .from('course_accesses')
            .select('*, user:users(*)')
            .eq('course_id', course.id)
            .order('granted_at', { ascending: false });
        // Los accesos se manejan en el tab access
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        try {
            const { error } = await supabase.from('courses').delete().eq('id', selectedCourse.id);
            if (error) throw error;
            setShowDeleteConfirm(false);
            loadData();
        } catch (err) {
            console.error('Error eliminando curso:', err);
            alert('Error al eliminar el curso');
        }
    };

    const handleDuplicateCourse = async () => {
        if (!selectedCourse) return;
        try {
            const { data, error } = await supabase
                .from('courses')
                .insert({
                    ...selectedCourse,
                    title: `${selectedCourse.title} (Copia)`,
                    slug: `${selectedCourse.slug}-copia-${Date.now()}`,
                    status: 'borrador',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    published_at: null,
                })
                .select()
                .single();
            if (error) throw error;
            loadData();
            setSelectedCourse(data);
            setActiveTab('edit');
        } catch (err) {
            console.error('Error duplicando curso:', err);
            alert('Error al duplicar el curso');
        }
    };

    const handleSearchUsers = async (query: string) => {
        if (query.length < 2) { setAccessUserResults([]); return; }
        setAccessLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, fullname, email, isSocio, membership, createdAt')
                .or(`fullname.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(10);
            if (error) throw error;
            setAccessUserResults(data || []);
        } catch (err) {
            console.error('Error buscando usuarios:', err);
        } finally {
            setAccessLoading(false);
        }
    };

    const handleGrantAccess = async (userId: string) => {
        if (!selectedCourse) return;
        try {
            const { error } = await grantCourseAccess({
                course_id: selectedCourse.id,
                user_id: userId,
                granted_by: (await supabase.auth.getUser()).data.user?.id || '',
            });
            if (error) throw error;
            setAccessUserResults([]); // Clear search results
            setAccessSearch('');
            handleViewAccess(selectedCourse); // Recargar
        } catch (err) {
            console.error('Error otorgando acceso:', err);
            alert('Error al otorgar acceso');
        }
    };

    const handleRevokeAccess = async (userId: string) => {
        if (!selectedCourse) return;
        try {
            await revokeCourseAccess(selectedCourse.id, userId, (await supabase.auth.getUser()).data.user?.id || '');
            handleViewAccess(selectedCourse);
        } catch (err) {
            console.error('Error revocando acceso:', err);
            alert('Error al revocar acceso');
        }
    };

    const filteredCourses = courses.filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && c.category_id !== categoryFilter) return false;
        return true;
    });

    const statusColors: Record<CourseStatus, string> = {
        borrador: 'bg-gray-100 text-gray-700',
        privado: 'bg-blue-100 text-blue-700',
        publicado: 'bg-green-100 text-green-700',
        archivado: 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <BookOpen className="w-8 h-8 text-amber-500" />
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">Gestión de Cursos</h1>
                                <p className="text-sm text-zinc-500">Administra cursos, secciones, lecciones, videos y accesos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleCreateCourse} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Nuevo Curso
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Métricas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                    <MetricCard icon={BookOpen} label="Total Cursos" value={metrics?.total_courses || 0} color="blue" />
                    <MetricCard icon={Video} label="Total Videos" value={metrics?.total_videos || 0} color="purple" />
                    <MetricCard icon={Users} label="Alumnos" value={metrics?.total_students || 0} color="green" />
                    <MetricCard icon={BarChart2} label="Publicados" value={metrics?.published_courses || 0} color="emerald" />
                    <MetricCard icon={Settings} label="Borradores" value={metrics?.draft_courses || 0} color="amber" />
                    <MetricCard icon={Clock} label="Horas Visto" value={Math.round((metrics?.total_watch_time_seconds || 0) / 3600)} color="indigo" />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <nav className="flex border-b border-zinc-200" aria-label="Tabs">
                        <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')}>📋 Listado</TabButton>
                        {selectedCourse && (
                            <>
                                <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')}>✏️ Editar Curso</TabButton>
                                <TabButton active={activeTab === 'sections'} onClick={() => setActiveTab('sections')}>📚 Secciones</TabButton>
                                <TabButton active={activeTab === 'videos'} onClick={() => setActiveTab('videos')}>🎬 Videos</TabButton>
                                <TabButton active={activeTab === 'access'} onClick={() => setActiveTab('access')}>🔐 Accesos</TabButton>
                            </>
                        )}
                    </nav>

                    <div className="p-6">
                        {activeTab === 'list' && (
                            <CourseList
                                courses={filteredCourses}
                                categories={categories}
                                courseTypes={courseTypes}
                                loading={loading}
                                onEdit={handleEditCourse}
                                onSections={handleViewSections}
                                onVideos={handleViewVideos}
                                onAccess={handleViewAccess}
                                onDuplicate={handleDuplicateCourse}
                                onDelete={() => { setShowDeleteConfirm(true); }}
                                statusColors={statusColors}
                            />
                        )}

                        {activeTab === 'create' && <CourseForm onBack={() => setActiveTab('list')} onSaved={loadData} categories={categories} courseTypes={courseTypes} />}

                        {activeTab === 'edit' && selectedCourse && (
                            <CourseForm
                                course={selectedCourse}
                                onBack={() => setActiveTab('list')}
                                onSaved={loadData}
                                categories={categories}
                                courseTypes={courseTypes}
                            />
                        )}

                        {activeTab === 'sections' && selectedCourse && (
                            <CourseSectionsManager
                                course={selectedCourse}
                                onBack={() => setActiveTab('list')}
                            />
                        )}

                        {activeTab === 'videos' && selectedCourse && (
                            <CourseVideosManager
                                course={selectedCourse}
                                onBack={() => setActiveTab('list')}
                            />
                        )}

                        {activeTab === 'access' && selectedCourse && (
                            <CourseAccessManager
                                course={selectedCourse}
                                onBack={() => setActiveTab('list')}
                                onSearchUsers={handleSearchUsers}
                                onGrantAccess={handleGrantAccess}
                                onRevokeAccess={handleRevokeAccess}
                                accessSearch={accessSearch}
                                setAccessSearch={setAccessSearch}
                                accessUserResults={accessUserResults}
                                accessLoading={accessLoading}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmar eliminación */}
            {showDeleteConfirm && selectedCourse && (
                <ConfirmModal
                    title="Eliminar curso"
                    message={`¿Estás seguro de eliminar "${selectedCourse.title}"? Esta acción no se puede deshacer.`}
                    onConfirm={handleDeleteCourse}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="Eliminar"
                    confirmClass="bg-red-500 hover:bg-red-600"
                />
            )}
        </div>
    );
}

/* ---------- Componentes auxiliares ---------- */

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<any>; label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[color] || colors.blue}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                active
                    ? 'border-amber-500 text-amber-600 bg-amber-50'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            }`}
        >
            {children}
        </button>
    );
}

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText, confirmClass }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
                <p className="text-zinc-600 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg ${confirmClass}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

/* ---------- CourseList ---------- */

function CourseList({ courses, categories, courseTypes, loading, onEdit, onSections, onVideos, onAccess, onDuplicate, onDelete, statusColors }: any) {
    if (loading) return <div className="text-center py-12">Cargando...</div>;

    if (courses.length === 0) {
        return (
            <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-zinc-600 mb-2">No hay cursos aún</h3>
                <p className="text-zinc-500 mb-6">Crea tu primer curso para empezar</p>
                <button onClick={() => window.dispatchEvent(new CustomEvent('create-course'))} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg">
                    Crear primer curso
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {courses.map(course => {
                const category = categories.find(c => c.id === course.category_id);
                const type = courseTypes.find(t => t.id === course.type);
                return (
                    <div key={course.id} className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-amber-300 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="font-semibold text-zinc-900 truncate">{course.title}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[course.status]}`}>
                                        {course.status}
                                    </span>
                                    {category && <span className="px-2 py-0.5 text-xs text-zinc-500 bg-zinc-100 rounded-full">{category.name}</span>}
                                    {type && <span className="px-2 py-0.5 text-xs text-zinc-500 bg-zinc-100 rounded-full">{type.label}</span>}
                                </div>
                                <p className="text-sm text-zinc-500 mt-1 truncate">{course.short_description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                                    <span>Creado: {new Date(course.created_at).toLocaleDateString()}</span>
                                    {course.published_at && <span>Publicado: {new Date(course.published_at).toLocaleDateString()}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => onEdit(course)} className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg" title="Editar">✏️</button>
                                <button onClick={() => onSections(course)} className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg" title="Secciones">📚</button>
                                <button onClick={() => onVideos(course)} className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg" title="Videos">🎬</button>
                                <button onClick={() => onAccess(course)} className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg" title="Accesos">🔐</button>
                                <button onClick={() => { onDuplicate(course); }} className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg" title="Duplicar">📋</button>
                                <button onClick={() => { onDelete(course); }} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ---------- CourseForm ---------- */

function CourseForm({ course, onBack, onSaved, categories, courseTypes }: any) {
    const [form, setForm] = useState({
        title: '',
        slug: '',
        category_id: '',
        type: 'basico',
        short_description: '',
        full_description: '',
        cover_image_url: '',
        status: 'borrador' as CourseStatus,
        sort_order: 0,
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (course) {
            setForm({
                title: course.title,
                slug: course.slug,
                category_id: course.category_id,
                type: course.type,
                short_description: course.short_description,
                full_description: course.full_description,
                cover_image_url: course.cover_image_url || '',
                status: course.status,
                sort_order: course.sort_order,
            });
        }
    }, [course]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = 'El título es obligatorio';
        if (!form.category_id) newErrors.category_id = 'La categoría es obligatoria';
        if (!form.type) newErrors.type = 'El tipo es obligatorio';
        if (!form.short_description.trim()) newErrors.short_description = 'La descripción corta es obligatoria';
        if (!form.full_description.trim()) newErrors.full_description = 'La descripción completa es obligatoria';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = { ...form, updated_at: new Date().toISOString() };
            if (course) {
                const { error } = await supabase.from('courses').update(payload).eq('id', course.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('courses').insert({
                    ...payload,
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                });
                if (error) throw error;
            }
            onSaved();
            onBack();
        } catch (err) {
            console.error('Error guardando curso:', err);
            alert('Error al guardar el curso');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{course ? 'Editar Curso' : 'Nuevo Curso'}</h2>
                <button type="button" onClick={onBack} className="text-zinc-500 hover:text-zinc-700">← Volver</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Título *">
                    <input
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        placeholder="Ej: Corte Clásico Profesional"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </Field>

                <Field label="Slug (URL) *">
                    <input
                        value={form.slug}
                        onChange={e => setForm({ ...form, slug: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                    {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                </Field>

                <Field label="Categoría *">
                    <select
                        value={form.category_id}
                        onChange={e => setForm({ ...form, category_id: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                        <option value="">Seleccionar categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                </Field>

                <Field label="Tipo *">
                    <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                        {courseTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                </Field>

                <Field label="Estado" className="sm:col-span-2">
                    <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value as CourseStatus })}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                        <option value="borrador">Borrador</option>
                        <option value="privado">Privado</option>
                        <option value="publicado">Publicado</option>
                        <option value="archivado">Archivado</option>
                    </select>
                </Field>

                <Field label="Imagen de portada (URL)" className="sm:col-span-2">
                    <input
                        value={form.cover_image_url}
                        onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        placeholder="https://..."
                    />
                </Field>

                <Field label="Orden" className="sm:col-span-2">
                    <input
                        type="number"
                        value={form.sort_order}
                        onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-32 px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                </Field>
            </div>

            <Field label="Descripción corta *" className="sm:col-span-2">
                <textarea
                    value={form.short_description}
                    onChange={e => setForm({ ...form, short_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="Descripción breve para listados y SEO (máx. 300 caracteres)"
                />
                {errors.short_description && <p className="text-red-500 text-sm mt-1">{errors.short_description}</p>}
            </Field>

            <Field label="Descripción completa *" className="sm:col-span-2">
                <textarea
                    value={form.full_description}
                    onChange={e => setForm({ ...form, full_description: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none font-mono text-sm"
                    placeholder="Descripción completa con formato markdown..."
                />
                {errors.full_description && <p className="text-red-500 text-sm mt-1">{errors.full_description}</p>}
            </Field>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button type="button" onClick={onBack} className="px-6 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg disabled:opacity-50">
                    {saving ? 'Guardando...' : (course ? 'Actualizar' : 'Crear')}
                </button>
            </div>
        </form>
    );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
            {children}
        </div>
    );
}

/* ---------- CourseSectionsManager (placeholder) ---------- */

function CourseSectionsManager({ course, onBack }: any) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Secciones de: {course.title}</h2>
                <button onClick={onBack} className="text-zinc-500 hover:text-zinc-700">← Volver</button>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-500">
                <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p>Gestión de secciones y lecciones con drag & drop (próximamente)</p>
            </div>
        </div>
    );
}

/* ---------- CourseVideosManager (placeholder) ---------- */

function CourseVideosManager({ course, onBack }: any) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Videos de: {course.title}</h2>
                <button onClick={onBack} className="text-zinc-500 hover:text-zinc-700">← Volver</button>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-500">
                <Video className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p>Gestión de videos: subida, miniaturas, recursos (próximamente)</p>
            </div>
        </div>
    );
}

/* ---------- CourseAccessManager ---------- */

function CourseAccessManager({
    course,
    onBack,
    onSearchUsers,
    onGrantAccess,
    onRevokeAccess,
    accessSearch,
    setAccessSearch,
    accessUserResults,
    accessLoading,
}: any) {
    const [accesses, setAccesses] = useState<CourseAccess[]>([]);
    const [loadingAccesses, setLoadingAccesses] = useState(true);

    useEffect(() => {
        loadAccesses();
    }, [course]);

    const loadAccesses = async () => {
        setLoadingAccesses(true);
        try {
            const { data, error } = await supabase
                .from('course_accesses')
                .select('*, user:users(*)')
                .eq('course_id', course.id)
                .order('granted_at', { ascending: false });
            if (error) throw error;
            setAccesses(data || []);
        } catch (err) {
            console.error('Error cargando accesos:', err);
        } finally {
            setLoadingAccesses(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Accesos de: {course.title}</h2>
                <button onClick={onBack} className="text-zinc-500 hover:text-zinc-700">← Volver</button>
            </div>

            {/* Buscar usuarios para agregar */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
                <h3 className="font-medium text-zinc-900 mb-4">Agregar acceso</h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={accessSearch}
                        onChange={e => { setAccessSearch(e.target.value); onSearchUsers(e.target.value); }}
                        placeholder="Buscar usuario por nombre o email..."
                        className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                    {accessLoading && <span className="flex items-center px-4 text-zinc-500">Buscando...</span>}
                </div>
                {accessUserResults.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto border border-zinc-200 rounded-lg">
                        {accessUserResults.map((user: any) => {
                            const hasAccess = accesses.some(a => a.user_id === user.id);
                            return (
                                <div key={user.id} className="px-3 py-2 border-b border-zinc-100 last:border-0 flex items-center justify-between hover:bg-zinc-50">
                                    <div>
                                        <p className="font-medium text-zinc-900">{user.fullname}</p>
                                        <p className="text-sm text-zinc-500">{user.email}</p>
                                    </div>
                                    {hasAccess ? (
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Ya tiene acceso</span>
                                    ) : (
                                        <button
                                            onClick={() => { onGrantAccess(user.id); }}
                                            className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-400"
                                        >
                                            Otorgar acceso
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lista de accesos existentes */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                {loadingAccesses ? (
                    <div className="p-8 text-center text-zinc-500">Cargando...</div>
                ) : accesses.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No hay accesos otorgados aún</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Alumno</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Alcance</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Inicio</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Vence</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {accesses.map(access => (
                                    <tr key={access.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-zinc-900">{access.user?.fullname || 'Usuario'}</p>
                                            <p className="text-sm text-zinc-500">{access.user?.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-600">
                                            {access.section_ids && access.section_ids.length > 0
                                                ? `${access.section_ids.length} sección(es)`
                                                : 'Curso completo'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-600">
                                            {access.starts_at ? new Date(access.starts_at).toLocaleDateString() : 'Inmediato'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-600">
                                            {access.expires_at ? new Date(access.expires_at).toLocaleDateString() : 'Sin vencimiento'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {access.revoked_at ? (
                                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Revocado</span>
                                            ) : (
                                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Activo</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {!access.revoked_at && (
                                                <button
                                                    onClick={() => onRevokeAccess(access.user_id)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Revocar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Importar Clock para métricas
import { Clock } from 'lucide-react';