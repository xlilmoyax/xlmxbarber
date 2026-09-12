-- =============================================
-- ESQUEMA CURSOS - XLMX Barber
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================
-- TABLAS DE CATÁLOGO
-- =============================================

-- Categorías de cursos
create table if not exists public.course_categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    description text,
    image_url text,
    sort_order int not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Tipos de curso (enum como tabla para flexibilidad)
create table if not exists public.course_types (
    id text primary key,
    label text not null,
    description text,
    sort_order int not null default 0
);

insert into public.course_types (id, label, description, sort_order) values
    ('basico', 'Básico', 'Curso introductorio para principiantes', 1),
    ('intermedio', 'Intermedio', 'Curso para quienes tienen conocimientos previos', 2),
    ('avanzado', 'Avanzado', 'Curso de nivel avanzado', 3),
    ('especializacion', 'Especialización', 'Profundización en área específica', 4),
    ('masterclass', 'Masterclass', 'Sesión magistral de experto', 5)
on conflict (id) do nothing;

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- Cursos
create table if not exists public.courses (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    slug text not null unique,
    category_id uuid not null references public.course_categories(id),
    type text not null references public.course_types(id),
    short_description text not null,
    full_description text not null,
    cover_image_url text,
    status text not null default 'borrador' check (status in ('borrador','privado','publicado','archivado')),
    sort_order int not null default 0,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    published_at timestamptz
);

