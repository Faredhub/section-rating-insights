
-- Year table for degree/program year (e.g., 1st Year, 2nd Year, etc)
CREATE TABLE public.years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Semester table (linked to year)
CREATE TABLE public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES public.years(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL
);

-- Section table (e.g., A, B, C; linked to semester and year)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL
);

-- Subjects table (e.g., Mathematics, Physics, etc; linked to section)
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL
);

-- Faculty assignment: which faculty teaches which subject in which section
CREATE TABLE public.faculty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL
);

-- Ratings for faculty credentials (per student, per assignment)
CREATE TABLE public.faculty_credentials_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_assignment_id UUID REFERENCES public.faculty_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  -- Credentials ratings (all integers 1-5)
  engagement INTEGER NOT NULL CHECK (engagement BETWEEN 1 AND 5),
  concept_understanding INTEGER NOT NULL CHECK (concept_understanding BETWEEN 1 AND 5),
  content_spread_depth INTEGER NOT NULL CHECK (content_spread_depth BETWEEN 1 AND 5),
  application_oriented_teaching INTEGER NOT NULL CHECK (application_oriented_teaching BETWEEN 1 AND 5),
  pedagogy_techniques_tools INTEGER NOT NULL CHECK (pedagogy_techniques_tools BETWEEN 1 AND 5),
  communication_skills INTEGER NOT NULL CHECK (communication_skills BETWEEN 1 AND 5),
  class_decorum INTEGER NOT NULL CHECK (class_decorum BETWEEN 1 AND 5),
  teaching_aids INTEGER NOT NULL CHECK (teaching_aids BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (faculty_assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.faculty_credentials_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: A student can select, insert, update, and delete their own ratings
CREATE POLICY "Student can view their own ratings" ON public.faculty_credentials_ratings
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Student can insert their own ratings" ON public.faculty_credentials_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Student can update their own ratings" ON public.faculty_credentials_ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Student can delete their own ratings" ON public.faculty_credentials_ratings
  FOR DELETE TO authenticated
  USING (auth.uid() = student_id);

-- Allow reading/management by admin role (optional, can expand if you define admin logic)
