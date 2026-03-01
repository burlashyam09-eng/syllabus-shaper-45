
-- Fix subjects
DROP POLICY IF EXISTS "Anon can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can view subjects in their branch" ON public.subjects;
DROP POLICY IF EXISTS "Faculty can insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "Faculty can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Faculty can delete own subjects" ON public.subjects;

CREATE POLICY "Anon can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Users can view subjects in their branch" ON public.subjects FOR SELECT TO authenticated USING (branch_id = get_user_branch_id(auth.uid()));
CREATE POLICY "Faculty can insert subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND created_by = auth.uid());
CREATE POLICY "Faculty can update own subjects" ON public.subjects FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own subjects" ON public.subjects FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Fix units
DROP POLICY IF EXISTS "Anon can view units" ON public.units;
DROP POLICY IF EXISTS "Users can view units" ON public.units;
DROP POLICY IF EXISTS "Faculty can insert units" ON public.units;
DROP POLICY IF EXISTS "Faculty can update own units" ON public.units;
DROP POLICY IF EXISTS "Faculty can delete own units" ON public.units;

CREATE POLICY "Anon can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Users can view units" ON public.units FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.branch_id = get_user_branch_id(auth.uid())));
CREATE POLICY "Faculty can insert units" ON public.units FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can update own units" ON public.units FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can delete own units" ON public.units FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.created_by = auth.uid()));

-- Fix modules
DROP POLICY IF EXISTS "Anon can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Faculty can insert modules" ON public.modules;
DROP POLICY IF EXISTS "Faculty can update own modules" ON public.modules;
DROP POLICY IF EXISTS "Faculty can delete own modules" ON public.modules;

CREATE POLICY "Anon can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Users can view modules" ON public.modules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.branch_id = get_user_branch_id(auth.uid())));
CREATE POLICY "Faculty can insert modules" ON public.modules FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can update own modules" ON public.modules FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can delete own modules" ON public.modules FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.created_by = auth.uid()));

-- Fix resources
DROP POLICY IF EXISTS "Anon can view resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can delete own resources" ON public.resources;

CREATE POLICY "Anon can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Users can view resources" ON public.resources FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM modules m JOIN units u ON u.id = m.unit_id JOIN subjects s ON s.id = u.subject_id WHERE m.id = resources.module_id AND s.branch_id = get_user_branch_id(auth.uid())));
CREATE POLICY "Faculty can insert resources" ON public.resources FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND created_by = auth.uid());
CREATE POLICY "Faculty can update own resources" ON public.resources FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own resources" ON public.resources FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Fix custom_categories
DROP POLICY IF EXISTS "Anon can view custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Users can view custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Faculty can insert custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Faculty can update own custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Faculty can delete own custom categories" ON public.custom_categories;

CREATE POLICY "Anon can view custom categories" ON public.custom_categories FOR SELECT USING (true);
CREATE POLICY "Users can view custom categories" ON public.custom_categories FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = custom_categories.subject_id AND s.branch_id = get_user_branch_id(auth.uid())));
CREATE POLICY "Faculty can insert custom categories" ON public.custom_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND created_by = auth.uid() AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = custom_categories.subject_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can update own custom categories" ON public.custom_categories FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own custom categories" ON public.custom_categories FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Fix student_progress
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;

CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can insert own progress" ON public.student_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students can update own progress" ON public.student_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Fix update_requests
DROP POLICY IF EXISTS "Requester can view own requests" ON public.update_requests;
DROP POLICY IF EXISTS "Owner can view received requests" ON public.update_requests;
DROP POLICY IF EXISTS "Faculty can create requests" ON public.update_requests;
DROP POLICY IF EXISTS "Owner can update request status" ON public.update_requests;
DROP POLICY IF EXISTS "Requester can delete own pending requests" ON public.update_requests;

CREATE POLICY "Requester can view own requests" ON public.update_requests FOR SELECT TO authenticated USING (requester_id = auth.uid());
CREATE POLICY "Owner can view received requests" ON public.update_requests FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Faculty can create requests" ON public.update_requests FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND requester_id = auth.uid());
CREATE POLICY "Owner can update request status" ON public.update_requests FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Requester can delete own pending requests" ON public.update_requests FOR DELETE TO authenticated USING (requester_id = auth.uid() AND status = 'pending');
