-- 1. Restrict profiles SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Create a SECURITY DEFINER function to safely get profile names by IDs
-- This only exposes id and name, not email/faculty_code
CREATE OR REPLACE FUNCTION public.get_profile_names(_ids uuid[])
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
$$;

-- 3. Create rate limiting table for admin login
CREATE TABLE public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role full access on login attempts"
ON public.admin_login_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);