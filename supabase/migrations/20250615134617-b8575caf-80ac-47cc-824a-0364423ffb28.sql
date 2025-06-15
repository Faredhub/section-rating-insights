
-- Create student profiles table with academic information
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  year_id UUID REFERENCES public.years(id) NOT NULL,
  semester_id UUID REFERENCES public.semesters(id) NOT NULL,
  section_id UUID REFERENCES public.sections(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for student profiles
CREATE POLICY "Users can view their own profile" ON public.student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create some sample registration numbers for the dropdown
CREATE TABLE public.registration_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample registration numbers
INSERT INTO public.registration_numbers (registration_number) VALUES 
  ('REG001'), ('REG002'), ('REG003'), ('REG004'), ('REG005'),
  ('REG006'), ('REG007'), ('REG008'), ('REG009'), ('REG010'),
  ('REG011'), ('REG012'), ('REG013'), ('REG014'), ('REG015'),
  ('REG016'), ('REG017'), ('REG018'), ('REG019'), ('REG020'),
  ('REG021'), ('REG022'), ('REG023'), ('REG024'), ('REG025'),
  ('REG026'), ('REG027'), ('REG028'), ('REG029'), ('REG030');

-- Enable RLS for registration numbers (allow everyone to read available ones)
ALTER TABLE public.registration_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available registration numbers" ON public.registration_numbers
  FOR SELECT USING (NOT is_used);

-- Trigger to mark registration number as used when a student profile is created
CREATE OR REPLACE FUNCTION mark_registration_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.registration_numbers 
  SET is_used = TRUE 
  WHERE registration_number = NEW.registration_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION mark_registration_used();
