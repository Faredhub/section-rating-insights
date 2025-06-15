
import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader, LogOut, User, ArrowLeft, ArrowRight } from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  registration_number: string;
  year_id: string;
  semester_id: string;
  section_id: string;
  years: { name: string };
  semesters: { name: string };
  sections: { name: string };
}

interface Subject {
  id: string;
  name: string;
}

interface FacultyAssignment {
  id: string;
  faculty: {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
  };
  subjects: {
    name: string;
  };
}

const StudentDashboard = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<FacultyAssignment[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Guard: login required
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch student profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("student_profiles")
          .select(`
            *,
            years(name),
            semesters(name),
            sections(name)
          `)
          .eq("user_id", user.id)
          .single();

        if (data) {
          setStudentProfile(data);
          fetchSubjectsAndFaculty(data.section_id);
        }
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const fetchSubjectsAndFaculty = async (sectionId: string) => {
    setLoadingFaculty(true);

    // Fetch subjects for this section
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("section_id", sectionId);

    setSubjects(subjectsData || []);

    // Fetch faculty assignments for this section
    const { data: facultyData } = await supabase
      .from("faculty_assignments")
      .select(`
        id,
        faculty(id, name, email, department, position),
        subjects(name)
      `)
      .eq("section_id", sectionId);

    setFacultyAssignments(facultyData || []);
    setLoadingFaculty(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleRateFaculty = (facultyAssignment: FacultyAssignment) => {
    navigate(
      `/student-dashboard/rate?faculty_assignment_id=${facultyAssignment.id}&subject_name=${encodeURIComponent(facultyAssignment.subjects.name)}&faculty_name=${encodeURIComponent(facultyAssignment.faculty.name)}`
    );
  };

  const handleNavigateBack = () => {
    navigate(-1);
  };

  const handleNavigateForward = () => {
    navigate(1);
  };

  // Guard: loading state
  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Student profile not found. Please contact administration.</p>
          <Button onClick={handleLogout} className="mt-4">
            Logout
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">Student Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Faculty Rating System</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleNavigateBack} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button 
                onClick={handleNavigateForward} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                Forward
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg font-semibold">{studentProfile.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                <p className="text-lg font-semibold">{studentProfile.registration_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Year</label>
                <p className="text-lg font-semibold">{studentProfile.years.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Semester & Section</label>
                <p className="text-lg font-semibold">{studentProfile.semesters.name} - {studentProfile.sections.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty and Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Your Faculty</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on a faculty member to provide your rating and feedback
            </p>
          </CardHeader>
          <CardContent>
            {loadingFaculty ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin mr-2" />
                <span>Loading faculty information...</span>
              </div>
            ) : facultyAssignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No faculty assignments found for your section.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facultyAssignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{assignment.faculty.name}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.faculty.position}</p>
                          <p className="text-sm text-muted-foreground">{assignment.faculty.department}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Subject:</p>
                          <p className="text-sm text-blue-600">{assignment.subjects.name}</p>
                        </div>

                        <Button 
                          onClick={() => handleRateFaculty(assignment)}
                          className="w-full"
                          size="sm"
                        >
                          Rate Faculty
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
