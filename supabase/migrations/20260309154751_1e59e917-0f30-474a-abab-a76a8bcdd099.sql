
CREATE TABLE public.faculty_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  used boolean NOT NULL DEFAULT false,
  used_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code exists (needed during signup)
CREATE POLICY "Anyone can view faculty codes" ON public.faculty_codes
  FOR SELECT USING (true);

-- Mark code as used after signup
CREATE POLICY "Authenticated users can update faculty codes" ON public.faculty_codes
  FOR UPDATE TO authenticated USING (true);
