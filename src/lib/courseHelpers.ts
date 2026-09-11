/**
 * Helpers para el módulo de Cursos
 */
import { supabase } from './supabaseClient';
import type {
    Course,
    CourseCategory,
    CourseSection,
    CourseLesson,
    CourseVideo,
    CourseResource,
    CourseAccess,
    StudentProgress,
    CourseType,
    CourseStatus,
    LessonStatus,
    VideoStatus,
} from '../types';

/* ---------- Utilidades generales ---------- */

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
    let slug = baseSlug;
    let counter = 1;
    while (existingSlugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
}

export function generateCourseId(): string {
    return crypto.randomUUID();
}

/* ---------- Validación ---------- */

export interface CourseValidationError {
    field: string;
    message: string;
}

export function validateCourse(data: Partial<Course>): CourseValidationError[] {
    const errors: CourseValidationError[] = [];

    if (!data.title?.trim()) errors.push({ field: 'title', message: 'El título es obligatorio' });
    if (!data.category_id) errors.push({ field: 'category_id', message: 'La categoría es obligatoria' });
    if (!data.type) errors.push({ field: 'type', message: 'El tipo de curso es obligatorio' });
    if (!data.short_description?.trim()) errors.push({ field: 'short_description', message: 'La descripción corta es obligatoria' });
    if (!data.full_description?.trim()) errors.push({ field: 'full_description', message: 'La descripción completa es obligatoria' });

    return errors;
}

export function validateSection(data: Partial<CourseSection>): CourseValidationError[] {
    const errors: CourseValidationError[] = [];
    if (!data.title?.trim()) errors.push({ field: 'title', message: 'El título de la sección es obligatorio' });
    return errors;
}

export function validateLesson(data: Partial<CourseLesson>): CourseValidationError[] {
    const errors: CourseValidationError[] = [];
    if (!data.title?.trim()) errors.push({ field: 'title', message: 'El título de la lección es obligatorio' });
    return errors;
}

/* ---------- Ordenación ---------- */

export function reorderItems<T extends { id: string; sort_order: number }>(
    items: T[],
    fromIndex: number,
    toIndex: number
): T[] {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    return newItems.map((item, index) => ({ ...item, sort_order: index }));
}

export function moveItemUp<T extends { id: string; sort_order: number }>(
    items: T[],
    index: number
): T[] {
    if (index <= 0) return items;
    return reorderItems(items, index, index - 1);
}

export function moveItemDown<T extends { id: string; sort_order: number }>(
    items: T[],
    index: number
): T[] {
    if (index >= items.length - 1) return items;
    return reorderItems(items, index, index + 1);
}

/* ---------- Formato ---------- */

export function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
}

export function getCourseTypeLabel(type: CourseType): string {
    const labels: Record<CourseType, string> = {
        basico: 'Básico',
        intermedio: 'Intermedio',
        avanzado: 'Avanzado',
        especializacion: 'Especialización',
        masterclass: 'Masterclass',
    };
    return labels[type] || type;
}

export function getCourseStatusLabel(status: CourseStatus): string {
    const labels: Record<CourseStatus, string> = {
        borrador: 'Borrador',
        privado: 'Privado',
        publicado: 'Publicado',
        archivado: 'Archivado',
    };
    return labels[status] || status;
}

