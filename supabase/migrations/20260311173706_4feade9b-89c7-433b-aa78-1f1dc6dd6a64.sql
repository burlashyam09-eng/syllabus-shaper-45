-- Allow deleting profiles (needed for admin faculty deletion via service role)
CREATE POLICY "Service role can delete profiles" ON public.profiles
FOR DELETE TO service_role USING (true);

-- Allow deleting user_roles (needed for admin faculty deletion via service role)
CREATE POLICY "Service role can delete user_roles" ON public.user_roles
FOR DELETE TO service_role USING (true);