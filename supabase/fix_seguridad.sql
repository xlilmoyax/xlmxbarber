-- Fix seguridad: UNIQUE email + buckets privados
-- Ejecutar en Supabase SQL Editor (una vez). Idempotente.

-- 1) UNIQUE en users.email (previene duplicados aunque el cliente falle)
-- Limpia duplicados conservando el más antiguo antes de crear el índice
WITH dup AS (
  SELECT email, MIN(created_at) as keep_at
  FROM public.users
  GROUP BY email HAVING COUNT(*) > 1
)
DELETE FROM public.users u
USING dup d
WHERE u.email = d.email AND u.created_at > d.keep_at;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- 2) Buckets privados: page-images, course-videos, course-assets deben ser privados
-- y servirse con signed URLs (ya usa getSignedVideoUrl / upload). Si están public, volverlos privados:
UPDATE storage.buckets SET public = false WHERE id IN ('page-images','course-videos','course-assets') AND public = true;

-- 3) Asegurar RLS en buckets (storage.objects): solo anon puede leer objetos publicos si bucket es public;
-- al volverlos privados, se requiere policy con signed URL o service_role. No se toca aquí si ya existe policy.
-- Opcional: revocar lectura anon directa si quieres forzar signed URL:
-- DROP POLICY IF EXISTS "anon read page-images" ON storage.objects;
