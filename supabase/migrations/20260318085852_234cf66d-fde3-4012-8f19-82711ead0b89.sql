-- 1. Fix user_roles: restrict INSERT to student role only
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own student role" ON public.user_roles
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid() AND role = 'student'::app_role);

-- 2. Fix faculty_codes: remove public SELECT, add service_role only
DROP POLICY IF EXISTS "Anyone can view faculty codes" ON public.faculty_codes;
CREATE POLICY "Service role can view faculty codes" ON public.faculty_codes
  FOR SELECT TO service_role
  USING (true);

-- 3. Create admin_tokens table for server-side token validation
CREATE TABLE IF NOT EXISTS public.admin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  branch_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

ALTER TABLE public.admin_tokens ENABLE ROW LEVEL SECURITY;

-- Only service_role can access admin_tokens
CREATE POLICY "Service role full access" ON public.admin_tokens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);