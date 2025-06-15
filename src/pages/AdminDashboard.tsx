import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Star, BookOpen, TrendingUp, LogOut, Eye, Award, Target, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Area, AreaChart } from "recharts";
import FacultyPerformanceDetail from "@/components/FacultyPerformanceDetail";

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

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      console.log("Starting to fetch analytics data...");
      setLoadingData(true);
      
      try {
        // Get faculty ratings analytics
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

        // Process faculty ratings
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

        // Calculate averages
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

        // Process performance trends (monthly)
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

        // Process department insights
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

        // Get basic stats
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
          description: "Failed to fetch analytics data.",
          variant: "destructive"
        });
      } finally {
        console.log("Finished loading data");
        setLoadingData(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

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

  // Show detailed faculty view if selected
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

  // Enhanced chart data preparation
  const facultyPerformanceData = facultyRatings.map(faculty => ({
    name: faculty.faculty_name.split(' ').slice(-1)[0],
    overall: Number(faculty.overall_average.toFixed(1)),
    engagement: Number(faculty.avg_engagement.toFixed(1)),
    communication: Number(faculty.avg_communication_skills.toFixed(1)),
    pedagogy: Number(faculty.avg_pedagogy_techniques_tools.toFixed(1)),
    ratings: faculty.total_ratings,
    department: faculty.department
  }));

  const criteriaComparisonData = [
    { 
      criteria: 'Engagement', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_engagement, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Understanding', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_concept_understanding, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Content Depth', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_content_spread_depth, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Application', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_application_oriented_teaching, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Pedagogy', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_pedagogy_techniques_tools, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Communication', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_communication_skills, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Decorum', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_class_decorum, 0) / facultyRatings.length).toFixed(1)) : 0 
    },
    { 
      criteria: 'Teaching Aids', 
      average: facultyRatings.length > 0 ? Number((facultyRatings.reduce((sum, f) => sum + f.avg_teaching_aids, 0) / facultyRatings.length).toFixed(1)) : 0 
    }
  ];

  // Performance distribution for pie chart
  const performanceDistribution = [
    { name: 'Excellent (4.5+)', value: facultyRatings.filter(f => f.overall_average >= 4.5).length, fill: '#22c55e' },
    { name: 'Good (4.0-4.4)', value: facultyRatings.filter(f => f.overall_average >= 4.0 && f.overall_average < 4.5).length, fill: '#3b82f6' },
    { name: 'Average (3.5-3.9)', value: facultyRatings.filter(f => f.overall_average >= 3.5 && f.overall_average < 4.0).length, fill: '#eab308' },
    { name: 'Needs Improvement (<3.5)', value: facultyRatings.filter(f => f.overall_average < 3.5).length, fill: '#ef4444' }
  ];

  // Department performance data
  const departmentPerformanceData = departmentInsights.map(dept => ({
    department: dept.department,
    avgRating: Number(dept.avgRating.toFixed(1)),
    facultyCount: dept.facultyCount,
    totalRatings: dept.totalRatings,
    improvementNeeded: dept.improvementNeeded
  }));

  // Faculty ranking data for radar chart
  const topFacultyRadarData = facultyRatings
    .slice()
    .sort((a, b) => b.overall_average - a.overall_average)
    .slice(0, 5)
    .map(faculty => ({
      faculty: faculty.faculty_name.split(' ').slice(-1)[0],
      engagement: faculty.avg_engagement,
      understanding: faculty.avg_concept_understanding,
      pedagogy: faculty.avg_pedagogy_techniques_tools,
      communication: faculty.avg_communication_skills,
      overall: faculty.overall_average
    }));

  // Monthly trends enhanced
  const monthlyTrendData = performanceTrends.map(trend => ({
    month: trend.month,
    totalRatings: trend.totalRatings,
    avgRating: Number(trend.avgRating.toFixed(1))
  }));

  // Chart configuration
  const chartConfig = {
    overall: { label: "Overall Rating", color: "#8884d8" },
    engagement: { label: "Engagement", color: "#82ca9d" },
    communication: { label: "Communication", color: "#ffc658" },
    pedagogy: { label: "Pedagogy", color: "#ff7c7c" },
    understanding: { label: "Understanding", color: "#8dd1e1" },
    ratings: { label: "Total Ratings", color: "#d084d0" },
    average: { label: "Average Score", color: "#8884d8" },
    facultyCount: { label: "Faculty Count", color: "#82ca9d" }
  };

  const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

  const overallAverage = facultyRatings.length > 0 
    ? facultyRatings.reduce((sum, f) => sum + f.overall_average, 0) / facultyRatings.length 
    : 0;

  const excellentPerformers = facultyRatings.filter(f => f.overall_average >= 4.5).length;
  const needsImprovement = facultyRatings.filter(f => f.overall_average < 3.5).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Faculty Performance Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive Faculty Rating System Analytics & Visual Insights</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/auth")} variant="outline">
              Back to Auth
            </Button>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
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

        {/* Performance Insights Cards */}
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
              <div className="text-2xl font-bold text-red-600">{needsImprovement}</div>
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
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Enhanced Faculty Performance Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Faculty Performance Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Faculty Performance Comparison
                  </CardTitle>
                  <CardDescription>Overall ratings and participation metrics by faculty member</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <ComposedChart data={facultyPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(1) : value, 
                            name
                          ]} 
                        />} 
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar yAxisId="right" dataKey="ratings" fill="#d084d0" name="Total Ratings" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="overall" stroke="#8884d8" strokeWidth={3} name="Overall Rating" dot={{ r: 5 }} />
                      <Line yAxisId="left" type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} name="Engagement" dot={{ r: 3 }} />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Performance Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Distribution Analysis
                  </CardTitle>
                  <CardDescription>Faculty distribution across performance categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <Pie
                        data={performanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Criteria Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Criteria Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Evaluation Criteria Performance
                  </CardTitle>
                  <CardDescription>Average performance across all evaluation criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <BarChart data={criteriaComparisonData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="criteria" type="category" width={100} tick={{ fontSize: 11 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value) => [value.toFixed(1), "Average Score"]} 
                        />} 
                      />
                      <Bar dataKey="average" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {criteriaComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top Faculty Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Top Faculty Skills Comparison
                  </CardTitle>
                  <CardDescription>Multi-dimensional analysis of top performing faculty</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <RadarChart data={topFacultyRadarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="faculty" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={0} domain={[0, 5]} tick={{ fontSize: 8 }} />
                      <Radar name="Engagement" dataKey="engagement" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name="Communication" dataKey="communication" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name="Pedagogy" dataKey="pedagogy" stroke="#ff7c7c" fill="#ff7c7c" fillOpacity={0.3} strokeWidth={2} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends Over Time */}
            {performanceTrends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Trends Analysis
                  </CardTitle>
                  <CardDescription>Monthly rating trends and participation patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <ComposedChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area yAxisId="left" type="monotone" dataKey="avgRating" fill="#8884d8" fillOpacity={0.3} />
                      <Line yAxisId="left" type="monotone" dataKey="avgRating" stroke="#8884d8" strokeWidth={3} name="Avg Rating" dot={{ r: 5 }} />
                      <Bar yAxisId="right" dataKey="totalRatings" fill="#d084d0" name="Total Ratings" radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Department Performance Analysis */}
            {departmentInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Department Performance Insights
                  </CardTitle>
                  <CardDescription>Comprehensive department-wise performance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {departmentInsights.map((dept, index) => (
                      <Card key={dept.department} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2 text-sm">{dept.department}</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Faculty:</span>
                              <span className="font-medium">{dept.facultyCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Rating:</span>
                              <span className="font-medium">{dept.avgRating.toFixed(1)}/5</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ratings:</span>
                              <span className="font-medium">{dept.totalRatings}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Top:</span>
                              <span className="font-medium text-green-600 text-xs">{dept.topPerformer}</span>
                            </div>
                            {dept.improvementNeeded > 0 && (
                              <div className="flex justify-between">
                                <span>Need Help:</span>
                                <span className="font-medium text-red-600">{dept.improvementNeeded}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <ChartContainer config={chartConfig} className="h-[350px]">
                    <ComposedChart data={departmentPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar yAxisId="left" dataKey="avgRating" fill="#8884d8" name="Average Rating" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="facultyCount" stroke="#82ca9d" strokeWidth={2} name="Faculty Count" dot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="totalRatings" stroke="#ffc658" strokeWidth={2} name="Total Ratings" dot={{ r: 4 }} />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Faculty Table */}
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