-- Secciones/Módulos
create table if not exists public.course_sections (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid not null references public.courses(id) on delete cascade,
    title text not null,
    description text,
    sort_order int not null default 0,
    status text not null default 'borrador' check (status in ('borrador','publicado','oculto')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- Por si la tabla ya existía sin la columna (migración desde esquema viejo)
alter table public.course_sections add column if not exists status text not null default 'borrador';

-- Lecciones
create table if not exists public.course_lessons (
    id uuid primary key default uuid_generate_v4(),
    section_id uuid not null references public.course_sections(id) on delete cascade,
    title text not null,
    description text,
    sort_order int not null default 0,
    status text not null default 'borrador' check (status in ('borrador','publicado','oculto')),
    estimated_duration_minutes int,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Videos
create table if not exists public.course_videos (
    id uuid primary key default uuid_generate_v4(),
    lesson_id uuid not null references public.course_lessons(id) on delete cascade,
    title text not null,
    description text,
    storage_path text not null,          -- path en bucket (ej. 'course-videos/{lesson_id}/{uuid}.mp4')
    playback_id text,                    -- ID de Mux/Cloudflare Stream si se usa
    thumbnail_url text,                  -- miniatura personalizada o generada
    duration_seconds int,
    file_size_bytes bigint,
    mime_type text,
    sort_order int not null default 0,
    status text not null default 'subiendo' check (status in ('subiendo','procesando','listo','error','publicado')),
    error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Recursos complementarios (PDF, enlaces, imágenes, archivos)
create table if not exists public.course_resources (
    id uuid primary key default uuid_generate_v4(),
    lesson_id uuid not null references public.course_lessons(id) on delete cascade,
    title text not null,
    type text not null check (type in ('pdf','link','image','file')),
    url text not null,                   -- URL pública o path en storage
    file_size_bytes bigint,
    mime_type text,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

-- =============================================
-- ACCESOS Y PERMISOS
-- =============================================

-- Accesos de alumnos a cursos/secciones
create table if not exists public.course_accesses (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid not null references public.courses(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    section_ids uuid[],                  -- null = acceso completo; array = secciones específicas
    granted_by uuid not null references auth.users(id),
    granted_at timestamptz not null default now(),
    starts_at timestamptz,
    expires_at timestamptz,
    revoked_at timestamptz,
    revoked_by uuid references auth.users(id),
    notes text,                          -- notas internas del admin
    updated_at timestamptz not null default now(),
    unique (course_id, user_id)
);
-- Por si la tabla ya existía sin la columna
alter table public.course_accesses add column if not exists updated_at timestamptz not null default now();

-- Progreso de alumnos
create table if not exists public.student_progress (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    lesson_id uuid not null references public.course_lessons(id) on delete cascade,
    video_id uuid references public.course_videos(id) on delete set null,
    completed boolean not null default false,
    watched_seconds int not null default 0,
    total_seconds int not null default 0,
    last_position_seconds int not null default 0,
    completed_at timestamptz,
    last_accessed_at timestamptz not null default now(),
    unique (user_id, lesson_id)
);

-- Roles de admin (extiende la tabla admins existente)
-- Se asume que existe tabla 'admins' con columnas: id, email, role, active
-- Si no existe, crearla:
create table if not exists public.admins (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    role text not null default 'editor' check (role in ('owner','editor')),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

create index if not exists idx_courses_category on public.courses(category_id);
create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_course_sections_course on public.course_sections(course_id);
create index if not exists idx_course_lessons_section on public.course_lessons(section_id);
create index if not exists idx_course_videos_lesson on public.course_videos(lesson_id);
create index if not exists idx_course_resources_lesson on public.course_resources(lesson_id);
create index if not exists idx_course_accesses_course on public.course_accesses(course_id);
create index if not exists idx_course_accesses_user on public.course_accesses(user_id);
create index if not exists idx_student_progress_user_course on public.student_progress(user_id, course_id);
create index if not exists idx_student_progress_lesson on public.student_progress(lesson_id);

-- =============================================
-- TRIGGERS PARA updated_at
-- =============================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

drop trigger if exists trigger_courses_updated on public.courses;
create trigger trigger_courses_updated before update on public.courses
    for each row execute function public.set_updated_at();

drop trigger if exists trigger_course_sections_updated on public.course_sections;
create trigger trigger_course_sections_updated before update on public.course_sections
    for each row execute function public.set_updated_at();

drop trigger if exists trigger_course_lessons_updated on public.course_lessons;
create trigger trigger_course_lessons_updated before update on public.course_lessons
    for each row execute function public.set_updated_at();

drop trigger if exists trigger_course_videos_updated on public.course_videos;
create trigger trigger_course_videos_updated before update on public.course_videos
    for each row execute function public.set_updated_at();

drop trigger if exists trigger_course_accesses_updated on public.course_accesses;
create trigger trigger_course_accesses_updated before update on public.course_accesses
    for each row execute function public.set_updated_at();

drop trigger if exists trigger_admins_updated on public.admins;
create trigger trigger_admins_updated before update on public.admins
    for each row execute function public.set_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.course_categories enable row level security;
alter table public.course_types enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_videos enable row level security;
alter table public.course_resources enable row level security;
alter table public.course_accesses enable row level security;
alter table public.student_progress enable row level security;
alter table public.admins enable row level security;

-- =============================================
-- POLÍTICAS: course_categories (lectura pública, escritura admin)
-- =============================================

drop policy if exists "course_categories_select_public" on public.course_categories;
create policy "course_categories_select_public" on public.course_categories
    for select using (active = true);

drop policy if exists "course_categories_admin_all" on public.course_categories;
create policy "course_categories_admin_all" on public.course_categories
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- =============================================
-- POLÍTICAS: course_types (solo lectura pública)
-- =============================================

drop policy if exists "course_types_select_public" on public.course_types;
create policy "course_types_select_public" on public.course_types
    for select using (true);

-- =============================================
-- POLÍTICAS: courses
-- =============================================

-- Lectura: cursos publicados (público) + todos los cursos para admins
drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published" on public.courses
    for select using (status = 'publicado');

drop policy if exists "courses_select_admin" on public.courses;
create policy "courses_select_admin" on public.courses
    for select using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- Escritura: solo admins
drop policy if exists "courses_insert_admin" on public.courses;
create policy "courses_insert_admin" on public.courses
    for insert with check (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

drop policy if exists "courses_update_admin" on public.courses;
create policy "courses_update_admin" on public.courses
    for update using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

drop policy if exists "courses_delete_admin" on public.courses;
create policy "courses_delete_admin" on public.courses
    for delete using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- =============================================
-- POLÍTICAS: course_sections
-- =============================================

drop policy if exists "course_sections_select_published" on public.course_sections;
create policy "course_sections_select_published" on public.course_sections
    for select using (
        exists (select 1 from public.courses c where c.id = course_id and c.status = 'publicado')
    );

drop policy if exists "course_sections_admin_all" on public.course_sections;
create policy "course_sections_admin_all" on public.course_sections
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- =============================================
-- POLÍTICAS: course_lessons
-- =============================================

drop policy if exists "course_lessons_select_published" on public.course_lessons;
create policy "course_lessons_select_published" on public.course_lessons
    for select using (
        exists (
            select 1 from public.course_sections cs
            join public.courses c on c.id = cs.course_id
            where cs.id = section_id and c.status = 'publicado' and cs.status = 'publicado'
        )
    );

drop policy if exists "course_lessons_admin_all" on public.course_lessons;
create policy "course_lessons_admin_all" on public.course_lessons
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- =============================================
-- POLÍTICAS: course_videos
-- =============================================

-- Los videos son privados: solo admins y estudiantes con acceso
drop policy if exists "course_videos_admin_all" on public.course_videos;
create policy "course_videos_admin_all" on public.course_videos
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- Estudiantes: solo videos de lecciones a las que tienen acceso
drop policy if exists "course_videos_student_access" on public.course_videos;
create policy "course_videos_student_access" on public.course_videos
    for select using (
        exists (
            select 1 from public.course_lessons cl
            join public.course_sections cs on cs.id = cl.section_id
            join public.courses c on c.id = cs.course_id
            left join public.course_accesses ca on ca.course_id = c.id and ca.user_id = auth.uid()
                and (ca.section_ids is null or ca.section_ids @> array[cs.id]::uuid[])
                and ca.revoked_at is null
                and (ca.starts_at is null or ca.starts_at <= now())
                and (ca.expires_at is null or ca.expires_at >= now())
            where cl.id = lesson_id
        )
    );

-- =============================================
-- POLÍTICAS: course_resources
-- =============================================

drop policy if exists "course_resources_admin_all" on public.course_resources;
create policy "course_resources_admin_all" on public.course_resources
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

drop policy if exists "course_resources_student_access" on public.course_resources;
create policy "course_resources_student_access" on public.course_resources
    for select using (
        exists (
            select 1 from public.course_lessons cl
            join public.course_sections cs on cs.id = cl.section_id
            join public.courses c on c.id = cs.course_id
            left join public.course_accesses ca on ca.course_id = c.id and ca.user_id = auth.uid()
                and (ca.section_ids is null or ca.section_ids @> array[cs.id]::uuid[])
                and ca.revoked_at is null
                and (ca.starts_at is null or ca.starts_at <= now())
                and (ca.expires_at is null or ca.expires_at >= now())
            where cl.id = lesson_id
        )
    );

-- =============================================
-- POLÍTICAS: course_accesses
-- =============================================

drop policy if exists "course_accesses_admin_all" on public.course_accesses;
create policy "course_accesses_admin_all" on public.course_accesses
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- Estudiantes: solo ver sus propios accesos
drop policy if exists "course_accesses_student_own" on public.course_accesses;
create policy "course_accesses_student_own" on public.course_accesses
    for select using (user_id = auth.uid());

-- =============================================
-- POLÍTICAS: student_progress
-- =============================================

drop policy if exists "student_progress_admin_all" on public.student_progress;
create policy "student_progress_admin_all" on public.student_progress
    for all using (
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

drop policy if exists "student_progress_student_own" on public.student_progress;
create policy "student_progress_student_own" on public.student_progress
    for all using (user_id = auth.uid());

-- =============================================
-- POLÍTICAS: admins
-- =============================================

drop policy if exists "admins_select_owner" on public.admins;
create policy "admins_select_owner" on public.admins
    for select using (
        exists (select 1 from public.admins where id = auth.uid() and role = 'owner' and active = true)
        or auth.uid() = id
    );

drop policy if exists "admins_insert_owner" on public.admins;
create policy "admins_insert_owner" on public.admins
    for insert with check (
        exists (select 1 from public.admins where id = auth.uid() and role = 'owner' and active = true)
    );

drop policy if exists "admins_update_owner" on public.admins;
create policy "admins_update_owner" on public.admins
    for update using (
        exists (select 1 from public.admins where id = auth.uid() and role = 'owner' and active = true)
    );

-- =============================================
-- BUCKETS DE STORAGE
-- =============================================

-- Bucket para videos de cursos (privado, firmado)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-videos', 'course-videos', false, 5242880000, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;

-- Bucket para miniaturas y recursos (público)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-assets', 'course-assets', true, 52428800, array['image/*','application/pdf'])
on conflict (id) do nothing;

-- Políticas storage course-videos (solo admins y estudiantes con acceso via signed URLs)
drop policy if exists "course_videos_storage_admin" on storage.objects;
create policy "course_videos_storage_admin" on storage.objects
    for all using (
        bucket_id = 'course-videos' and
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

drop policy if exists "course_videos_storage_student" on storage.objects;
create policy "course_videos_storage_student" on storage.objects
    for select using (
        bucket_id = 'course-videos' and
        exists (
            select 1 from public.course_videos cv
            join public.course_lessons cl on cl.id = cv.lesson_id
            join public.course_sections cs on cs.id = cl.section_id
            join public.courses c on c.id = cs.course_id
            left join public.course_accesses ca on ca.course_id = c.id and ca.user_id = auth.uid()
                and (ca.section_ids is null or ca.section_ids @> array[cs.id]::uuid[])
                and ca.revoked_at is null
                and (ca.starts_at is null or ca.starts_at <= now())
                and (ca.expires_at is null or ca.expires_at >= now())
            where cv.storage_path = name
        )
    );

-- Políticas storage course-assets (público para leer, admin para escribir)
drop policy if exists "course_assets_storage_public" on storage.objects;
create policy "course_assets_storage_public" on storage.objects
    for select using (bucket_id = 'course-assets');

drop policy if exists "course_assets_storage_admin" on storage.objects;
create policy "course_assets_storage_admin" on storage.objects
    for all using (
        bucket_id = 'course-assets' and
        exists (select 1 from public.admins where id = auth.uid() and active = true)
    );

-- =============================================
-- REALTIME
-- =============================================

-- Realtime (solo agrega las que falten, para poder re-ejecutar el script)
do $$
declare t text;
begin
  foreach t in array array['courses','course_sections','course_lessons','course_videos','course_accesses','student_progress'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Verificar si un usuario tiene acceso a un curso
create or replace function public.has_course_access(p_course_id uuid, p_user_id uuid)
returns boolean language sql stable as $$
    select exists (
        select 1 from public.course_accesses ca
        where ca.course_id = p_course_id
          and ca.user_id = p_user_id
          and ca.revoked_at is null
          and (ca.starts_at is null or ca.starts_at <= now())
          and (ca.expires_at is null or ca.expires_at >= now())
    );
$$;

-- Verificar si un usuario tiene acceso a una sección específica
create or replace function public.has_section_access(p_section_id uuid, p_user_id uuid)
returns boolean language sql stable as $$
    select exists (
        select 1 from public.course_accesses ca
        join public.course_sections cs on cs.id = p_section_id
        join public.courses c on c.id = cs.course_id
        where ca.course_id = c.id
          and ca.user_id = p_user_id
          and ca.revoked_at is null
          and (ca.section_ids is null or ca.section_ids @> array[cs.id]::uuid[])
          and (ca.starts_at is null or ca.starts_at <= now())
          and (ca.expires_at is null or ca.expires_at >= now())
    );
$$;

-- Obtener progreso de un alumno en un curso
create or replace function public.get_student_course_progress(p_course_id uuid, p_user_id uuid)
returns table (
    total_lessons int,
    completed_lessons int,
    progress_percent numeric,
    total_watched_seconds bigint,
    total_duration_seconds bigint,
    last_accessed_at timestamptz,
    last_lesson_id uuid
) language sql stable as $$
    select
        count(l.id)::int as total_lessons,
        count(sp.id) filter (where sp.completed)::int as completed_lessons,
        case when count(l.id) > 0
            then round(100.0 * count(sp.id) filter (where sp.completed) / count(l.id), 2)
            else 0 end as progress_percent,
        coalesce(sum(sp.watched_seconds), 0)::bigint as total_watched_seconds,
        coalesce(sum(sp.total_seconds), 0)::bigint as total_duration_seconds,
        max(sp.last_accessed_at) as last_accessed_at,
        (select sp2.lesson_id
           from public.student_progress sp2
          where sp2.course_id = p_course_id
            and sp2.user_id = p_user_id
          order by sp2.last_accessed_at desc nulls last
          limit 1) as last_lesson_id
    from public.course_lessons l
    join public.course_sections cs on cs.id = l.section_id
    left join public.student_progress sp on sp.lesson_id = l.id and sp.user_id = p_user_id
    where cs.course_id = p_course_id;
$$;

-- =============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =============================================

-- Categorías de ejemplo
insert into public.course_categories (name, slug, description, sort_order) values
    ('Barbería Clásica', 'barberia-clasica', 'Técnicas tradicionales de corte y afeitado', 1),
    ('Estilismo Moderno', 'estilismo-moderno', 'Tendencias actuales y técnicas vanguardistas', 2),
    ('Cuidado Capilar', 'cuidado-capilar', 'Tratamientos, productos y salud del cabello', 3),
    ('Gestión de Negocio', 'gestion-negocio', 'Administración, marketing y crecimiento de barbería', 4)
on conflict (slug) do nothing;

-- Admin por defecto (reemplazar email por el real)
-- insert into public.admins (id, email, role) values
--     ('TU_UUID_DE_AUTH_USERS', 'matymoya18@gmail.com', 'owner')
-- on conflict (id) do nothing;