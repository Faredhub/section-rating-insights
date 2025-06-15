
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Star, BookOpen, LogOut, Calendar, MapPin, GraduationCap, BarChart3, TrendingUp, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface StudentProfile {
  id: string;
  name: string;
  registration_number: string;
  semester_id: string;
  section_id: string;
  year_id: string;
  created_at: string;
}

interface RatingHistory {
  id: string;
  faculty_name: string;
  subject_name: string;
  overall_rating: number;
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
}

interface FacultyStats {
  faculty_name: string;
  subject_name: string;
  avg_rating: number;
  total_ratings: number;
  my_rating: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);
  const [facultyStats, setFacultyStats] = useState<FacultyStats[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [totalRatings, setTotalRatings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchStudentData = async () => {
      console.log("Starting to fetch student data...");
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          toast({
            title: "Authentication Error",
            description: "Please log in again.",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }

        if (!user) {
          console.log("No user found, redirecting to auth");
          navigate("/auth");
          return;
        }

        console.log("Current user ID:", user.id);

        // Fetch student profile
        console.log("Fetching student profile...");
        const { data: profileData, error: profileError } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching student profile:", profileError);
          if (profileError.code === 'PGRST116') {
            toast({
              title: "Profile Not Found",
              description: "No student profile found. Please complete registration.",
              variant: "destructive"
            });
          }
        } else {
          console.log("Student profile data:", profileData);
          setStudentProfile(profileData);
        }

        // Fetch rating history
        console.log("Fetching rating history...");
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("faculty_credentials_ratings")
          .select(`
            id,
            engagement,
            concept_understanding,
            content_spread_depth,
            application_oriented_teaching,
            pedagogy_techniques_tools,
            communication_skills,
            class_decorum,
            teaching_aids,
            feedback,
            created_at,
            faculty_assignment_id,
            subject_id,
            faculty_assignments!inner (
              faculty!inner (name)
            ),
            subjects!inner (name)
          `)
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (ratingsError) {
          console.error("Error fetching ratings:", ratingsError);
          toast({
            title: "Error",
            description: "Failed to fetch rating history.",
            variant: "destructive"
          });
        } else {
          console.log("Ratings data:", ratingsData);
          
          const processedRatings: RatingHistory[] = ratingsData?.map(rating => {
            const overallRating = (
              rating.engagement + rating.concept_understanding + rating.content_spread_depth +
              rating.application_oriented_teaching + rating.pedagogy_techniques_tools +
              rating.communication_skills + rating.class_decorum + rating.teaching_aids
            ) / 8;

            return {
              id: rating.id,
              faculty_name: rating.faculty_assignments.faculty.name,
              subject_name: rating.subjects.name,
              overall_rating: overallRating,
              engagement: rating.engagement,
              concept_understanding: rating.concept_understanding,
              content_spread_depth: rating.content_spread_depth,
              application_oriented_teaching: rating.application_oriented_teaching,
              pedagogy_techniques_tools: rating.pedagogy_techniques_tools,
              communication_skills: rating.communication_skills,
              class_decorum: rating.class_decorum,
              teaching_aids: rating.teaching_aids,
              feedback: rating.feedback || '',
              created_at: rating.created_at
            };
          }) || [];

          setRatingHistory(processedRatings);
          setTotalRatings(processedRatings.length);
          
          if (processedRatings.length > 0) {
            const avgRating = processedRatings.reduce((sum, rating) => sum + rating.overall_rating, 0) / processedRatings.length;
            setAverageRating(avgRating);
          }

          // Process faculty stats
          const facultyMap = new Map<string, { ratings: number[], myRating: number, subjectName: string }>();
          
          processedRatings.forEach(rating => {
            const key = `${rating.faculty_name}-${rating.subject_name}`;
            if (!facultyMap.has(key)) {
              facultyMap.set(key, { ratings: [], myRating: rating.overall_rating, subjectName: rating.subject_name });
            }
            facultyMap.get(key)!.ratings.push(rating.overall_rating);
          });

          const processedFacultyStats: FacultyStats[] = Array.from(facultyMap.entries()).map(([key, data]) => {
            const facultyName = key.split('-')[0];
            const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length;
            
            return {
              faculty_name: facultyName,
              subject_name: data.subjectName,
              avg_rating: avgRating,
              total_ratings: data.ratings.length,
              my_rating: data.myRating
            };
          });

          setFacultyStats(processedFacultyStats);
        }

      } catch (error) {
        console.error("Error in fetchStudentData:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while fetching data.",
          variant: "destructive"
        });
      } finally {
        setLoadingProfile(false);
        setLoadingRatings(false);
      }
    };

    fetchStudentData();
  }, [toast, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loadingProfile || loadingRatings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading student dashboard...</div>
      </div>
    );
  }

  // Prepare chart data
  const ratingTrendData = ratingHistory
    .slice()
    .reverse()
    .map((rating, index) => ({
      index: index + 1,
      overall: Number(rating.overall_rating.toFixed(1)),
      engagement: rating.engagement,
      communication: rating.communication_skills,
      understanding: rating.concept_understanding,
      date: new Date(rating.created_at).toLocaleDateString()
    }));

  const criteriaAverages = ratingHistory.length > 0 ? [
    { criteria: 'Engagement', average: Number((ratingHistory.reduce((sum, r) => sum + r.engagement, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Understanding', average: Number((ratingHistory.reduce((sum, r) => sum + r.concept_understanding, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Content Depth', average: Number((ratingHistory.reduce((sum, r) => sum + r.content_spread_depth, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Application', average: Number((ratingHistory.reduce((sum, r) => sum + r.application_oriented_teaching, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Pedagogy', average: Number((ratingHistory.reduce((sum, r) => sum + r.pedagogy_techniques_tools, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Communication', average: Number((ratingHistory.reduce((sum, r) => sum + r.communication_skills, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Decorum', average: Number((ratingHistory.reduce((sum, r) => sum + r.class_decorum, 0) / ratingHistory.length).toFixed(1)) },
    { criteria: 'Teaching Aids', average: Number((ratingHistory.reduce((sum, r) => sum + r.teaching_aids, 0) / ratingHistory.length).toFixed(1)) }
  ] : [];

  const facultyComparisonData = facultyStats.map(faculty => ({
    faculty: faculty.faculty_name.split(' ').slice(-1)[0],
    myRating: Number(faculty.my_rating.toFixed(1)),
    avgRating: Number(faculty.avg_rating.toFixed(1)),
    totalRatings: faculty.total_ratings,
    subject: faculty.subject_name
  }));

  const ratingDistribution = [
    { name: 'Excellent (4.5+)', value: ratingHistory.filter(r => r.overall_rating >= 4.5).length, fill: '#22c55e' },
    { name: 'Good (4.0-4.4)', value: ratingHistory.filter(r => r.overall_rating >= 4.0 && r.overall_rating < 4.5).length, fill: '#3b82f6' },
    { name: 'Average (3.5-3.9)', value: ratingHistory.filter(r => r.overall_rating >= 3.5 && r.overall_rating < 4.0).length, fill: '#eab308' },
    { name: 'Below Average (<3.5)', value: ratingHistory.filter(r => r.overall_rating < 3.5).length, fill: '#ef4444' }
  ];

  const chartConfig = {
    overall: { label: "Overall Rating", color: "#8884d8" },
    engagement: { label: "Engagement", color: "#82ca9d" },
    communication: { label: "Communication", color: "#ffc658" },
    understanding: { label: "Understanding", color: "#ff7c7c" },
    myRating: { label: "My Rating", color: "#8884d8" },
    avgRating: { label: "Average Rating", color: "#82ca9d" },
    average: { label: "Average Score", color: "#8884d8" }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">Your academic performance and rating analytics</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/student-rate")} className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Rate Faculty
            </Button>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Student Profile Information */}
        {studentProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{studentProfile.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-medium">{studentProfile.registration_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{new Date(studentProfile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-green-600">Active Student</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings Given</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRatings}</div>
              <p className="text-xs text-muted-foreground">Faculty ratings submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating Given</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Rated</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facultyStats.length}</div>
              <p className="text-xs text-muted-foreground">Unique faculty members</p>
            </CardContent>
          </Card>
        </div>

        {ratingHistory.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Rating History</h3>
                <p className="text-muted-foreground mb-4">You haven't submitted any faculty ratings yet.</p>
                <Button onClick={() => navigate("/student-rate")}>
                  Rate Your First Faculty
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Rating Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Your Rating Trends
                  </CardTitle>
                  <CardDescription>How your ratings have evolved over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <LineChart data={ratingTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(1) : value, 
                            name
                          ]} 
                        />} 
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="overall" stroke="#8884d8" strokeWidth={3} name="Overall Rating" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} name="Engagement" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="communication" stroke="#ffc658" strokeWidth={2} name="Communication" dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Rating Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Your Rating Distribution
                  </CardTitle>
                  <CardDescription>Distribution of ratings you've given</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <Pie
                        data={ratingDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Criteria Performance & Faculty Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Criteria Averages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Rating Patterns by Criteria
                  </CardTitle>
                  <CardDescription>Average ratings you give for each evaluation criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <BarChart data={criteriaAverages} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="criteria" type="category" width={100} tick={{ fontSize: 11 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : value, "Your Average"]} 
                        />} 
                      />
                      <Bar dataKey="average" fill="#8884d8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Faculty Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Faculty Ratings Comparison
                  </CardTitle>
                  <CardDescription>Your ratings vs. your average for each faculty</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <BarChart data={facultyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(1) : value, 
                            name
                          ]} 
                        />} 
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="myRating" fill="#8884d8" name="Your Rating" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="avgRating" fill="#82ca9d" name="Your Average" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Ratings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Rating History</CardTitle>
                <CardDescription>Your latest faculty ratings and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Faculty</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Subject</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Overall Rating</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Engagement</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Communication</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratingHistory.slice(0, 10).map((rating) => (
                        <tr key={rating.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{rating.faculty_name}</td>
                          <td className="border border-gray-200 px-4 py-2">{rating.subject_name}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              rating.overall_rating >= 4.5 ? 'bg-green-100 text-green-800' :
                              rating.overall_rating >= 4 ? 'bg-blue-100 text-blue-800' :
                              rating.overall_rating >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {rating.overall_rating.toFixed(1)}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">{rating.engagement}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">{rating.communication_skills}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            {new Date(rating.created_at).toLocaleDateString()}
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

export default StudentDashboard;
