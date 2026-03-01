
-- Drop ALL existing policies on ALL tables and recreate as PERMISSIVE

-- branches
DROP POLICY IF EXISTS "Anyone can view branches" ON public.branches;
DROP POLICY IF EXISTS "Faculty can insert branches" ON public.branches;
CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Faculty can insert branches" ON public.branches FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));

-- regulations
DROP POLICY IF EXISTS "Anyone can view regulations" ON public.regulations;
DROP POLICY IF EXISTS "Faculty can insert regulations" ON public.regulations;
DROP POLICY IF EXISTS "Faculty can update own regulations" ON public.regulations;
DROP POLICY IF EXISTS "Faculty can delete own regulations" ON public.regulations;
CREATE POLICY "Anyone can view regulations" ON public.regulations FOR SELECT USING (true);
CREATE POLICY "Faculty can insert regulations" ON public.regulations FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));
CREATE POLICY "Faculty can update own regulations" ON public.regulations FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own regulations" ON public.regulations FOR DELETE USING (created_by = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Authenticated can view profile names" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (user_id = auth.uid());

-- subjects
DROP POLICY IF EXISTS "Anon can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can view subjects in their branch" ON public.subjects;
DROP POLICY IF EXISTS "Faculty can insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "Faculty can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Faculty can delete own subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Faculty can insert subjects" ON public.subjects FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND created_by = auth.uid());
CREATE POLICY "Faculty can update own subjects" ON public.subjects FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own subjects" ON public.subjects FOR DELETE USING (created_by = auth.uid());

-- units
DROP POLICY IF EXISTS "Anon can view units" ON public.units;
DROP POLICY IF EXISTS "Users can view units" ON public.units;
DROP POLICY IF EXISTS "Faculty can insert units" ON public.units;
DROP POLICY IF EXISTS "Faculty can update own units" ON public.units;
DROP POLICY IF EXISTS "Faculty can delete own units" ON public.units;
CREATE POLICY "Anyone can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Faculty can insert units" ON public.units FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can update own units" ON public.units FOR UPDATE USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can delete own units" ON public.units FOR DELETE USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = units.subject_id AND s.created_by = auth.uid()));

-- modules
DROP POLICY IF EXISTS "Anon can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Faculty can insert modules" ON public.modules;
DROP POLICY IF EXISTS "Faculty can update own modules" ON public.modules;
DROP POLICY IF EXISTS "Faculty can delete own modules" ON public.modules;
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Faculty can insert modules" ON public.modules FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can update own modules" ON public.modules FOR UPDATE USING (EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.created_by = auth.uid()));
CREATE POLICY "Faculty can delete own modules" ON public.modules FOR DELETE USING (EXISTS (SELECT 1 FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = modules.unit_id AND s.created_by = auth.uid()));

-- resources
DROP POLICY IF EXISTS "Anon can view resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can delete own resources" ON public.resources;
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Faculty can insert resources" ON public.resources FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND created_by = auth.uid());
CREATE POLICY "Faculty can update own resources" ON public.resources FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own resources" ON public.resources FOR DELETE USING (created_by = auth.uid());

-- custom_categories
DROP POLICY IF EXISTS "Anon can view custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Users can view custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Faculty can insert custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Faculty can update own custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Faculty can delete own custom categories" ON public.custom_categories;
CREATE POLICY "Anyone can view custom categories" ON public.custom_categories FOR SELECT USING (true);
CREATE POLICY "Faculty can insert custom categories" ON public.custom_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND created_by = auth.uid());
CREATE POLICY "Faculty can update own custom categories" ON public.custom_categories FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own custom categories" ON public.custom_categories FOR DELETE USING (created_by = auth.uid());

-- student_progress
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students can insert own progress" ON public.student_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students can update own progress" ON public.student_progress FOR UPDATE USING (user_id = auth.uid());

-- update_requests
DROP POLICY IF EXISTS "Requester can view own requests" ON public.update_requests;
DROP POLICY IF EXISTS "Owner can view received requests" ON public.update_requests;
DROP POLICY IF EXISTS "Faculty can create requests" ON public.update_requests;
DROP POLICY IF EXISTS "Owner can update request status" ON public.update_requests;
DROP POLICY IF EXISTS "Requester can delete own pending requests" ON public.update_requests;
CREATE POLICY "Requester can view own requests" ON public.update_requests FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "Owner can view received requests" ON public.update_requests FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Faculty can create requests" ON public.update_requests FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) AND requester_id = auth.uid());
CREATE POLICY "Owner can update request status" ON public.update_requests FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Requester can delete own pending requests" ON public.update_requests FOR DELETE USING (requester_id = auth.uid() AND status = 'pending');
