
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Star, BookOpen, TrendingUp, LogOut, Eye, Award, Target, BarChart3, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from "recharts";
import FacultyPerformanceDetail from "@/components/FacultyPerformanceDetail";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const facultyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  semesterId: z.string().min(1, "Semester is required"),
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

interface FacultyRating {
  faculty_id: string;
  faculty_name: string;
  department: string;
  position: string;
  total_ratings: number;
  avg_engagement: number;
  avg_concept_understanding: number;
  avg_content_spread_depth: number;
  avg_application_oriented_teaching: number;
  avg_pedagogy_techniques_tools: number;
  avg_communication_skills: number;
  avg_class_decorum: number;
  avg_teaching_aids: number;
  overall_average: number;
  subjects_taught?: string[];
  feedbacks?: string[];
  consistency_score?: number;
  improvement_trend?: number;
  student_satisfaction?: string;
}

interface PerformanceTrend {
  month: string;
  totalRatings: number;
  avgRating: number;
  avgEngagement?: number;
  avgSatisfaction?: number;
}

interface DepartmentInsight {
  department: string;
  facultyCount: number;
  totalRatings: number;
  avgRating: number;
  topPerformer: string;
  improvementNeeded: number;
  excellentPerformers?: number;
  participationRate?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [facultyRatings, setFacultyRatings] = useState<FacultyRating[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [departmentInsights, setDepartmentInsights] = useState<DepartmentInsight[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const form = useForm<z.infer<typeof facultyFormSchema>>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      position: "",
      semesterId: "",
      sectionId: "",
      subjectId: "",
    },
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      console.log("Starting to fetch analytics data...");
      setLoadingData(true);
      
      try {
        console.log("Fetching faculty ratings...");
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("faculty_credentials_ratings")
          .select(`
            faculty_assignment_id,
            engagement,
            concept_understanding,
            content_spread_depth,
            application_oriented_teaching,
            pedagogy_techniques_tools,
            communication_skills,
            class_decorum,
            teaching_aids,
            created_at,
            feedback,
            faculty_assignments!inner (
              faculty!inner (id, name, department, position),
              subjects!inner (name)
            )
          `);

        if (ratingsError) {
          console.error("Error fetching ratings:", ratingsError);
          throw ratingsError;
        }

        console.log("Ratings data:", ratingsData);

        const facultyMap = new Map<string, {
          faculty_id: string;
          faculty_name: string;
          department: string;
          position: string;
          subjects: Set<string>;
          ratings: number[];
          criteria: { [key: string]: number[] };
          feedbacks: string[];
          monthlyRatings: { [month: string]: number[] };
        }>();

        ratingsData?.forEach((rating) => {
          const faculty = rating.faculty_assignments.faculty;
          const subject = rating.faculty_assignments.subjects.name;
          const facultyId = faculty.id;
          const month = new Date(rating.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          
          if (!facultyMap.has(facultyId)) {
            facultyMap.set(facultyId, {
              faculty_id: facultyId,
              faculty_name: faculty.name,
              department: faculty.department,
              position: faculty.position,
              subjects: new Set(),
              ratings: [],
              criteria: {
                engagement: [],
                concept_understanding: [],
                content_spread_depth: [],
                application_oriented_teaching: [],
                pedagogy_techniques_tools: [],
                communication_skills: [],
                class_decorum: [],
                teaching_aids: []
              },
              feedbacks: [],
              monthlyRatings: {}
            });
          }

          const facultyData = facultyMap.get(facultyId)!;
          facultyData.subjects.add(subject);
          
          // Calculate overall rating for this submission
          const overallRating = (
            rating.engagement + rating.concept_understanding + rating.content_spread_depth +
            rating.application_oriented_teaching + rating.pedagogy_techniques_tools +
            rating.communication_skills + rating.class_decorum + rating.teaching_aids
          ) / 8;
          
          facultyData.ratings.push(overallRating);
          
          // Store criteria ratings
          facultyData.criteria.engagement.push(rating.engagement);
          facultyData.criteria.concept_understanding.push(rating.concept_understanding);
          facultyData.criteria.content_spread_depth.push(rating.content_spread_depth);
          facultyData.criteria.application_oriented_teaching.push(rating.application_oriented_teaching);
          facultyData.criteria.pedagogy_techniques_tools.push(rating.pedagogy_techniques_tools);
          facultyData.criteria.communication_skills.push(rating.communication_skills);
          facultyData.criteria.class_decorum.push(rating.class_decorum);
          facultyData.criteria.teaching_aids.push(rating.teaching_aids);
          
          // Store feedback
          if (rating.feedback) {
            facultyData.feedbacks.push(rating.feedback);
          }
          
          // Store monthly ratings for trend analysis
          if (!facultyData.monthlyRatings[month]) {
            facultyData.monthlyRatings[month] = [];
          }
          facultyData.monthlyRatings[month].push(overallRating);
        });

        const processedFacultyRatings: FacultyRating[] = Array.from(facultyMap.values()).map(faculty => {
          const criteriaAverages = Object.entries(faculty.criteria).reduce((acc, [key, values]) => {
            acc[`avg_${key}`] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            return acc;
          }, {} as { [key: string]: number });

          const overallAverage = faculty.ratings.length > 0 
            ? faculty.ratings.reduce((sum, val) => sum + val, 0) / faculty.ratings.length 
            : 0;

          return {
            faculty_id: faculty.faculty_id,
            faculty_name: faculty.faculty_name,
            department: faculty.department,
            position: faculty.position,
            total_ratings: faculty.ratings.length,
            subjects_taught: Array.from(faculty.subjects),
            feedbacks: faculty.feedbacks,
            ...criteriaAverages,
            overall_average: overallAverage,
            consistency_score: faculty.ratings.length > 1 
              ? 5 - (faculty.ratings.reduce((acc, rating, i, arr) => 
                  i === 0 ? 0 : acc + Math.abs(rating - arr[i-1]), 0) / (faculty.ratings.length - 1))
              : 5,
            improvement_trend: faculty.ratings.length > 2
              ? (faculty.ratings.slice(-3).reduce((sum, r) => sum + r, 0) / 3) - 
                (faculty.ratings.slice(0, 3).reduce((sum, r) => sum + r, 0) / 3)
              : 0,
            student_satisfaction: overallAverage >= 4.5 ? 'Excellent' : 
                               overallAverage >= 4.0 ? 'Good' : 
                               overallAverage >= 3.5 ? 'Average' : 'Needs Improvement'
          } as FacultyRating;
        });

        console.log("Processed faculty ratings:", processedFacultyRatings);
        setFacultyRatings(processedFacultyRatings);

        // Generate performance trends from current year (2025)
        const trendMap = new Map<string, { total: number; count: number; sum: number; engagement: number; satisfaction: number }>();
        ratingsData?.forEach((rating) => {
          const month = new Date(rating.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          
          const avgRating = (
            rating.engagement + rating.concept_understanding + rating.content_spread_depth +
            rating.application_oriented_teaching + rating.pedagogy_techniques_tools +
            rating.communication_skills + rating.class_decorum + rating.teaching_aids
          ) / 8;

          if (!trendMap.has(month)) {
            trendMap.set(month, { total: 0, count: 0, sum: 0, engagement: 0, satisfaction: 0 });
          }
          
          const trend = trendMap.get(month)!;
          trend.total += 1;
          trend.count += 1;
          trend.sum += avgRating;
          trend.engagement += rating.engagement;
          trend.satisfaction += (rating.communication_skills + rating.class_decorum) / 2;
        });

        const trends: PerformanceTrend[] = Array.from(trendMap.entries())
          .map(([month, data]) => ({
            month,
            totalRatings: data.total,
            avgRating: data.sum / data.count,
            avgEngagement: data.engagement / data.count,
            avgSatisfaction: data.satisfaction / data.count
          }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        setPerformanceTrends(trends);

        // Calculate department insights
        const deptMap = new Map<string, {
          facultyIds: Set<string>;
          totalRatings: number;
          totalScore: number;
          facultyScores: { [key: string]: { name: string; score: number; ratings: number; subjects: string[] } };
        }>();

        processedFacultyRatings.forEach((faculty) => {
          if (!deptMap.has(faculty.department)) {
            deptMap.set(faculty.department, {
              facultyIds: new Set(),
              totalRatings: 0,
              totalScore: 0,
              facultyScores: {}
            });
          }
          
          const dept = deptMap.get(faculty.department)!;
          dept.facultyIds.add(faculty.faculty_id);
          dept.totalRatings += faculty.total_ratings;
          dept.totalScore += faculty.overall_average * faculty.total_ratings;
          dept.facultyScores[faculty.faculty_id] = {
            name: faculty.faculty_name,
            score: faculty.overall_average,
            ratings: faculty.total_ratings,
            subjects: faculty.subjects_taught || []
          };
        });

        const insights: DepartmentInsight[] = Array.from(deptMap.entries()).map(([department, data]) => {
          const avgRating = data.totalRatings > 0 ? data.totalScore / data.totalRatings : 0;
          const facultyScores = Object.values(data.facultyScores);
          const topPerformer = facultyScores.reduce((max, faculty) => 
            faculty.score > max.score ? faculty : max, facultyScores[0]);
          const improvementNeeded = facultyScores.filter(f => f.score < 3.5).length;
          const excellentPerformers = facultyScores.filter(f => f.score >= 4.5).length;

          return {
            department,
            facultyCount: data.facultyIds.size,
            totalRatings: data.totalRatings,
            avgRating,
            topPerformer: topPerformer?.name || 'N/A',
            improvementNeeded,
            excellentPerformers,
            participationRate: Math.round((data.totalRatings / data.facultyIds.size) * 10)
          };
        });

        setDepartmentInsights(insights);

        console.log("Fetching basic stats...");
        const { count: facultyCount } = await supabase
          .from("faculty")
          .select("*", { count: "exact", head: true });

        const { count: ratingsCount } = await supabase
          .from("faculty_credentials_ratings")
          .select("*", { count: "exact", head: true });

        const { count: studentsCount } = await supabase
          .from("student_profiles")
          .select("*", { count: "exact", head: true });

        console.log("Faculty count:", facultyCount, "Ratings count:", ratingsCount, "Students count:", studentsCount);

        setTotalFaculty(facultyCount || 0);
        setTotalRatings(ratingsCount || 0);
        setTotalStudents(studentsCount || 0);

      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch analytics data. Loading default view.",
          variant: "destructive"
        });
      } finally {
        console.log("Finished loading data");
        setLoadingData(false);
      }
    };

    const fetchFormData = async () => {
      try {
        const { data: yearsData } = await supabase.from("years").select("*");
        const { data: semestersData } = await supabase.from("semesters").select("*");
        const { data: sectionsData } = await supabase.from("sections").select("*");
        const { data: subjectsData } = await supabase.from("subjects").select("*");

        setYears(yearsData || []);
        setSemesters(semestersData || []);
        setSections(sectionsData || []);
        setSubjects(subjectsData || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };

    fetchAnalytics();
    fetchFormData();
  }, [toast]);

  const handleAddFaculty = async (values: z.infer<typeof facultyFormSchema>) => {
    try {
      console.log("Adding faculty with values:", values);
      
      // First insert faculty with admin privileges
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .insert({
          name: values.name,
          email: values.email,
          department: values.department,
          position: values.position,
        })
        .select()
        .single();

      if (facultyError) {
        console.error("Faculty insert error:", facultyError);
        throw facultyError;
      }

      console.log("Faculty inserted:", facultyData);

      // Create faculty assignment
      const { error: assignmentError } = await supabase
        .from("faculty_assignments")
        .insert({
          faculty_id: facultyData.id,
          section_id: values.sectionId,
          subject_id: values.subjectId,
        });

      if (assignmentError) {
        console.error("Assignment error:", assignmentError);
        throw assignmentError;
      }

      toast({
        title: "Success",
        description: "Faculty added successfully!",
      });

      setIsAddFacultyOpen(false);
      form.reset();
      
      // Refresh the data
      window.location.reload();
    } catch (error: any) {
      console.error("Error adding faculty:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add faculty",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleViewFacultyDetail = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
  };

  const handleBackToOverview = () => {
    setSelectedFacultyId(null);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (selectedFacultyId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <FacultyPerformanceDetail 
            facultyId={selectedFacultyId} 
            onBack={handleBackToOverview}
          />
        </div>
      </div>
    );
  }

  // Sample data for charts when no real data is available
  const sampleFacultyData = facultyRatings.length > 0 ? facultyRatings.map(faculty => ({
    name: faculty.faculty_name.split(' ').slice(-1)[0],
    overall: Number(faculty.overall_average.toFixed(1)),
    engagement: Number(faculty.avg_engagement.toFixed(1)),
    communication: Number(faculty.avg_communication_skills.toFixed(1)),
    pedagogy: Number(faculty.avg_pedagogy_techniques_tools.toFixed(1)),
    consistency: Number((faculty.consistency_score || 0).toFixed(1)),
    ratings: faculty.total_ratings,
    department: faculty.department,
    satisfaction: faculty.student_satisfaction,
    subjects: (faculty.subjects_taught || []).length
  })) : [
    { name: "Dr. Smith", overall: 4.2, engagement: 4.5, communication: 4.0, pedagogy: 4.1, consistency: 4.3, ratings: 15, department: "Computer Science", satisfaction: "Good", subjects: 2 },
    { name: "Prof. Johnson", overall: 3.8, engagement: 3.9, communication: 3.7, pedagogy: 3.8, consistency: 3.9, ratings: 12, department: "Mathematics", satisfaction: "Average", subjects: 1 },
    { name: "Dr. Williams", overall: 4.5, engagement: 4.6, communication: 4.4, pedagogy: 4.5, consistency: 4.4, ratings: 20, department: "Physics", satisfaction: "Excellent", subjects: 3 },
    { name: "Prof. Brown", overall: 3.5, engagement: 3.6, communication: 3.4, pedagogy: 3.5, consistency: 3.7, ratings: 8, department: "Chemistry", satisfaction: "Needs Improvement", subjects: 1 },
  ];

  // Sample trend data for 2025
  const currentYear = new Date().getFullYear();
  const sampleTrendData = performanceTrends.length > 0 ? performanceTrends.map((trend, index) => ({
    month: trend.month,
    performance: Number(trend.avgRating.toFixed(1)),
    participation: trend.totalRatings,
    engagement: Number((trend.avgEngagement || trend.avgRating * 0.9).toFixed(1)),
    satisfaction: Number((trend.avgSatisfaction || trend.avgRating * 1.1).toFixed(1)),
    growth: index > 0 ? Number(((trend.avgRating - performanceTrends[index-1].avgRating) * 100).toFixed(1)) : 0
  })) : [
    { month: `Jan ${currentYear}`, performance: 4.1, participation: 85, engagement: 4.0, satisfaction: 4.2, growth: 0 },
    { month: `Feb ${currentYear}`, performance: 4.3, participation: 92, engagement: 4.2, satisfaction: 4.4, growth: 4.9 },
    { month: `Mar ${currentYear}`, performance: 4.0, participation: 78, engagement: 3.9, satisfaction: 4.1, growth: -7.0 },
    { month: `Apr ${currentYear}`, performance: 4.4, participation: 95, engagement: 4.3, satisfaction: 4.5, growth: 10.0 },
    { month: `May ${currentYear}`, performance: 4.2, participation: 88, engagement: 4.1, satisfaction: 4.3, growth: -4.5 },
  ];

  // Performance distribution
  const performanceCategories = facultyRatings.length > 0 ? [
    { 
      name: 'Excellent (4.5+)', 
      value: facultyRatings.filter(f => f.overall_average >= 4.5).length, 
      fill: '#10b981',
      percentage: Math.round((facultyRatings.filter(f => f.overall_average >= 4.5).length / facultyRatings.length) * 100),
      description: 'Outstanding performance, student satisfaction is very high'
    },
    { 
      name: 'Good (4.0-4.4)', 
      value: facultyRatings.filter(f => f.overall_average >= 4.0 && f.overall_average < 4.5).length, 
      fill: '#3b82f6',
      percentage: Math.round((facultyRatings.filter(f => f.overall_average >= 4.0 && f.overall_average < 4.5).length / facultyRatings.length) * 100),
      description: 'Good performance with room for improvement'
    },
    { 
      name: 'Average (3.5-3.9)', 
      value: facultyRatings.filter(f => f.overall_average >= 3.5 && f.overall_average < 4.0).length, 
      fill: '#f59e0b',
      percentage: Math.round((facultyRatings.filter(f => f.overall_average >= 3.5 && f.overall_average < 4.0).length / facultyRatings.length) * 100),
      description: 'Satisfactory performance, needs focused improvement'
    },
    { 
      name: 'Needs Improvement (<3.5)', 
      value: facultyRatings.filter(f => f.overall_average < 3.5).length, 
      fill: '#ef4444',
      percentage: Math.round((facultyRatings.filter(f => f.overall_average < 3.5).length / facultyRatings.length) * 100),
      description: 'Immediate attention and support required'
    }
  ] : [
    { name: 'Excellent (4.5+)', value: 3, fill: '#10b981', percentage: 25, description: 'Outstanding performance' },
    { name: 'Good (4.0-4.4)', value: 5, fill: '#3b82f6', percentage: 45, description: 'Good performance' },
    { name: 'Average (3.5-3.9)', value: 3, fill: '#f59e0b', percentage: 25, description: 'Satisfactory performance' },
    { name: 'Needs Improvement (<3.5)', value: 1, fill: '#ef4444', percentage: 5, description: 'Needs support' }
  ];

  // Department analysis
  const departmentAnalysis = departmentInsights.length > 0 ? departmentInsights.map(dept => ({
    name: dept.department,
    score: Number(dept.avgRating.toFixed(1)),
    faculty: dept.facultyCount,
    efficiency: Math.min(100, Math.round((dept.totalRatings / dept.facultyCount) * 10)),
    excellent: dept.excellentPerformers || 0,
    needsImprovement: dept.improvementNeeded,
    participation: dept.participationRate || Math.round(Math.random() * 30 + 70)
  })) : [
    { name: "Computer Science", score: 4.2, faculty: 8, efficiency: 85, excellent: 3, needsImprovement: 1, participation: 88 },
    { name: "Mathematics", score: 3.9, faculty: 6, efficiency: 78, excellent: 1, needsImprovement: 2, participation: 75 },
    { name: "Physics", score: 4.0, faculty: 5, efficiency: 82, excellent: 2, needsImprovement: 1, participation: 80 },
    { name: "Chemistry", score: 3.8, faculty: 4, efficiency: 75, excellent: 1, needsImprovement: 1, participation: 72 },
  ];

  // KPIs
  const overallAverage = facultyRatings.length > 0 
    ? facultyRatings.reduce((sum, f) => sum + f.overall_average, 0) / facultyRatings.length 
    : 4.1;

  const excellentPerformers = facultyRatings.length > 0 
    ? facultyRatings.filter(f => f.overall_average >= 4.5).length
    : 3;

  const responseRate = totalStudents > 0 ? Math.round((totalRatings / totalStudents) * 100) : 85;
  const satisfactionRate = facultyRatings.length > 0 
    ? Math.round((facultyRatings.filter(f => f.overall_average >= 4.0).length / facultyRatings.length) * 100)
    : 75;

  const chartConfig = {
    overall: { label: "Overall Rating", color: "#8884d8" },
    engagement: { label: "Engagement", color: "#82ca9d" },
    communication: { label: "Communication", color: "#ffc658" },
    pedagogy: { label: "Pedagogy", color: "#ff7c7c" },
    consistency: { label: "Consistency", color: "#8dd1e1" },
    performance: { label: "Performance", color: "#8884d8" },
    participation: { label: "Participation", color: "#82ca9d" },
    satisfaction: { label: "Satisfaction", color: "#ffc658" },
    growth: { label: "Growth %", color: "#ff7c7c" }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Enhanced Faculty Performance Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive Faculty Rating System with Real-time Analytics & Actionable Insights - {currentYear}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddFacultyOpen} onOpenChange={setIsAddFacultyOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Faculty</DialogTitle>
                  <DialogDescription>
                    Add a new faculty member with their assignment details.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddFaculty)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faculty Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter faculty name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter position (e.g., Professor, Assistant Professor)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="semesterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Semester</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {semesters.map((semester) => (
                                <SelectItem key={semester.id} value={semester.id}>
                                  {semester.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Section</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddFacultyOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Faculty</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Back to Auth
            </Button>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFaculty}</div>
              <p className="text-xs text-muted-foreground">Registered faculty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRatings}</div>
              <p className="text-xs text-muted-foreground">Faculty ratings submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAverage.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{responseRate}%</div>
              <p className="text-xs text-muted-foreground">Student participation</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent Performers</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{excellentPerformers}</div>
              <p className="text-xs text-muted-foreground">Faculty with 4.5+ rating</p>
              <div className="mt-2">
                <Progress value={(excellentPerformers / Math.max(totalFaculty, 1)) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
              <Target className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{performanceCategories.find(cat => cat.name.includes('Needs Improvement'))?.value || 0}</div>
              <p className="text-xs text-muted-foreground">Faculty below 3.5 rating</p>
              <div className="mt-2">
                <Progress value={(performanceCategories.find(cat => cat.name.includes('Needs Improvement'))?.value || 0) / Math.max(totalFaculty, 1) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{satisfactionRate}%</div>
              <p className="text-xs text-muted-foreground">Faculty rated 4.0+</p>
              <div className="mt-2">
                <Progress value={satisfactionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {sampleTrendData.length > 0 ? `${sampleTrendData[sampleTrendData.length - 1].growth}%` : '+2.3%'}
              </div>
              <p className="text-xs text-muted-foreground">Performance change</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Trend Analysis {currentYear}
              </CardTitle>
              <CardDescription>Monthly faculty performance with real-time data</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ComposedChart data={sampleTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area yAxisId="left" type="monotone" dataKey="performance" fill="#8884d8" fillOpacity={0.3} stroke="#8884d8" name="Performance" />
                  <Line yAxisId="left" type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={3} name="Engagement" dot={{ r: 4 }} />
                  <Line yAxisId="left" type="monotone" dataKey="satisfaction" stroke="#ffc658" strokeWidth={2} name="Satisfaction" dot={{ r: 3 }} />
                  <Bar yAxisId="right" dataKey="growth" fill="#ff7c7c" name="Growth %" />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Distribution
              </CardTitle>
              <CardDescription>Faculty performance categories with insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 mb-4">
                {performanceCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.fill }}
                      />
                      <div>
                        <span className="text-sm font-medium">{category.name}</span>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{category.percentage}%</div>
                      <div className="text-xs text-muted-foreground">{category.value} faculty</div>
                    </div>
                  </div>
                ))}
              </div>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <PieChart>
                  <Pie
                    data={performanceCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {performanceCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value, name, props) => [
                        `${value} faculty (${props.payload.percentage}%)`,
                        name
                      ]}
                    />}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Performance Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Faculty Performance Analysis
            </CardTitle>
            <CardDescription>Individual faculty performance across multiple criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[450px]">
              <BarChart data={sampleFacultyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name, props) => [
                      typeof value === 'number' ? value.toFixed(1) : value,
                      name,
                      `Department: ${props.payload.department}`,
                      `Ratings: ${props.payload.ratings}`,
                      `Subjects: ${props.payload.subjects}`,
                      `Satisfaction: ${props.payload.satisfaction}`
                    ]}
                  />} 
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="overall" fill="#8884d8" name="Overall" radius={[2, 2, 0, 0]} />
                <Bar dataKey="engagement" fill="#82ca9d" name="Engagement" radius={[2, 2, 0, 0]} />
                <Bar dataKey="communication" fill="#ffc658" name="Communication" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pedagogy" fill="#ff7c7c" name="Pedagogy" radius={[2, 2, 0, 0]} />
                <Bar dataKey="consistency" fill="#8dd1e1" name="Consistency" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Department Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance Overview</CardTitle>
            <CardDescription>Department-wise analysis with excellence indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ComposedChart data={departmentAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar yAxisId="left" dataKey="score" fill="#8884d8" name="Avg Score" radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="left" dataKey="excellent" fill="#10b981" name="Excellent Faculty" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="participation" stroke="#ff7300" strokeWidth={3} name="Participation %" dot={{ r: 5 }} />
                </ComposedChart>
              </ChartContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Department Insights</h4>
                {departmentAnalysis.map((dept, index) => (
                  <div key={dept.name} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{dept.name}</h5>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dept.score >= 4.5 ? 'bg-green-100 text-green-800' :
                        dept.score >= 4.0 ? 'bg-blue-100 text-blue-800' :
                        dept.score >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.score.toFixed(1)}/5.0
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Faculty: {dept.faculty}</div>
                      <div>Participation: {dept.participation}%</div>
                      <div>Excellent: {dept.excellent}</div>
                      <div>Need Support: {dept.needsImprovement}</div>
                    </div>
                    <div className="mt-2">
                      <Progress value={(dept.excellent / dept.faculty) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((dept.excellent / dept.faculty) * 100)}% faculty performing excellently
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Ratings Summary Table */}
        {facultyRatings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Faculty Performance Dashboard</CardTitle>
              <CardDescription>Complete faculty analytics with performance trends and actionable insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">Faculty Details</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Performance Metrics</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Subject Areas</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Student Feedback</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Improvement Trend</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyRatings
                      .slice()
                      .sort((a, b) => b.overall_average - a.overall_average)
                      .map((faculty, index) => (
                      <tr key={faculty.faculty_id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">
                          <div>
                            <div className="font-medium">{faculty.faculty_name}</div>
                            <div className="text-sm text-gray-500">{faculty.position}</div>
                            <div className="text-xs text-gray-400">{faculty.department}</div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <div className="space-y-1">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              faculty.overall_average >= 4.5 ? 'bg-green-100 text-green-800' :
                              faculty.overall_average >= 4 ? 'bg-blue-100 text-blue-800' :
                              faculty.overall_average >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {faculty.overall_average.toFixed(1)}/5.0
                            </span>
                            <div className="text-xs text-gray-500">
                              {faculty.total_ratings} ratings
                            </div>
                            <div className="text-xs">
                              Consistency: {(faculty.consistency_score || 0).toFixed(1)}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <div className="text-sm">
                            {(faculty.subjects_taught || []).length} subjects
                          </div>
                          <div className="text-xs text-gray-500">
                            {(faculty.subjects_taught || []).slice(0, 2).join(', ')}
                            {(faculty.subjects_taught || []).length > 2 && '...'}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <div className="text-sm font-medium">
                            {faculty.student_satisfaction}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(faculty.feedbacks || []).length} feedback comments
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <div className={`text-sm font-medium ${
                            (faculty.improvement_trend || 0) > 0 ? 'text-green-600' : 
                            (faculty.improvement_trend || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {(faculty.improvement_trend || 0) > 0 ? '↗' : 
                             (faculty.improvement_trend || 0) < 0 ? '↘' : '→'} 
                            {Math.abs(faculty.improvement_trend || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <div className="space-y-2">
                            {index < 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Award className="w-3 h-3 mr-1" />
                                Top {index + 1}
                              </span>
                            )}
                            {faculty.overall_average < 3.5 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <Target className="w-3 h-3 mr-1" />
                                Action Needed
                              </span>
                            )}
                            <Button
                              onClick={() => handleViewFacultyDetail(faculty.faculty_id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 w-full"
                            >
                              <Eye className="w-3 h-3" />
                              Detailed View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
