create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.categories (id, name)
select category.id, category.name
from (values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Barbería'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Capilar'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Dermacosmética')
) as category(id, name)
where not exists (select 1 from public.categories existing where lower(existing.name) = lower(category.name))
on conflict (id) do nothing;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  original_price numeric(12,2) check (original_price is null or original_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url text not null default '',
  materials text not null default '',
  highlights text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'sold_out', 'archived')),
  featured boolean not null default false,
  is_new boolean not null default false,
  free_shipping boolean not null default false,
  customizable boolean not null default false,
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists original_price numeric(12,2);
alter table public.products add column if not exists highlights text not null default '';
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists is_new boolean not null default false;
alter table public.products add column if not exists free_shipping boolean not null default false;
alter table public.products add column if not exists customizable boolean not null default false;
alter table public.products add column if not exists image_urls jsonb not null default '[]'::jsonb;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  total numeric(12,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  description text not null default '',
  content text not null default '',
  image_url text not null default '',
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  quote text not null default '',
  rating integer not null default 5 check (rating between 1 and 5),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  event_type text not null,
  page_slug text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  cover_url text not null default '',
  access_type text not null default 'private' check (access_type in ('public', 'private')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.course_sections(id) on delete cascade,
  title text not null,
  description text not null default '',
  video_url text not null default '',
  playlist_url text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_access (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists course_sections_course_idx on public.course_sections(course_id, position);
create index if not exists course_lessons_section_idx on public.course_lessons(section_id, position);
create index if not exists course_access_user_idx on public.course_access(user_id);
create index if not exists user_activity_user_idx on public.user_activity(user_id, created_at desc);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_access enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.testimonials enable row level security;
alter table public.user_activity enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin(required_role text default 'editor')
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where id = auth.uid()
      and (required_role = 'editor' or role = 'owner')
      and (required_role = 'editor' or role = required_role)
  );
$$;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public can view product images" on storage.objects;
drop policy if exists "editors upload product images" on storage.objects;
drop policy if exists "editors update product images" on storage.objects;
drop policy if exists "editors delete product images" on storage.objects;
create policy "public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "editors upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin('editor'));
create policy "editors update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin('editor'));
create policy "editors delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin('editor'));

drop policy if exists "published testimonials are public" on public.testimonials;
drop policy if exists "visitors can submit testimonials" on public.testimonials;
drop policy if exists "admins manage testimonials" on public.testimonials;
drop policy if exists "users can view own activity" on public.user_activity;
drop policy if exists "admins manage pages and commerce" on public.site_pages;
drop policy if exists "owner manages administrators" on public.admins;
drop policy if exists "editors manage categories" on public.categories;
drop policy if exists "editors manage products" on public.products;
drop policy if exists "public can view published products" on public.products;
drop policy if exists "editors manage courses" on public.courses;
drop policy if exists "editors manage course sections" on public.course_sections;
drop policy if exists "editors manage course lessons" on public.course_lessons;
drop policy if exists "editors manage course access" on public.course_access;
drop policy if exists "owners manage users" on public.users;
drop policy if exists "owners manage activity" on public.user_activity;

create policy "published testimonials are public" on public.testimonials
  for select using (published = true);
create policy "visitors can submit testimonials" on public.testimonials
  for insert with check (published = false);
create policy "admins manage testimonials" on public.testimonials
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "users can view own activity" on public.user_activity
  for select using (user_id = auth.uid()::text or public.is_admin('owner'));
create policy "admins manage pages and commerce" on public.site_pages
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "owner manages administrators" on public.admins
  for all using (public.is_admin('owner')) with check (public.is_admin('owner'));
create policy "editors manage categories" on public.categories
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "editors manage products" on public.products
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "public can view published products" on public.products
  for select using (status = 'published');
create policy "editors manage courses" on public.courses
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "editors manage course sections" on public.course_sections
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "editors manage course lessons" on public.course_lessons
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "editors manage course access" on public.course_access
  for all using (public.is_admin('editor')) with check (public.is_admin('editor'));
create policy "owners manage users" on public.users
  for all using (public.is_admin('owner')) with check (public.is_admin('owner'));
create policy "owners manage activity" on public.user_activity
  for all using (public.is_admin('owner')) with check (public.is_admin('owner'));

insert into public.admins (id, email, role)
select id, email, 'owner'
from auth.users
where lower(email) = 'matymoya18@gmail.com'
on conflict (id) do update
set email = excluded.email, role = 'owner';

-- Aplicar políticas según el método de autenticación administrativa antes de producción.

