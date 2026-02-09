
-- Add language column to resources for YouTube videos
ALTER TABLE public.resources ADD COLUMN language text DEFAULT 'english';

-- Add avatar_url to profiles for faculty photo
ALTER TABLE public.profiles ADD COLUMN avatar_url text;
