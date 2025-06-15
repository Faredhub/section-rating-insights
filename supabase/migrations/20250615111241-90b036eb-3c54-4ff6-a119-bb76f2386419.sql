
-- Insert sample data for testing the student dashboard flow
INSERT INTO public.years (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '1st Year'),
  ('550e8400-e29b-41d4-a716-446655440002', '2nd Year'),
  ('550e8400-e29b-41d4-a716-446655440003', '3rd Year'),
  ('550e8400-e29b-41d4-a716-446655440004', '4th Year');

INSERT INTO public.semesters (id, year_id, name) VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Semester 1'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Semester 2'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Semester 3'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Semester 4');

INSERT INTO public.sections (id, semester_id, name) VALUES 
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Section A'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Section B'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'Section A'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Section B');

INSERT INTO public.subjects (id, section_id, name) VALUES 
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Mathematics'),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Physics'),
  ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'Chemistry'),
  ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'English Literature'),
  ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 'Computer Science');

INSERT INTO public.faculty (id, name, email, department, position) VALUES 
  ('990e8400-e29b-41d4-a716-446655440001', 'Dr. John Smith', 'john.smith@university.edu', 'Mathematics', 'Professor'),
  ('990e8400-e29b-41d4-a716-446655440002', 'Dr. Sarah Johnson', 'sarah.johnson@university.edu', 'Physics', 'Associate Professor'),
  ('990e8400-e29b-41d4-a716-446655440003', 'Dr. Michael Brown', 'michael.brown@university.edu', 'Chemistry', 'Assistant Professor'),
  ('990e8400-e29b-41d4-a716-446655440004', 'Dr. Emily Davis', 'emily.davis@university.edu', 'English', 'Professor'),
  ('990e8400-e29b-41d4-a716-446655440005', 'Dr. Robert Wilson', 'robert.wilson@university.edu', 'Computer Science', 'Associate Professor');

INSERT INTO public.faculty_assignments (id, faculty_id, subject_id, section_id) VALUES 
  ('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001'),
  ('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001'),
  ('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001'),
  ('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002'),
  ('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002');
