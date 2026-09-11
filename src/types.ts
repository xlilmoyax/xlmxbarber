/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Screen =
  | 'home'
  | 'sobre-nosotros'
  | 'servicio-domicilio'
  | 'experiencia-360'
  | 'spa-capilar'
  | 'limpieza-facial'
  | 'membresias'
  | 'registro'
  | 'login-admin'
  | 'dashboard-admin'
  | 'legal'
  | 'cursos'
  | 'productos';

export interface RegisteredUser {
  id: string;
  fullname: string;
  age: number;
  email: string;
  phone: string;
  isSocio: boolean;
  membership: 'gold' | 'plata' | 'bronce' | 'ninguno';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  active?: boolean;
  product_count?: number;
}

export interface Order {
  id: string;
  total: number;
  status: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  price_at_time?: number;
  whatsapp_sent_at?: string;
  created_at: string;
}

export interface HeroConfig {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  main_image_url?: string;
  secondary_images?: string[];
  cta_label?: string;
  cta_action?: string;
  featured_product_ids?: string[];
  active?: boolean;
  updated_at?: string;
}

/* ==================== CURSOS ==================== */

export type CourseType = 'basico' | 'intermedio' | 'avanzado' | 'especializacion' | 'masterclass';
export type CourseStatus = 'borrador' | 'privado' | 'publicado' | 'archivado';
export type LessonStatus = 'borrador' | 'publicado' | 'oculto';
export type VideoStatus = 'subiendo' | 'procesando' | 'listo' | 'error' | 'publicado';
export type UserRole = 'owner' | 'editor' | 'student';

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  type: CourseType;
  short_description: string;
  full_description: string;
  cover_image_url?: string;
  status: CourseStatus;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  category?: CourseCategory;
  sections?: CourseSection[];
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  sort_order: number;
  status: LessonStatus;
  estimated_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  videos?: CourseVideo[];
  resources?: CourseResource[];
}

export interface CourseVideo {
  id: string;
  lesson_id: string;
  title: string;
  description?: string;
  storage_path: string;           // path en bucket de videos (ej. Mux/Cloudflare/Supabase Storage)
  playback_id?: string;           // ID de reproducción si usas Mux/Cloudflare Stream
  thumbnail_url?: string;         // miniatura personalizada o generada
  duration_seconds?: number;
  file_size_bytes?: number;
  mime_type?: string;
  sort_order: number;
  status: VideoStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseResource {
  id: string;
  lesson_id: string;
  title: string;
  type: 'pdf' | 'link' | 'image' | 'file';
  url: string;                    // URL o path en storage
  file_size_bytes?: number;
  mime_type?: string;
  sort_order: number;
  created_at: string;
}

export interface CourseAccess {
  id: string;
  course_id: string;
  user_id: string;                // FK a auth.users / users table
  section_ids?: string[];         // null = acceso a todo el curso; array = secciones específicas
  granted_by: string;             // admin que autorizó
  granted_at: string;
  starts_at?: string;             // fecha de inicio de acceso
  expires_at?: string;            // fecha de vencimiento opcional
  revoked_at?: string;            // si fue revocado
  revoked_by?: string;
  notes?: string;                 // notas internas del admin
  user?: RegisteredUser;          // joined
}

export interface StudentProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  video_id?: string;
  completed: boolean;
  watched_seconds: number;
  total_seconds: number;
  last_position_seconds: number;
  completed_at?: string;
  last_accessed_at: string;
  user?: RegisteredUser;
  lesson?: CourseLesson;
  video?: CourseVideo;
}

export interface CourseMetrics {
  total_courses: number;
  total_sections: number;
  total_lessons: number;
  total_videos: number;
  total_students: number;
  published_courses: number;
  draft_courses: number;
  total_watch_time_seconds: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  last_sign_in_at?: string;
}
