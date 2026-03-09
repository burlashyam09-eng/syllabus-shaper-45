
-- Fix: restrict UPDATE to only the user who is signing up (used_by = auth.uid())
DROP POLICY "Authenticated users can update faculty codes" ON public.faculty_codes;
CREATE POLICY "Authenticated users can mark code as used" ON public.faculty_codes
  FOR UPDATE TO authenticated USING (used = false) WITH CHECK (used_by = auth.uid());
