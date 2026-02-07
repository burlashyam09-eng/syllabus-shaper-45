-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('faculty', 'student');

-- Create branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create regulations table
CREATE TABLE public.regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  regulation_id UUID REFERENCES public.regulations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  regulation_id UUID REFERENCES public.regulations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create units table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  pdf_unlocked BOOLEAN DEFAULT false,
  pdf_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  topics TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create resource types enum
CREATE TYPE public.resource_type AS ENUM ('youtube', 'notes', 'formula', 'important-questions', 'pyq');

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.resource_type NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create student progress table
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, module_id)
);

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's branch_id
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id
$$;

-- Branches policies (everyone can read, only faculty can insert)
CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Faculty can insert branches" ON public.branches FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'faculty'));

-- Regulations policies
CREATE POLICY "Anyone can view regulations" ON public.regulations FOR SELECT USING (true);
CREATE POLICY "Faculty can insert regulations" ON public.regulations FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty can update own regulations" ON public.regulations FOR UPDATE 
  USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own regulations" ON public.regulations FOR DELETE 
  USING (created_by = auth.uid());

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT 
  USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT 
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
  USING (id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Subjects policies (view by branch, CRUD by creator)
CREATE POLICY "Users can view subjects in their branch" ON public.subjects FOR SELECT 
  USING (branch_id = public.get_user_branch_id(auth.uid()));
CREATE POLICY "Faculty can insert subjects" ON public.subjects FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'faculty') AND created_by = auth.uid());
CREATE POLICY "Faculty can update own subjects" ON public.subjects FOR UPDATE 
  USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own subjects" ON public.subjects FOR DELETE 
  USING (created_by = auth.uid());

-- Units policies
CREATE POLICY "Users can view units" ON public.units FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.subjects s 
    WHERE s.id = subject_id AND s.branch_id = public.get_user_branch_id(auth.uid())
  ));
CREATE POLICY "Faculty can insert units" ON public.units FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'faculty') AND EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.created_by = auth.uid()
  ));
CREATE POLICY "Faculty can update own units" ON public.units FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.created_by = auth.uid()
  ));
CREATE POLICY "Faculty can delete own units" ON public.units FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.created_by = auth.uid()
  ));

-- Modules policies
CREATE POLICY "Users can view modules" ON public.modules FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.units u 
    JOIN public.subjects s ON s.id = u.subject_id 
    WHERE u.id = unit_id AND s.branch_id = public.get_user_branch_id(auth.uid())
  ));
CREATE POLICY "Faculty can insert modules" ON public.modules FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'faculty') AND EXISTS (
    SELECT 1 FROM public.units u 
    JOIN public.subjects s ON s.id = u.subject_id 
    WHERE u.id = unit_id AND s.created_by = auth.uid()
  ));
CREATE POLICY "Faculty can update own modules" ON public.modules FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.units u 
    JOIN public.subjects s ON s.id = u.subject_id 
    WHERE u.id = unit_id AND s.created_by = auth.uid()
  ));
CREATE POLICY "Faculty can delete own modules" ON public.modules FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.units u 
    JOIN public.subjects s ON s.id = u.subject_id 
    WHERE u.id = unit_id AND s.created_by = auth.uid()
  ));

-- Resources policies
CREATE POLICY "Users can view resources" ON public.resources FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.modules m 
    JOIN public.units u ON u.id = m.unit_id 
    JOIN public.subjects s ON s.id = u.subject_id 
    WHERE m.id = module_id AND s.branch_id = public.get_user_branch_id(auth.uid())
  ));
CREATE POLICY "Faculty can insert resources" ON public.resources FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'faculty') AND created_by = auth.uid());
CREATE POLICY "Faculty can update own resources" ON public.resources FOR UPDATE 
  USING (created_by = auth.uid());
CREATE POLICY "Faculty can delete own resources" ON public.resources FOR DELETE 
  USING (created_by = auth.uid());

-- Student progress policies
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Students can insert own progress" ON public.student_progress FOR INSERT 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students can update own progress" ON public.student_progress FOR UPDATE 
  USING (user_id = auth.uid());

-- Insert default branches
INSERT INTO public.branches (name) VALUES 
  ('Computer Science Engineering'),
  ('Electronics and Communication Engineering'),
  ('Electrical and Electronics Engineering'),
  ('Mechanical Engineering'),
  ('Civil Engineering'),
  ('Information Technology');

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Storage policies
CREATE POLICY "Anyone can view resource files" ON storage.objects FOR SELECT 
  USING (bucket_id = 'resources');
CREATE POLICY "Faculty can upload files" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty can delete own files" ON storage.objects FOR DELETE 
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'faculty'));