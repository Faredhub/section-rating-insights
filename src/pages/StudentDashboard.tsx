
import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "lucide-react";

interface Year {
  id: string;
  name: string;
}
interface Semester {
  id: string;
  name: string;
  year_id: string;
}
interface Section {
  id: string;
  name: string;
  semester_id: string;
}
interface Subject {
  id: string;
  name: string;
  section_id: string;
}
interface FacultyPerson {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
}
interface FacultyAssignment {
  id: string;
  faculty_id: string;
  subject_id: string;
  section_id: string;
  faculty: FacultyPerson;
}

const StudentDashboard = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  const [year, setYear] = useState<Year | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<FacultyAssignment[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  // Guard: login required
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch Years
  useEffect(() => {
    supabase
      .from("years")
      .select("*")
      .then(({ data }) => setYears(data ?? []));
  }, []);

  // Fetch Semesters when year selected
  useEffect(() => {
    if (year) {
      supabase
        .from("semesters")
        .select("*")
        .eq("year_id", year.id)
        .then(({ data }) => setSemesters(data ?? []));
      setSemester(null);
      setSection(null);
      setSubject(null);
      setSections([]);
      setSubjects([]);
      setFacultyAssignments([]);
    }
  }, [year]);

  // Fetch Sections when semester selected
  useEffect(() => {
    if (semester) {
      supabase
        .from("sections")
        .select("*")
        .eq("semester_id", semester.id)
        .then(({ data }) => setSections(data ?? []));
      setSection(null);
      setSubject(null);
      setSubjects([]);
      setFacultyAssignments([]);
    }
  }, [semester]);

  // Fetch Subjects when section selected
  useEffect(() => {
    if (section) {
      supabase
        .from("subjects")
        .select("*")
        .eq("section_id", section.id)
        .then(({ data }) => setSubjects(data ?? []));
      setSubject(null);
      setFacultyAssignments([]);
    }
  }, [section]);

  // Fetch Faculty Assignments when subject selected
  useEffect(() => {
    const fetchFacultyAssignments = async () => {
      if (subject && section) {
        setFacultyLoading(true);
        // Query for all faculty assigned to this subject and section
        const { data: assignments, error } = await supabase
          .from("faculty_assignments")
          .select(
            "id, faculty_id, subject_id, section_id, faculty(id, name, email, department, position)"
          )
          .eq("subject_id", subject.id)
          .eq("section_id", section.id);

        setFacultyAssignments(assignments ?? []);
        setFacultyLoading(false);
      }
    };
    fetchFacultyAssignments();
  }, [subject, section]);

  // Handlers for selection
  const handleSelectYear = (id: string) => {
    const y = years.find((yy) => yy.id === id) ?? null;
    setYear(y);
  };
  const handleSelectSemester = (id: string) => {
    const sem = semesters.find((ss) => ss.id === id) ?? null;
    setSemester(sem);
  };
  const handleSelectSection = (id: string) => {
    const sec = sections.find((s) => s.id === id) ?? null;
    setSection(sec);
  };
  const handleSelectSubject = (id: string) => {
    const subj = subjects.find((s) => s.id === id) ?? null;
    setSubject(subj);
  };

  // Guard: loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Sequential Selection UI
  return (
    <div className="min-h-screen bg-background px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-8">
        {/* Step 1: Year */}
        <Card className="p-4">
          <div className="font-semibold mb-2">Select Year</div>
          <div className="flex gap-2 flex-wrap">
            {years.map((y) => (
              <Button key={y.id} onClick={() => handleSelectYear(y.id)} variant={year?.id === y.id ? "default" : "outline"}>
                {y.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Step 2: Semester */}
        {year && (
          <Card className="p-4">
            <div className="font-semibold mb-2">Select Semester</div>
            <div className="flex gap-2 flex-wrap">
              {semesters.length === 0 && <span className="text-xs text-muted-foreground">No semesters found for this year.</span>}
              {semesters.map((s) => (
                <Button key={s.id} onClick={() => handleSelectSemester(s.id)} variant={semester?.id === s.id ? "default" : "outline"}>
                  {s.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 3: Section */}
        {semester && (
          <Card className="p-4">
            <div className="font-semibold mb-2">Select Section</div>
            <div className="flex gap-2 flex-wrap">
              {sections.length === 0 && <span className="text-xs text-muted-foreground">No sections found for this semester.</span>}
              {sections.map((sec) => (
                <Button key={sec.id} onClick={() => handleSelectSection(sec.id)} variant={section?.id === sec.id ? "default" : "outline"}>
                  {sec.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 4: Subject */}
        {section && (
          <Card className="p-4">
            <div className="font-semibold mb-2">Select Subject</div>
            <div className="flex gap-2 flex-wrap">
              {subjects.length === 0 && <span className="text-xs text-muted-foreground">No subjects found for this section.</span>}
              {subjects.map((sub) => (
                <Button key={sub.id} onClick={() => handleSelectSubject(sub.id)} variant={subject?.id === sub.id ? "default" : "outline"}>
                  {sub.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 5: Faculty */}
        {subject && (
          <Card className="p-4">
            <div className="font-semibold mb-2">Faculty for this Subject/Section</div>
            {facultyLoading ? (
              <div className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Loading faculty...</div>
            ) : (
              <>
                {facultyAssignments.length === 0 && (
                  <span className="text-xs text-muted-foreground">No faculty assigned to this subject/section.</span>
                )}
                <div className="flex flex-col gap-3">
                  {facultyAssignments.map((fa) => (
                    <Card key={fa.id} className="p-3 flex flex-col gap-1">
                      <div className="font-medium">{fa.faculty.name}</div>
                      <div className="text-xs text-muted-foreground">{fa.faculty.email}</div>
                      <Button
                        variant="secondary"
                        className="mt-2 w-max"
                        onClick={() =>
                          navigate(
                            `/student-dashboard/rate?faculty_assignment_id=${fa.id}&subject_name=${encodeURIComponent(subject.name)}&faculty_name=${encodeURIComponent(fa.faculty.name)}`
                          )
                        }
                      >
                        Rate {fa.faculty.name}
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
