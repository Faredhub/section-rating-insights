
-- Drop existing tables if they exist to recreate with proper structure
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.faculty_assignments CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create faculty table
CREATE TABLE public.faculty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faculty_stats view for easy aggregation
CREATE OR REPLACE VIEW public.faculty_stats AS
SELECT 
  f.id as faculty_id,
  f.name as faculty_name,
  f.department,
  f.position,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(r.id) as total_ratings
FROM public.faculty f
LEFT JOIN public.ratings r ON f.id = r.faculty_id
GROUP BY f.id, f.name, f.department, f.position;

-- Enable Row Level Security
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for faculty (read-only for authenticated users, admin can manage)
CREATE POLICY "Anyone can view faculty" ON public.faculty
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert faculty" ON public.faculty
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update faculty" ON public.faculty
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete faculty" ON public.faculty
  FOR DELETE TO authenticated
  USING (true);

-- Create RLS policies for ratings
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings" ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.ratings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
