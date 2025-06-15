
-- 1. Create sections table first (since users and subjects reference it)
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- 2. Create users table (references sections and auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'faculty')),
  section_id uuid REFERENCES sections(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create subjects table (references sections)
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section_id uuid REFERENCES sections(id)
);

-- 4. Create faculty_assignments table (joins users, subjects, sections)
CREATE TABLE public.faculty_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE
);

-- 5. Create ratings table
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  faculty_assignment_id uuid REFERENCES faculty_assignments(id) ON DELETE CASCADE,
  rating int CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS and restrict access: users can see their own info, students submit ratings, faculty see their ratings
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS for users table: users can see and edit their own entry
CREATE POLICY "Users can view & edit their profile" ON public.users
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS for ratings: students can insert ratings, faculty & students can select appropriate ratings
CREATE POLICY "Students can submit ratings" ON public.ratings
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY "View own submitted ratings" ON public.ratings
  FOR SELECT USING (
    student_id = auth.uid()
  );

-- Allow faculty to view ratings for their assignments
CREATE POLICY "Faculty can view received ratings" ON public.ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.faculty_assignments fa
      WHERE fa.id = faculty_assignment_id
        AND fa.faculty_id = auth.uid()
    )
  );
