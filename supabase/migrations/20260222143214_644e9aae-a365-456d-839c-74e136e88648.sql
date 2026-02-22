
-- Custom categories table for faculty custom tabs
CREATE TABLE public.custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view custom categories (for their branch)
CREATE POLICY "Users can view custom categories"
  ON public.custom_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = custom_categories.subject_id
      AND s.branch_id = get_user_branch_id(auth.uid())
  ));

-- Faculty can insert custom categories for their own subjects
CREATE POLICY "Faculty can insert custom categories"
  ON public.custom_categories FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'faculty') AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = custom_categories.subject_id AND s.created_by = auth.uid()
    )
  );

-- Faculty can update their own custom categories
CREATE POLICY "Faculty can update own custom categories"
  ON public.custom_categories FOR UPDATE
  USING (created_by = auth.uid());

-- Faculty can delete their own custom categories
CREATE POLICY "Faculty can delete own custom categories"
  ON public.custom_categories FOR DELETE
  USING (created_by = auth.uid());

-- Add custom_category_id to resources
ALTER TABLE public.resources ADD COLUMN custom_category_id uuid REFERENCES public.custom_categories(id) ON DELETE CASCADE;

-- Add anon SELECT policies for student browsing (no login)
CREATE POLICY "Anon can view subjects" ON public.subjects FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view units" ON public.units FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view modules" ON public.modules FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view resources" ON public.resources FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view custom categories" ON public.custom_categories FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view branches" ON public.branches FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view regulations" ON public.regulations FOR SELECT TO anon USING (true);
