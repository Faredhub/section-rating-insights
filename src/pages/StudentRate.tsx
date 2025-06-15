
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const ratingFormSchema = z.object({
  facultyAssignmentId: z.string().min(1, "Please select a faculty"),
  engagement: z.number().min(1).max(5),
  conceptUnderstanding: z.number().min(1).max(5),
  contentSpreadDepth: z.number().min(1).max(5),
  applicationOrientedTeaching: z.number().min(1).max(5),
  pedagogyTechniquesTools: z.number().min(1).max(5),
  communicationSkills: z.number().min(1).max(5),
  classDecorum: z.number().min(1).max(5),
  teachingAids: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

interface FacultyAssignment {
  id: string;
  faculty: {
    id: string;
    name: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [facultyAssignments, setFacultyAssignments] = useState<FacultyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  const form = useForm<z.infer<typeof ratingFormSchema>>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      facultyAssignmentId: "",
      engagement: 3,
      conceptUnderstanding: 3,
      contentSpreadDepth: 3,
      applicationOrientedTeaching: 3,
      pedagogyTechniquesTools: 3,
      communicationSkills: 3,
      classDecorum: 3,
      teachingAids: 3,
      feedback: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching student profile and faculty assignments...");
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "Please log in to rate faculty",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        console.log("Current user:", user.id);

        // Get student profile
        const { data: profile, error: profileError } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching student profile:", profileError);
          toast({
            title: "Error",
            description: "Student profile not found. Please complete your registration.",
            variant: "destructive",
          });
          navigate("/student-dashboard");
          return;
        }

        console.log("Student profile:", profile);
        setStudentProfile(profile);

        // Get faculty assignments for the student's section
        const { data: assignments, error: assignmentsError } = await supabase
          .from("faculty_assignments")
          .select(`
            id,
            faculty!inner (
              id,
              name,
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
          .eq("section_id", profile.section_id);

        if (assignmentsError) {
          console.error("Error fetching faculty assignments:", assignmentsError);
          throw assignmentsError;
        }

        console.log("Faculty assignments:", assignments);
        setFacultyAssignments(assignments || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load faculty data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const onSubmit = async (values: z.infer<typeof ratingFormSchema>) => {
    if (!studentProfile) {
      toast({
        title: "Error",
        description: "Student profile not found",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log("Submitting rating:", values);

      const selectedAssignment = facultyAssignments.find(fa => fa.id === values.facultyAssignmentId);
      if (!selectedAssignment) {
        throw new Error("Selected faculty assignment not found");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Insert rating
      const { error } = await supabase
        .from("faculty_credentials_ratings")
        .insert({
          faculty_assignment_id: values.facultyAssignmentId,
          student_id: user.id,
          section_id: studentProfile.section_id,
          subject_id: selectedAssignment.subjects.id,
          engagement: values.engagement,
          concept_understanding: values.conceptUnderstanding,
          content_spread_depth: values.contentSpreadDepth,
          application_oriented_teaching: values.applicationOrientedTeaching,
          pedagogy_techniques_tools: values.pedagogyTechniquesTools,
          communication_skills: values.communicationSkills,
          class_decorum: values.classDecorum,
          teaching_aids: values.teachingAids,
          feedback: values.feedback || null,
        });

      if (error) {
        console.error("Error submitting rating:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Faculty rating submitted successfully!",
      });

      form.reset();
      navigate("/student-dashboard");
      
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const criteriaLabels = [
    { key: "engagement", label: "Engagement Level", description: "How well does the faculty engage students?" },
    { key: "conceptUnderstanding", label: "Concept Understanding", description: "Clarity in explaining concepts" },
    { key: "contentSpreadDepth", label: "Content Spread & Depth", description: "Coverage and depth of subject matter" },
    { key: "applicationOrientedTeaching", label: "Application-Oriented Teaching", description: "Real-world application focus" },
    { key: "pedagogyTechniquesTools", label: "Pedagogy Techniques & Tools", description: "Teaching methods and tools used" },
    { key: "communicationSkills", label: "Communication Skills", description: "Clarity and effectiveness of communication" },
    { key: "classDecorum", label: "Class Decorum", description: "Classroom management and environment" },
    { key: "teachingAids", label: "Teaching Aids", description: "Use of visual aids and technology" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading faculty information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/student-dashboard")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Rate Faculty Performance</h1>
            <p className="text-muted-foreground">Provide feedback to help improve teaching quality</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Faculty Rating Form
            </CardTitle>
            <CardDescription>
              Rate your faculty based on various teaching criteria. Your feedback is valuable and confidential.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="facultyAssignmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Faculty & Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose faculty and subject to rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facultyAssignments.length === 0 ? (
                            <SelectItem value="no-faculty" disabled>
                              No faculty assignments found for your section
                            </SelectItem>
                          ) : (
                            facultyAssignments.map((assignment) => (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                {assignment.faculty.name} - {assignment.subjects.name}
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({assignment.faculty.department})
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {criteriaLabels.map((criteria) => (
                    <FormField
                      key={criteria.key}
                      control={form.control}
                      name={criteria.key as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {criteria.label}
                          </FormLabel>
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              {criteria.description}
                            </p>
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-muted-foreground">Poor</span>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                              <span className="text-xs text-muted-foreground">Excellent</span>
                            </div>
                            <div className="flex justify-center">
                              <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                                {field.value}/5
                              </span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Feedback (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share any specific comments or suggestions for improvement..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/student-dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || facultyAssignments.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Submitting..." : "Submit Rating"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentRate;
