
-- Fix branches: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anon can view branches" ON public.branches;
DROP POLICY IF EXISTS "Anyone can view branches" ON public.branches;
DROP POLICY IF EXISTS "Faculty can insert branches" ON public.branches;

CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Faculty can insert branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));

-- Fix regulations: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anon can view regulations" ON public.regulations;
DROP POLICY IF EXISTS "Anyone can view regulations" ON public.regulations;
DROP POLICY IF EXISTS "Faculty can insert regulations" ON public.regulations;
DROP POLICY IF EXISTS "Faculty can update own regulations" ON public.regulations;
DROP POLICY IF EXISTS "Faculty can delete own regulations" ON public.regulations;

CREATE POLICY "Anyone can view regulations" ON public.regulations FOR SELECT USING (true);
CREATE POLICY "Faculty can insert regulations" ON public.regulations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));
CREATE POLICY "Faculty can update own regulations" ON public.regulations FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own regulations" ON public.regulations FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Fix profiles: need permissive SELECT
DROP POLICY IF EXISTS "Authenticated can view profile names" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Authenticated can view profile names" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Fix user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (user_id = auth.uid());
