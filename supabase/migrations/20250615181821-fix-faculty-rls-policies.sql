
-- Fix RLS policies for faculty table to allow proper insertion
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to insert faculty" ON public.faculty;
DROP POLICY IF EXISTS "Allow authenticated users to view faculty" ON public.faculty;
DROP POLICY IF EXISTS "Allow authenticated users to update faculty" ON public.faculty;
DROP POLICY IF EXISTS "Allow authenticated users to delete faculty" ON public.faculty;

-- Create more permissive policies for faculty table
CREATE POLICY "Allow all authenticated users to manage faculty" 
  ON public.faculty 
  FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Ensure faculty_assignments also has proper policies
DROP POLICY IF EXISTS "Allow authenticated users to insert faculty assignments" ON public.faculty_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to view faculty assignments" ON public.faculty_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to update faculty assignments" ON public.faculty_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to delete faculty assignments" ON public.faculty_assignments;

CREATE POLICY "Allow all authenticated users to manage faculty assignments" 
  ON public.faculty_assignments 
  FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);
