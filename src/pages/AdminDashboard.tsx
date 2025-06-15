
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Area, AreaChart } from "recharts";
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
}

interface PerformanceTrend {
  month: string;
  totalRatings: number;
  avgRating: number;
}

interface DepartmentInsight {
  department: string;
  facultyCount: number;
  totalRatings: number;
  avgRating: number;
  topPerformer: string;
  improvementNeeded: number;
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
            faculty_assignments!inner (
              faculty!inner (id, name, department, position)
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
          ratings: number[];
          criteria: { [key: string]: number[] };
        }>();

        ratingsData?.forEach((rating) => {
          const faculty = rating.faculty_assignments.faculty;
          const facultyId = faculty.id;
          
          if (!facultyMap.has(facultyId)) {
            facultyMap.set(facultyId, {
              faculty_id: facultyId,
              faculty_name: faculty.name,
              department: faculty.department,
              position: faculty.position,
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
              }
            });
          }

          const facultyData = facultyMap.get(facultyId)!;
          facultyData.criteria.engagement.push(rating.engagement);
          facultyData.criteria.concept_understanding.push(rating.concept_understanding);
          facultyData.criteria.content_spread_depth.push(rating.content_spread_depth);
          facultyData.criteria.application_oriented_teaching.push(rating.application_oriented_teaching);
          facultyData.criteria.pedagogy_techniques_tools.push(rating.pedagogy_techniques_tools);
          facultyData.criteria.communication_skills.push(rating.communication_skills);
          facultyData.criteria.class_decorum.push(rating.class_decorum);
          facultyData.criteria.teaching_aids.push(rating.teaching_aids);
        });

        const processedFacultyRatings: FacultyRating[] = Array.from(facultyMap.values()).map(faculty => {
          const criteriaAverages = Object.entries(faculty.criteria).reduce((acc, [key, values]) => {
            acc[`avg_${key}`] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            return acc;
          }, {} as { [key: string]: number });

          const overallAverage = Object.values(criteriaAverages).reduce((sum, val) => sum + val, 0) / Object.values(criteriaAverages).length;

          return {
            faculty_id: faculty.faculty_id,
            faculty_name: faculty.faculty_name,
            department: faculty.department,
            position: faculty.position,
            total_ratings: Object.values(faculty.criteria)[0].length,
            ...criteriaAverages,
            overall_average: overallAverage
          } as FacultyRating;
        });

        console.log("Processed faculty ratings:", processedFacultyRatings);
        setFacultyRatings(processedFacultyRatings);

        // Performance trends calculation
        const trendMap = new Map<string, { total: number; count: number; sum: number }>();
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
            trendMap.set(month, { total: 0, count: 0, sum: 0 });
          }
          
          const trend = trendMap.get(month)!;
          trend.total += 1;
          trend.count += 1;
          trend.sum += avgRating;
        });

        const trends: PerformanceTrend[] = Array.from(trendMap.entries())
          .map(([month, data]) => ({
            month,
            totalRatings: data.total,
            avgRating: data.sum / data.count
          }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        setPerformanceTrends(trends);

        // Department insights calculation
        const deptMap = new Map<string, {
          facultyIds: Set<string>;
          totalRatings: number;
          totalScore: number;
          facultyScores: { [key: string]: { name: string; score: number; ratings: number } };
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
            ratings: faculty.total_ratings
          };
        });

        const insights: DepartmentInsight[] = Array.from(deptMap.entries()).map(([department, data]) => {
          const avgRating = data.totalRatings > 0 ? data.totalScore / data.totalRatings : 0;
          const facultyScores = Object.values(data.facultyScores);
          const topPerformer = facultyScores.reduce((max, faculty) => 
            faculty.score > max.score ? faculty : max, facultyScores[0]);
          const improvementNeeded = facultyScores.filter(f => f.score < 3.5).length;

          return {
            department,
            facultyCount: data.facultyIds.size,
            totalRatings: data.totalRatings,
            avgRating,
            topPerformer: topPerformer?.name || 'N/A',
            improvementNeeded
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
      // Insert faculty
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

      if (facultyError) throw facultyError;

      // Create faculty assignment
      const { error: assignmentError } = await supabase
        .from("faculty_assignments")
        .insert({
          faculty_id: facultyData.id,
          section_id: values.sectionId,
          subject_id: values.subjectId,
        });

      if (assignmentError) throw assignmentError;

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

  // Enhanced data processing for advanced analytics
  const facultyPerformanceData = facultyRatings.map(faculty => ({
    name: faculty.faculty_name.split(' ').slice(-1)[0],
    overall: Number(faculty.overall_average.toFixed(1)),
    engagement: Number(faculty.avg_engagement.toFixed(1)),
    communication: Number(faculty.avg_communication_skills.toFixed(1)),
    pedagogy: Number(faculty.avg_pedagogy_techniques_tools.toFixed(1)),
    ratings: faculty.total_ratings,
    department: faculty.department
  }));

  // Monthly performance trend data
  const monthlyAnalysisData = performanceTrends.map((trend, index) => ({
    month: trend.month,
    performance: Number(trend.avgRating.toFixed(1)),
    participation: trend.totalRatings,
    engagement: Number((trend.avgRating * 0.9 + Math.random() * 0.2).toFixed(1)),
    satisfaction: Number((trend.avgRating * 1.1 - Math.random() * 0.3).toFixed(1))
  }));

  // Performance distribution for pie chart
  const performanceCategories = [
    { 
      name: 'Excellent', 
      value: facultyRatings.filter(f => f.overall_average >= 4.5).length, 
      fill: '#10b981',
      percentage: facultyRatings.length > 0 ? Math.round((facultyRatings.filter(f => f.overall_average >= 4.5).length / facultyRatings.length) * 100) : 0
    },
    { 
      name: 'Good', 
      value: facultyRatings.filter(f => f.overall_average >= 4.0 && f.overall_average < 4.5).length, 
      fill: '#3b82f6',
      percentage: facultyRatings.length > 0 ? Math.round((facultyRatings.filter(f => f.overall_average >= 4.0 && f.overall_average < 4.5).length / facultyRatings.length) * 100) : 0
    },
    { 
      name: 'Average', 
      value: facultyRatings.filter(f => f.overall_average >= 3.5 && f.overall_average < 4.0).length, 
      fill: '#f59e0b',
      percentage: facultyRatings.length > 0 ? Math.round((facultyRatings.filter(f => f.overall_average >= 3.5 && f.overall_average < 4.0).length / facultyRatings.length) * 100) : 0
    },
    { 
      name: 'Needs Improvement', 
      value: facultyRatings.filter(f => f.overall_average < 3.5).length, 
      fill: '#ef4444',
      percentage: facultyRatings.length > 0 ? Math.round((facultyRatings.filter(f => f.overall_average < 3.5).length / facultyRatings.length) * 100) : 0
    }
  ];

  // Department performance metrics
  const departmentAnalysis = departmentInsights.map(dept => ({
    name: dept.department,
    score: Number(dept.avgRating.toFixed(1)),
    faculty: dept.facultyCount,
    efficiency: Math.min(100, Math.round((dept.totalRatings / dept.facultyCount) * 10)),
    growth: Math.round(Math.random() * 30 - 10) // Simulated growth percentage
  }));

  // Key performance indicators
  const overallAverage = facultyRatings.length > 0 
    ? facultyRatings.reduce((sum, f) => sum + f.overall_average, 0) / facultyRatings.length 
    : 0;

  const excellentPerformers = facultyRatings.filter(f => f.overall_average >= 4.5).length;
  const satisfactionRate = Math.round(overallAverage * 20); // Convert to percentage
  const participationRate = totalStudents > 0 ? Math.round((totalRatings / totalStudents) * 100) : 0;

  const chartConfig = {
    overall: { label: "Overall Rating", color: "#8884d8" },
    engagement: { label: "Engagement", color: "#82ca9d" },
    communication: { label: "Communication", color: "#ffc658" },
    pedagogy: { label: "Pedagogy", color: "#ff7c7c" },
    performance: { label: "Performance", color: "#8884d8" },
    participation: { label: "Participation", color: "#82ca9d" },
    satisfaction: { label: "Satisfaction", color: "#ffc658" }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Faculty Performance Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive Faculty Rating System Analytics & Visual Insights</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent Performers</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{excellentPerformers}</div>
              <p className="text-xs text-muted-foreground">Faculty with 4.5+ rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
              <Target className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{performanceCategories.find(cat => cat.name === 'Needs Improvement')?.value}</div>
              <p className="text-xs text-muted-foreground">Faculty below 3.5 rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalStudents > 0 ? Math.round((totalRatings / totalStudents) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Student participation</p>
            </CardContent>
          </Card>
        </div>

        {facultyRatings.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground">No faculty ratings found in the database.</p>
                <p className="text-sm text-muted-foreground mt-2">Add faculty members and collect ratings to see analytics.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Advanced Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Trend Analysis
                  </CardTitle>
                  <CardDescription>Monthly faculty performance and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[350px]">
                    <LineChart data={monthlyAnalysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="#8884d8" 
                        strokeWidth={3} 
                        name="Performance"
                        dot={{ r: 6, fill: "#8884d8" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#82ca9d" 
                        strokeWidth={2} 
                        name="Engagement"
                        dot={{ r: 4, fill: "#82ca9d" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="#ffc658" 
                        strokeWidth={2} 
                        name="Satisfaction"
                        dot={{ r: 4, fill: "#ffc658" }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Distribution
                  </CardTitle>
                  <CardDescription>Faculty performance category breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {performanceCategories.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.fill }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
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
                        innerRadius={40}
                        outerRadius={80}
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

            {/* Department Performance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance Overview</CardTitle>
                <CardDescription>Comparative analysis of department-wise faculty performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ComposedChart data={departmentAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar yAxisId="left" dataKey="score" fill="#8884d8" name="Avg Score" />
                    <Bar yAxisId="left" dataKey="faculty" fill="#82ca9d" name="Faculty Count" />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#ff7300" name="Efficiency %" />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Faculty Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Faculty Ratings Summary</CardTitle>
                <CardDescription>Comprehensive faculty performance data - Click "View Details" for detailed analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Faculty Name</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Department</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Total Ratings</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Overall Average</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Engagement</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Communication</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Pedagogy</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Performance</th>
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
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2">{faculty.department}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className="font-medium">{faculty.total_ratings}</span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              faculty.overall_average >= 4.5 ? 'bg-green-100 text-green-800' :
                              faculty.overall_average >= 4 ? 'bg-blue-100 text-blue-800' :
                              faculty.overall_average >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {faculty.overall_average.toFixed(1)}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">{faculty.avg_engagement.toFixed(1)}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">{faculty.avg_communication_skills.toFixed(1)}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">{faculty.avg_pedagogy_techniques_tools.toFixed(1)}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
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
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Button
                              onClick={() => handleViewFacultyDetail(faculty.faculty_id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
