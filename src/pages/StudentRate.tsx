
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// The credential categories exactly from your uploaded image
const CREDENTIALS = [
  { key: "engagement", label: "Student Engagement & Building Challenge" },
  { key: "concept_understanding", label: "Content - Concept Understanding & Elaboration" },
  { key: "content_spread_depth", label: "Content - Spread and Depth of Content" },
  { key: "application_oriented_teaching", label: "Content - Example based application oriented teaching" },
  { key: "pedagogy_techniques_tools", label: "Pedagogy - Use of techniques and tools" },
  { key: "communication_skills", label: "Communication Skills and Confidence" },
  { key: "class_decorum", label: "Class Decorum" },
  { key: "teaching_aids", label: "Use of Teaching Aids" }
];

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
    id: string;
    name: string;
  };
  sections: {
    id: string;
    name: string;
  };
}

const StudentRate = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  // Check if we have URL parameters for direct rating
  const faculty_assignment_id = params.get("faculty_assignment_id");
  const subject_name = params.get("subject_name");
  const faculty_name = params.get("faculty_name");

  const [values, setValues] = useState<{[k: string]: number}>(
    Object.fromEntries(CREDENTIALS.map(c => [c.key, 3]))
  );
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Faculty selection state
  const [availableFaculty, setAvailableFaculty] = useState<FacultyAssignment[]>([]);
  const [selectedFacultyAssignment, setSelectedFacultyAssignment] = useState<string>("");
  const [loadingFaculty, setLoadingFaculty] = useState(true);

  // Faculty info state
  const [facultyInfo, setFacultyInfo] = useState<any>(null);
  const [ids, setIds] = useState<{ subject_id: string; section_id: string } | null>(null);

  // Early guard
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch available faculty assignments for the student
  useEffect(() => {
    const fetchAvailableFaculty = async () => {
      if (!user) return;

      try {
        console.log("Fetching available faculty for student:", user.id);
        
        // Get student profile first
        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("section_id")
          .eq("user_id", user.id)
          .single();

        if (!studentProfile) {
          setErrorMsg("Student profile not found. Please complete your registration.");
          setLoadingFaculty(false);
          return;
        }

        console.log("Student section_id:", studentProfile.section_id);

        // Get faculty assignments for student's section
        const { data: facultyAssignments, error } = await supabase
          .from("faculty_assignments")
          .select(`
            id,
            subject_id,
            section_id,
            faculty!inner (
              id,
              name,
              email,
              department,
              position
            ),
            subjects!inner (
              id,
              name
            ),
            sections!inner (
              id,
              name
            )
          `)
          .eq("section_id", studentProfile.section_id);

        if (error) {
          console.error("Error fetching faculty assignments:", error);
          setErrorMsg("Failed to load available faculty.");
        } else {
          console.log("Faculty assignments:", facultyAssignments);
          setAvailableFaculty(facultyAssignments || []);
        }
      } catch (error) {
        console.error("Error in fetchAvailableFaculty:", error);
        setErrorMsg("An unexpected error occurred.");
      } finally {
        setLoadingFaculty(false);
      }
    };

    fetchAvailableFaculty();
  }, [user]);

  // Handle direct faculty assignment from URL params
  useEffect(() => {
    if (faculty_assignment_id) {
      setSelectedFacultyAssignment(faculty_assignment_id);
      
      supabase
        .from("faculty_assignments")
        .select(`
          subject_id, 
          section_id,
          faculty(id, name, email, department, position)
        `)
        .eq("id", faculty_assignment_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setIds({ subject_id: data.subject_id, section_id: data.section_id });
            setFacultyInfo(data.faculty);
          }
        });
    }
  }, [faculty_assignment_id]);

  // Handle faculty selection change
  useEffect(() => {
    if (selectedFacultyAssignment && availableFaculty.length > 0) {
      const selectedAssignment = availableFaculty.find(fa => fa.id === selectedFacultyAssignment);
      if (selectedAssignment) {
        setIds({ 
          subject_id: selectedAssignment.subjects.id, 
          section_id: selectedAssignment.sections.id 
        });
        setFacultyInfo(selectedAssignment.faculty);
      }
    }
  }, [selectedFacultyAssignment, availableFaculty]);

  // Check if the student has already rated this faculty
  useEffect(() => {
    const checkExistingRating = async () => {
      if (user && selectedFacultyAssignment) {
        const { data } = await supabase
          .from("faculty_credentials_ratings")
          .select("*")
          .eq("faculty_assignment_id", selectedFacultyAssignment)
          .eq("student_id", user.id)
          .single();

        if (data) {
          // Pre-fill the form with existing ratings
          setValues({
            engagement: data.engagement,
            concept_understanding: data.concept_understanding,
            content_spread_depth: data.content_spread_depth,
            application_oriented_teaching: data.application_oriented_teaching,
            pedagogy_techniques_tools: data.pedagogy_techniques_tools,
            communication_skills: data.communication_skills,
            class_decorum: data.class_decorum,
            teaching_aids: data.teaching_aids
          });
          setFeedback(data.feedback || "");
        }
      }
    };

    checkExistingRating();
  }, [user, selectedFacultyAssignment]);

  // Star rating component
  const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"
            }`}
            onClick={() => onChange(star)}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">({value}/5)</span>
      </div>
    );
  };

  // Rating form handlers
  const handleChange = (key: string, v: number) => {
    setValues(prev => ({ ...prev, [key]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFacultyAssignment || !ids) return;

    setSubmitting(true);
    setErrorMsg(null);

    // Insert or update faculty_credentials_ratings
    const payload: any = {
      faculty_assignment_id: selectedFacultyAssignment,
      student_id: user.id,
      subject_id: ids.subject_id,
      section_id: ids.section_id,
      ...values,
      feedback: feedback || null
    };

    const { error } = await supabase.from("faculty_credentials_ratings").upsert([payload], {
      onConflict: "faculty_assignment_id,student_id"
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ 
        title: "Rating submitted successfully!",
        description: "Your feedback has been saved."
      });
      navigate("/student-dashboard");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/student-dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Faculty Selection Card - Only show if no direct assignment */}
        {!faculty_assignment_id && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Faculty to Rate</CardTitle>
              <CardDescription>Choose a faculty member to provide your rating and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFaculty ? (
                <div className="text-center py-4">Loading available faculty...</div>
              ) : availableFaculty.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No faculty assignments found for your section.</p>
                  <p className="text-sm text-muted-foreground mt-2">Please contact your administrator.</p>
                </div>
              ) : (
                <Select value={selectedFacultyAssignment} onValueChange={setSelectedFacultyAssignment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a faculty member to rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFaculty.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.faculty.name} - {assignment.subjects.name} ({assignment.faculty.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {/* Faculty Information Card */}
        {(facultyInfo || faculty_name) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Faculty Rating</CardTitle>
              <CardDescription>Rate your faculty member based on teaching performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Employee Name:</span> {faculty_name || facultyInfo?.name}</div>
                <div><span className="font-medium">Designation:</span> {facultyInfo?.position}</div>
                <div><span className="font-medium">Department:</span> {facultyInfo?.department}</div>
                <div><span className="font-medium">Subject:</span> {subject_name || availableFaculty.find(f => f.id === selectedFacultyAssignment)?.subjects.name}</div>
                <div><span className="font-medium">Date of Inspection:</span> {new Date().toLocaleDateString()}</div>
                <div><span className="font-medium">Session:</span> Current Session</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Form */}
        {(selectedFacultyAssignment || faculty_assignment_id) && (
          <Card>
            <CardHeader>
              <CardTitle>Teaching Performance Evaluation</CardTitle>
              <CardDescription>Rate each aspect on a scale of 1-5 stars</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Credentials Rating Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium">S.No</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium">Description</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">Rating (out of 5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CREDENTIALS.map((credential, index) => (
                        <tr key={credential.key} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3 text-center font-medium">
                            {index + 1}
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            {credential.label}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <StarRating
                                value={values[credential.key]}
                                onChange={(rating) => handleChange(credential.key, rating)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Feedback Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Feedback and Suggestions:
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide your detailed feedback about the faculty's teaching performance..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-destructive text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={submitting || !ids}>
                    {submitting ? "Submitting Rating..." : "Submit Rating"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/student-dashboard")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentRate;
