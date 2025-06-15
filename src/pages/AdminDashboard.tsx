import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Star, BookOpen, TrendingUp, LogOut, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
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

const AdminDashboard = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [facultyRatings, setFacultyRatings] = useState<FacultyRating[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      //navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingData(true);
      
      try {
        // Get faculty ratings analytics
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
            faculty_assignments!inner (
              faculty!inner (id, name, department, position)
            )
          `);

        if (ratingsError) throw ratingsError;

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

        setFacultyRatings(processedFacultyRatings);

        // Get basic stats
        const { count: facultyCount } = await supabase
          .from("faculty")
          .select("*", { count: "exact", head: true });

        const { count: ratingsCount } = await supabase
          .from("faculty_credentials_ratings")
          .select("*", { count: "exact", head: true });

        setTotalFaculty(facultyCount || 0);
        setTotalRatings(ratingsCount || 0);
        setTotalStudents(50); // Sample number since we don't have student tracking

      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive"
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user, toast]);

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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
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

  // Prepare chart data
  const facultyPerformanceData = facultyRatings.map(faculty => ({
    name: faculty.faculty_name.split(' ').slice(-1)[0], // Last name only
    overall: faculty.overall_average,
    engagement: faculty.avg_engagement,
    communication: faculty.avg_communication_skills,
    pedagogy: faculty.avg_pedagogy_techniques_tools
  }));

  const departmentData = facultyRatings.reduce((acc, faculty) => {
    const dept = faculty.department;
    if (!acc[dept]) {
      acc[dept] = { department: dept, count: 0, avgRating: 0, totalRating: 0 };
    }
    acc[dept].count += 1;
    acc[dept].totalRating += faculty.overall_average;
    acc[dept].avgRating = acc[dept].totalRating / acc[dept].count;
    return acc;
  }, {} as { [key: string]: { department: string; count: number; avgRating: number; totalRating: number } });

  const departmentChartData = Object.values(departmentData);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Faculty Rating System Analytics</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="text-2xl font-bold">
                {facultyRatings.length > 0 
                  ? (facultyRatings.reduce((sum, f) => sum + f.overall_average, 0) / facultyRatings.length).toFixed(1)
                  : '0.0'
                }
              </div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faculty Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Faculty Performance Overview</CardTitle>
              <CardDescription>Overall ratings by faculty member</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={facultyPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="overall" fill="#8884d8" name="Overall Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Average ratings by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ department, avgRating }) => `${department}: ${avgRating.toFixed(1)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="avgRating"
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Faculty Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Faculty Performance</CardTitle>
            <CardDescription>Performance breakdown by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={facultyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="engagement" stroke="#8884d8" name="Engagement" />
                <Line type="monotone" dataKey="communication" stroke="#82ca9d" name="Communication" />
                <Line type="monotone" dataKey="pedagogy" stroke="#ffc658" name="Pedagogy" />
                <Line type="monotone" dataKey="overall" stroke="#ff7300" name="Overall" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Faculty Table */}
        <Card>
          <CardHeader>
            <CardTitle>Faculty Ratings Summary</CardTitle>
            <CardDescription>Detailed breakdown of all faculty ratings - Click "View Details" for comprehensive insights</CardDescription>
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
                    <th className="border border-gray-200 px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyRatings.map((faculty) => (
                    <tr key={faculty.faculty_id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium">{faculty.faculty_name}</td>
                      <td className="border border-gray-200 px-4 py-2">{faculty.department}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{faculty.total_ratings}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          faculty.overall_average >= 4 ? 'bg-green-100 text-green-800' :
                          faculty.overall_average >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {faculty.overall_average.toFixed(1)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{faculty.avg_engagement.toFixed(1)}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{faculty.avg_communication_skills.toFixed(1)}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{faculty.avg_pedagogy_techniques_tools.toFixed(1)}</td>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
