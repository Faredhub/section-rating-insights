
import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader, LogOut, User, ArrowLeft, ArrowRight, BookOpen, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface MyRating {
  id: string;
  engagement: number;
  concept_understanding: number;
  content_spread_depth: number;
  application_oriented_teaching: number;
  pedagogy_techniques_tools: number;
  communication_skills: number;
  class_decorum: number;
  teaching_aids: number;
  feedback: string;
  created_at: string;
  faculty_assignments: {
    faculty: { name: string };
    subjects: { name: string };
  };
}

const StudentDashboard = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<FacultyAssignment[]>([]);
  const [myRatings, setMyRatings] = useState<MyRating[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);

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
        console.log("Fetching profile for user:", user.id);
        try {
          const { data, error } = await supabase
            .from("student_profiles")
            .select(`
              *,
              years(name),
              semesters(name),
              sections(name)
            `)
            .eq("user_id", user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            toast({
              title: "Profile Error",
              description: "Could not load your student profile. Please contact administration.",
              variant: "destructive"
            });
          } else if (data) {
            console.log("Profile data:", data);
            setStudentProfile(data);
            fetchSubjectsAndFaculty(data.section_id);
            fetchMyRatings(data.id);
          }
        } catch (error) {
          console.error("Profile fetch error:", error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive"
          });
        }
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const fetchSubjectsAndFaculty = async (sectionId: string) => {
    setLoadingFaculty(true);
    console.log("Fetching faculty for section:", sectionId);

    try {
      // Fetch subjects for this section
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("section_id", sectionId);

      if (subjectsError) {
        console.error("Subjects error:", subjectsError);
      } else {
        console.log("Subjects data:", subjectsData);
        setSubjects(subjectsData || []);
      }

      // Fetch faculty assignments for this section
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty_assignments")
        .select(`
          id,
          faculty(id, name, email, department, position),
          subjects(name)
        `)
        .eq("section_id", sectionId);

      if (facultyError) {
        console.error("Faculty error:", facultyError);
        toast({
          title: "Faculty Error",
          description: "Could not load faculty assignments.",
          variant: "destructive"
        });
      } else {
        console.log("Faculty data:", facultyData);
        setFacultyAssignments(facultyData || []);
      }
    } catch (error) {
      console.error("Faculty/Subjects fetch error:", error);
    }
    setLoadingFaculty(false);
  };

  const fetchMyRatings = async (studentId: string) => {
    setLoadingRatings(true);
    console.log("Fetching ratings for student:", studentId);

    try {
      const { data: ratingsData, error } = await supabase
        .from("faculty_credentials_ratings")
        .select(`
          *,
          faculty_assignments!inner(
            faculty(name),
            subjects(name)
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ratings error:", error);
      } else {
        console.log("Ratings data:", ratingsData);
        setMyRatings(ratingsData || []);
      }
    } catch (error) {
      console.error("Ratings fetch error:", error);
    }
    setLoadingRatings(false);
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

  // Calculate average rating for a rating entry
  const calculateAverageRating = (rating: MyRating) => {
    const scores = [
      rating.engagement,
      rating.concept_understanding,
      rating.content_spread_depth,
      rating.application_oriented_teaching,
      rating.pedagogy_techniques_tools,
      rating.communication_skills,
      rating.class_decorum,
      rating.teaching_aids
    ];
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facultyAssignments.length}</div>
              <p className="text-xs text-muted-foreground">Assigned to your section</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">In your curriculum</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ratings Given</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myRatings.length}</div>
              <p className="text-xs text-muted-foreground">Faculty evaluations submitted</p>
            </CardContent>
          </Card>
        </div>

        {/* Faculty and Subjects */}
        <Card className="mb-8">
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

        {/* My Ratings History */}
        <Card>
          <CardHeader>
            <CardTitle>My Rating History</CardTitle>
            <p className="text-sm text-muted-foreground">
              View all the ratings you have submitted
            </p>
          </CardHeader>
          <CardContent>
            {loadingRatings ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin mr-2" />
                <span>Loading your ratings...</span>
              </div>
            ) : myRatings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't submitted any ratings yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRatings.map((rating) => (
                  <Card key={rating.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{rating.faculty_assignments.faculty.name}</h4>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-blue-600">{rating.faculty_assignments.subjects.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                            <div>Engagement: <span className="font-medium">{rating.engagement}/5</span></div>
                            <div>Understanding: <span className="font-medium">{rating.concept_understanding}/5</span></div>
                            <div>Content Depth: <span className="font-medium">{rating.content_spread_depth}/5</span></div>
                            <div>Communication: <span className="font-medium">{rating.communication_skills}/5</span></div>
                          </div>

                          {rating.feedback && (
                            <div className="bg-gray-50 p-3 rounded-md mb-2">
                              <p className="text-sm text-gray-700">"{rating.feedback}"</p>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Submitted on {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {calculateAverageRating(rating).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
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
