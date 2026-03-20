-- Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Also allow service_role to view profiles (for edge functions)
CREATE POLICY "Service role can view profiles"
ON public.profiles
FOR SELECT
TO service_role
USING (true);