export function getCourseStatusColor(status: CourseStatus): string {
    const colors: Record<CourseStatus, string> = {
        borrador: 'bg-gray-100 text-gray-700',
        privado: 'bg-blue-100 text-blue-700',
        publicado: 'bg-green-100 text-green-700',
        archivado: 'bg-amber-100 text-amber-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getVideoStatusLabel(status: VideoStatus): string {
    const labels: Record<VideoStatus, string> = {
        subiendo: 'Subiendo',
        procesando: 'Procesando',
        listo: 'Listo',
        error: 'Error',
        publicado: 'Publicado',
    };
    return labels[status] || status;
}

export function getVideoStatusColor(status: VideoStatus): string {
    const colors: Record<VideoStatus, string> = {
        subiendo: 'bg-blue-100 text-blue-700',
        procesando: 'bg-amber-100 text-amber-700',
        listo: 'bg-green-100 text-green-700',
        error: 'bg-red-100 text-red-700',
        publicado: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
}

/* ---------- Supabase helpers ---------- */

export async function fetchCategories(): Promise<CourseCategory[]> {
    const { data, error } = await supabase
        .from('course_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');
    if (error) throw error;
    return data || [];
}

export async function fetchCourseTypes(): Promise<{ id: string; label: string }[]> {
    const { data, error } = await supabase
        .from('course_types')
        .select('id, label')
        .order('sort_order');
    if (error) throw error;
    return data || [];
}

export async function fetchCourses(filters?: {
    status?: CourseStatus;
    category_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ courses: Course[]; count: number }> {
    let query = supabase
        .from('courses')
        .select('*, category:course_categories(*)', { count: 'exact' });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category_id) query = query.eq('category_id', filters.category_id);
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

    query = query.order('sort_order').order('created_at', { ascending: false });

    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { courses: data || [], count: count || 0 };
}

export async function fetchCourseWithSections(courseId: string): Promise<Course | null> {
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*, category:course_categories(*)')
        .eq('id', courseId)
        .single();
    if (courseError || !course) return null;

    const { data: sections, error: sectionsError } = await supabase
        .from('course_sections')
        .select(`
            *,
            lessons:course_lessons(
                *,
                videos:course_videos(*),
                resources:course_resources(*)
            )
        `)
        .eq('course_id', courseId)
        .order('sort_order');
    if (sectionsError) throw sectionsError;

    return { ...course, sections: sections || [] };
}

export async function fetchStudentProgress(courseId: string, userId: string): Promise<StudentProgress[]> {
    const { data, error } = await supabase
        .from('student_progress')
        .select('*, lesson:course_lessons(*), video:course_videos(*)')
        .eq('course_id', courseId)
        .eq('user_id', userId);
    if (error) throw error;
    return data || [];
}

export async function fetchCourseAccesses(courseId: string): Promise<CourseAccess[]> {
    const { data, error } = await supabase
        .from('course_accesses')
        .select('*, user:users(*)')
        .eq('course_id', courseId)
        .order('granted_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function fetchCourseMetrics(): Promise<{
    total_courses: number;
    total_sections: number;
    total_lessons: number;
    total_videos: number;
    total_students: number;
    published_courses: number;
    draft_courses: number;
    total_watch_time_seconds: number;
}> {
    const [
        { count: total_courses },
        { count: total_sections },
        { count: total_lessons },
        { count: total_videos },
        { count: total_students },
        { count: published_courses },
        { count: draft_courses },
        { data: watchTime },
    ] = await Promise.all([
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('course_sections').select('*', { count: 'exact', head: true }),
        supabase.from('course_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('course_videos').select('*', { count: 'exact', head: true }),
        supabase.from('course_accesses').select('user_id', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'publicado'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'borrador'),
        supabase.from('student_progress').select('watched_seconds'),
    ]);

    const total_watch_time_seconds = watchTime?.reduce((sum, r) => sum + (r.watched_seconds || 0), 0) || 0;

    return {
        total_courses: total_courses || 0,
        total_sections: total_sections || 0,
        total_lessons: total_lessons || 0,
        total_videos: total_videos || 0,
        total_students: total_students || 0,
        published_courses: published_courses || 0,
        draft_courses: draft_courses || 0,
        total_watch_time_seconds,
    };
}

/* ---------- Accesos ---------- */

export async function grantCourseAccess(params: {
    course_id: string;
    user_id: string;
    section_ids?: string[];
    granted_by: string;
    starts_at?: string;
    expires_at?: string;
    notes?: string;
}): Promise<{ error?: string }> {
    const { error } = await supabase
        .from('course_accesses')
        .upsert({
            course_id: params.course_id,
            user_id: params.user_id,
            section_ids: params.section_ids || null,
            granted_by: params.granted_by,
            starts_at: params.starts_at || null,
            expires_at: params.expires_at || null,
            notes: params.notes || null,
        }, {
            onConflict: 'course_id,user_id',
        });
    return { error: error?.message };
}

export async function revokeCourseAccess(courseId: string, userId: string, revokedBy: string): Promise<{ error?: string }> {
    const { error } = await supabase
        .from('course_accesses')
        .update({ revoked_at: new Date().toISOString(), revoked_by: revokedBy })
        .eq('course_id', courseId)
        .eq('user_id', userId);
    return { error: error?.message };
}

export async function updateCourseAccess(params: {
    course_id: string;
    user_id: string;
    section_ids?: string[];
    starts_at?: string;
    expires_at?: string;
    notes?: string;
}): Promise<{ error?: string }> {
    const { error } = await supabase
        .from('course_accesses')
        .update({
            section_ids: params.section_ids || null,
            starts_at: params.starts_at || null,
            expires_at: params.expires_at || null,
            notes: params.notes || null,
        })
        .eq('course_id', params.course_id)
        .eq('user_id', params.user_id);
    return { error: error?.message };
}

/* ---------- Progreso ---------- */

export async function updateLessonProgress(params: {
    user_id: string;
    course_id: string;
    lesson_id: string;
    video_id?: string;
    watched_seconds: number;
    total_seconds: number;
    completed?: boolean;
}): Promise<{ error?: string }> {
    const { error } = await supabase
        .from('student_progress')
        .upsert({
            user_id: params.user_id,
            course_id: params.course_id,
            lesson_id: params.lesson_id,
            video_id: params.video_id || null,
            watched_seconds: params.watched_seconds,
            total_seconds: params.total_seconds,
            completed: params.completed || false,
            last_position_seconds: params.watched_seconds,
            last_accessed_at: new Date().toISOString(),
            completed_at: params.completed ? new Date().toISOString() : null,
        }, {
            onConflict: 'user_id,lesson_id',
        });
    return { error: error?.message };
}

/* ---------- Storage ---------- */

export async function uploadCourseVideo(file: File, lessonId: string): Promise<{ path: string; error?: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `course-videos/${lessonId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('course-videos').upload(path, file, { upsert: false });
    if (error) return { path: '', error: error.message };
    return { path };
}

export async function uploadCourseAsset(file: File, folder: string): Promise<{ url: string; error?: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('course-assets').upload(path, file, { upsert: false });
    if (error) return { url: '', error: error.message };
    const { data } = supabase.storage.from('course-assets').getPublicUrl(path);
    return { url: data.publicUrl };
}

export async function getSignedVideoUrl(storagePath: string, expiresIn = 3600): Promise<{ url: string; error?: string }> {
    const { data, error } = await supabase.storage.from('course-videos').createSignedUrl(storagePath, expiresIn);
    if (error) return { url: '', error: error.message };
    return { url: data.signedUrl };
}