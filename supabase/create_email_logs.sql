-- Crear tabla email_logs para seguimiento de emails (faltaba en el schema)
-- Ejecutar esto en el SQL Editor de Supabase

create table if not exists public.email_logs (
    id uuid primary key default uuid_generate_v4(),
    job_id uuid not null,                  -- ID del job EmailJS o similar
    status text not null default 'pending' check (status in ('pending','sent','failed')),
    attempts int not null default 0,
    error_message text,
    sent_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Índice para queries por status
create index if not exists idx_email_logs_status on public.email_logs(status);

-- Índice para queries por job_id
create index if not exists idx_email_logs_job_id on public.email_logs(job_id);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

drop trigger if exists trigger_email_logs_updated on public.email_logs;
create trigger trigger_email_logs_updated before update on public.email_logs
    for each row execute function public.set_updated_at();