
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const StudentRate = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const faculty_assignment_id = params.get("faculty_assignment_id");
  const subject_name = params.get("subject_name");
  const faculty_name = params.get("faculty_name");

  const [values, setValues] = useState<{[k: string]: number}>(
    Object.fromEntries(CREDENTIALS.map(c => [c.key, 3]))
  );
  const [feedback, setFeedback] = useState("");
  const [hodRemarks, setHodRemarks] = useState("");
  const [hosRemarks, setHosRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Faculty info state
  const [facultyInfo, setFacultyInfo] = useState<any>(null);

  // Early guard
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!faculty_assignment_id) {
      navigate("/student-dashboard");
    }
  }, [user, loading, faculty_assignment_id, navigate]);

  // This will fetch the subject_id, section_id for assignment and faculty info
  const [ids, setIds] = useState<{ subject_id: string; section_id: string } | null>(null);

  useEffect(() => {
    if (faculty_assignment_id) {
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
          } else {
            setIds(null);
          }
        });
    }
  }, [faculty_assignment_id]);

  // Star rating component
  const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
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
    if (!user || !faculty_assignment_id || !ids) return;

    setSubmitting(true);
    setErrorMsg(null);

    // Insert or update faculty_credentials_ratings (one per student per assignment)
    const payload: any = {
      faculty_assignment_id,
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
    } else {
      toast({ title: "Rating submitted successfully!" });
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

        {/* Faculty Information Card */}
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
              <div><span className="font-medium">Subject:</span> {subject_name}</div>
              <div><span className="font-medium">Date of Inspection:</span> {new Date().toLocaleDateString()}</div>
              <div><span className="font-medium">Session:</span> Current Session</div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Form */}
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
                    Feedback and Suggestions of the official/authority conducting the inspection:
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide your detailed feedback about the faculty's teaching performance..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">HOD Remarks:</label>
                  <Textarea
                    value={hodRemarks}
                    onChange={(e) => setHodRemarks(e.target.value)}
                    placeholder="HOD can add remarks here (optional)"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">HOS Remarks:</label>
                  <Textarea
                    value={hosRemarks}
                    onChange={(e) => setHosRemarks(e.target.value)}
                    placeholder="HOS can add remarks here (optional)"
                    className="min-h-[80px]"
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
      </div>
    </div>
  );
};

export default StudentRate;
