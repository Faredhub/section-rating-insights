
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";

// The credential categories/fields to display (from your image)
const CREDENTIALS = [
  { key: "engagement", label: "Student Engagement & Building Challenge" },
  { key: "concept_understanding", label: "Concept - Understanding & Elaboration" },
  { key: "content_spread_depth", label: "Content - Spread and Depth of Content" },
  { key: "application_oriented_teaching", label: "Application Oriented Teaching" },
  { key: "pedagogy_techniques_tools", label: "Pedagogy - Techniques & Tools" },
  { key: "communication_skills", label: "Communication Skills and Confidence" },
  { key: "class_decorum", label: "Class Decorum" },
  { key: "teaching_aids", label: "Use of Teaching Aids" }
];

const StudentRate = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const faculty_assignment_id = params.get("faculty_assignment_id");
  const subject_name = params.get("subject_name");
  const faculty_name = params.get("faculty_name");

  const [values, setValues] = useState<{[k: string]: number}>(
    Object.fromEntries(CREDENTIALS.map(c => [c.key, 3]))
  );
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Early guard
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!faculty_assignment_id) {
      navigate("/student-dashboard");
    }
  }, [user, loading, faculty_assignment_id, navigate]);

  // This will fetch the subject_id, section_id for assignment
  const [ids, setIds] = useState<{ subject_id: string; section_id: string } | null>(null);

  useEffect(() => {
    if (faculty_assignment_id) {
      supabase
        .from("faculty_assignments")
        .select("subject_id, section_id")
        .eq("id", faculty_assignment_id)
        .single()
        .then(({ data }) => {
          if (data) setIds({ subject_id: data.subject_id, section_id: data.section_id });
          else setIds(null);
        });
    }
  }, [faculty_assignment_id]);

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
      feedback
    };

    const { error } = await supabase.from("faculty_credentials_ratings").upsert([payload], {
      onConflict: "faculty_assignment_id,student_id"
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate("/student-dashboard?success=1");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2">
      <Card className="w-full max-w-xl p-6">
        <div className="font-bold text-xl mb-2">
          {faculty_name ? <>Rate {faculty_name}</> : "Faculty Feedback"}
        </div>
        <div className="mb-4 text-sm text-muted-foreground">
          {subject_name ? `Subject: ${subject_name}` : ""}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {CREDENTIALS.map((cr) => (
            <div key={cr.key} className="flex items-center gap-4">
              <label className="flex-1">{cr.label}</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={values[cr.key]}
                onChange={(e) => handleChange(cr.key, Math.max(1, Math.min(5, Number(e.target.value))))}
                className="w-20"
                required
              />
              {/* Replace with star rating UI later if needed */}
            </div>
          ))}
          <div>
            <label className="font-semibold">Additional feedback/comments</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Type here..."
            />
          </div>
          {errorMsg && (
            <div className="text-destructive text-sm">{errorMsg}</div>
          )}
          <Button type="submit" className="w-full" disabled={submitting || !ids}>
            {submitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default StudentRate;
