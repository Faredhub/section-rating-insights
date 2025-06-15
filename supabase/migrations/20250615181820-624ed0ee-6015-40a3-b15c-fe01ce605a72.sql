
-- Enable RLS on faculty table and create policies
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert faculty
CREATE POLICY "Allow authenticated users to insert faculty" 
  ON public.faculty 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create policy to allow authenticated users to select faculty
CREATE POLICY "Allow authenticated users to view faculty" 
  ON public.faculty 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policy to allow authenticated users to update faculty
CREATE POLICY "Allow authenticated users to update faculty" 
  ON public.faculty 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Create policy to allow authenticated users to delete faculty
CREATE POLICY "Allow authenticated users to delete faculty" 
  ON public.faculty 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Also ensure faculty_assignments table has proper RLS policies
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for faculty_assignments
CREATE POLICY "Allow authenticated users to insert faculty assignments" 
  ON public.faculty_assignments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view faculty assignments" 
  ON public.faculty_assignments 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to update faculty assignments" 
  ON public.faculty_assignments 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete faculty assignments" 
  ON public.faculty_assignments 
  FOR DELETE 
  TO authenticated 
  USING (true);
