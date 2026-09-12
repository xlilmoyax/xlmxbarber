/**
 * Vista pública de catálogo de cursos para alumnos autorizados
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, Lock, Clock, CheckCircle, ChevronRight, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchCourses, fetchCourseMetrics, getCourseTypeLabel, getCourseStatusColor } from '../lib/courseHelpers';
import type { Course, CourseType, CourseStatus } from '../types';

interface CourseCatalogViewProps {
    onNavigate: (screen: string) => void;
    onCourseSelect: (course: Course) => void;
}

export default function CourseCatalogView({ onNavigate, onCourseSelect }: CourseCatalogViewProps) {
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<CourseType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');

    useEffect(() => {
        loadMyCourses();
    }, []);

    const loadMyCourses = async () => {
        setLoading(true);
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) { setMyCourses([]); setLoading(false); return; }

            // Obtener cursos a los que el usuario tiene acceso
            const { data: accesses } = await supabase
                .from('course_accesses')
                .select('course_id')
                .eq('user_id', user.user.id)
                .is('revoked_at', null)
                .or('starts_at.is.null,starts_at.lte.' + new Date().toISOString())
                .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

            if (!accesses || accesses.length === 0) { setMyCourses([]); setLoading(false); return; }

            const courseIds = accesses.map(a => a.course_id);
            const { data, error } = await supabase
                .from('courses')
                .select('*, category:course_categories(*)')
                .in('id', courseIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMyCourses(data || []);
        } catch (err) {
            console.error('Error cargando mis cursos:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = myCourses.filter(c => {
        if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
            !c.short_description.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        return true;
    });

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <section className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
            <header className="bg-white border-b border-zinc-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <BookOpen className="w-10 h-10 text-amber-500 mb-2" />
                            <h1 className="text-3xl font-bold text-zinc-900">Mis Cursos</h1>
                            <p className="text-zinc-500 mt-1">Continúa tu aprendizaje donde lo dejaste</p>
                        </div>
                        <button onClick={() => onNavigate('home')} className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50">← Volver al inicio</button>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar cursos..."
                                className="pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none w-64"
                            />
                        </div>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none">
                            <option value="all">Todos los tipos</option>
                            <option value="basico">Básico</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="avanzado">Avanzado</option>
                            <option value="especializacion">Especialización</option>
                            <option value="masterclass">Masterclass</option>
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-4 py-2 border border-zinc-300 rounded-lg focus:border-amber-500 focus:outline-none">
                            <option value="all">Todos los estados</option>
                            <option value="publicado">Publicado</option>
                            <option value="privado">Privado</option>
                        </select>
                        {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
                            <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }} className="px-4 py-2 text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                                <X className="w-4 h-4" /> Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-zinc-600 mb-2">{myCourses.length === 0 ? 'No tienes cursos asignados' : 'No hay cursos con esos filtros'}</h3>
                        <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                            {myCourses.length === 0
                                ? 'Contacta a tu administrador para obtener acceso a los cursos disponibles.'
                                : 'Prueba cambiando los filtros de búsqueda.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses.map(course => (
                            <CourseCard key={course.id} course={course} onClick={() => onCourseSelect(course)} />
                        ))}
                    </div>
                )}
            </main>
        </section>
    );
}

function CourseCard({ course, onClick }: { course: any; onClick: () => void }) {
    const category = course.category;
    return (
        <article className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer" onClick={onClick}>
            <div className="relative aspect-video overflow-hidden bg-zinc-100">
                {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50">
                        <BookOpen className="w-12 h-12 text-amber-300" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCourseStatusColor(course.status)}`}>{course.status}</span>
                    <span className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded">{getCourseTypeLabel(course.type)}</span>
                </div>
            </div>
            <div className="p-4">
                {course.category && (
                    <p className="text-xs text-amber-600 font-medium mb-1">{category.name}</p>
                )}
                <h3 className="font-semibold text-zinc-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{course.short_description}</p>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>📚 {course.sections?.length || 0} módulos</span>
                    <PlayCircle className="w-5 h-5 text-amber-500" />
                </div>
            </div>
        </article>
    );
}