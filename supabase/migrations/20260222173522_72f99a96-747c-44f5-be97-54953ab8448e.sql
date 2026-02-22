
-- Allow authenticated users to read any profile's name (needed for "Created by" labels)
CREATE POLICY "Authenticated can view profile names"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);
