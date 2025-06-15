
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Users, BookOpen } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from "recharts";

interface FacultyDetailProps {
  facultyId: string;
  onBack: () => void;
}

interface DetailedRating {
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
  subjects: { name: string };
  sections: { name: string };
}

interface FacultyInfo {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
}

const FacultyPerformanceDetail: React.FC<FacultyDetailProps> = ({ facultyId, onBack }) => {
  const [facultyInfo, setFacultyInfo] = useState<FacultyInfo | null>(null);
  const [ratings, setRatings] = useState<DetailedRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacultyDetails();
  }, [facultyId]);

  const fetchFacultyDetails = async () => {
    try {
      // Get faculty info
      const { data: faculty } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", facultyId)
        .single();

      setFacultyInfo(faculty);

      // Get detailed ratings
      const { data: ratingsData } = await supabase
        .from("faculty_credentials_ratings")
        .select(`
          *,
          faculty_assignments!inner(
            subjects(name),
            sections(name)
          )
        `)
        .eq("faculty_assignments.faculty_id", facultyId);

      if (ratingsData) {
        const processedRatings = ratingsData.map(rating => ({
          ...rating,
          subjects: rating.faculty_assignments.subjects,
          sections: rating.faculty_assignments.sections
        }));
        setRatings(processedRatings);
      }
    } catch (error) {
      console.error("Error fetching faculty details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-muted-foreground">Loading faculty details...</div>
      </div>
    );
  }

  if (!facultyInfo) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Faculty not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Calculate averages
  const criteriaAverages = {
    engagement: ratings.reduce((sum, r) => sum + r.engagement, 0) / ratings.length || 0,
    concept_understanding: ratings.reduce((sum, r) => sum + r.concept_understanding, 0) / ratings.length || 0,
    content_spread_depth: ratings.reduce((sum, r) => sum + r.content_spread_depth, 0) / ratings.length || 0,
    application_oriented_teaching: ratings.reduce((sum, r) => sum + r.application_oriented_teaching, 0) / ratings.length || 0,
    pedagogy_techniques_tools: ratings.reduce((sum, r) => sum + r.pedagogy_techniques_tools, 0) / ratings.length || 0,
    communication_skills: ratings.reduce((sum, r) => sum + r.communication_skills, 0) / ratings.length || 0,
    class_decorum: ratings.reduce((sum, r) => sum + r.class_decorum, 0) / ratings.length || 0,
    teaching_aids: ratings.reduce((sum, r) => sum + r.teaching_aids, 0) / ratings.length || 0,
  };

  const overallAverage = Object.values(criteriaAverages).reduce((sum, val) => sum + val, 0) / Object.values(criteriaAverages).length;

  // Prepare chart data
  const criteriaChartData = [
    { criteria: "Engagement", score: criteriaAverages.engagement },
    { criteria: "Concept Understanding", score: criteriaAverages.concept_understanding },
    { criteria: "Content Depth", score: criteriaAverages.content_spread_depth },
    { criteria: "Application Teaching", score: criteriaAverages.application_oriented_teaching },
    { criteria: "Pedagogy Tools", score: criteriaAverages.pedagogy_techniques_tools },
    { criteria: "Communication", score: criteriaAverages.communication_skills },
    { criteria: "Class Decorum", score: criteriaAverages.class_decorum },
    { criteria: "Teaching Aids", score: criteriaAverages.teaching_aids },
  ];

  const radarData = criteriaChartData.map(item => ({
    subject: item.criteria.replace(/\s/g, '\n'),
    score: item.score,
    fullMark: 5
  }));

  // Performance over time
  const timelineData = ratings
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((rating, index) => ({
      rating: index + 1,
      overall: (rating.engagement + rating.concept_understanding + rating.content_spread_depth + 
               rating.application_oriented_teaching + rating.pedagogy_techniques_tools + 
               rating.communication_skills + rating.class_decorum + rating.teaching_aids) / 8,
      date: new Date(rating.created_at).toLocaleDateString()
    }));

  // Subject-wise performance
  const subjectPerformance = ratings.reduce((acc, rating) => {
    const subject = rating.subjects.name;
    if (!acc[subject]) {
      acc[subject] = { total: 0, count: 0 };
    }
    const overallScore = (rating.engagement + rating.concept_understanding + rating.content_spread_depth + 
                         rating.application_oriented_teaching + rating.pedagogy_techniques_tools + 
                         rating.communication_skills + rating.class_decorum + rating.teaching_aids) / 8;
    acc[subject].total += overallScore;
    acc[subject].count += 1;
    return acc;
  }, {} as { [key: string]: { total: number; count: number } });

  const subjectChartData = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject,
    average: data.total / data.count,
    ratings: data.count
  }));

  const getPerformanceColor = (score: number) => {
    if (score >= 4.5) return "text-green-600 bg-green-100";
    if (score >= 4) return "text-blue-600 bg-blue-100";
    if (score >= 3.5) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 4) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">{facultyInfo.name}</h1>
          <p className="text-muted-foreground">{facultyInfo.position} - {facultyInfo.department}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverage.toFixed(1)}</div>
            <Badge className={`mt-1 ${getPerformanceColor(overallAverage)}`}>
              {getPerformanceIcon(overallAverage)}
              {overallAverage >= 4 ? "Excellent" : overallAverage >= 3.5 ? "Good" : "Needs Improvement"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
            <p className="text-xs text-muted-foreground">Student evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Taught</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(subjectPerformance).length}</div>
            <p className="text-xs text-muted-foreground">Different subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Criteria</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {criteriaChartData.reduce((max, item) => item.score > max.score ? item : max).criteria}
            </div>
            <p className="text-xs text-muted-foreground">
              {criteriaChartData.reduce((max, item) => item.score > max.score ? item : max).score.toFixed(1)}/5.0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criteria Performance Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Radar</CardTitle>
            <CardDescription>Detailed breakdown of all evaluation criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Criteria Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Criteria Breakdown</CardTitle>
            <CardDescription>Average scores across all evaluation criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={criteriaChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="criteria" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Over Time and Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Timeline</CardTitle>
            <CardDescription>Rating trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis domain={[0, 5]} />
                <Tooltip 
                  labelFormatter={(label) => `Rating #${label}`}
                  formatter={(value: any, name) => [value?.toFixed(2), "Overall Score"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="overall" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: "#8884d8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject-wise Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
            <CardDescription>Average ratings by subject taught</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="average" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Student Feedback</CardTitle>
          <CardDescription>Latest comments and feedback from students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ratings
              .filter(rating => rating.feedback && rating.feedback.trim() !== "")
              .slice(-5)
              .reverse()
              .map((rating, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 mb-1">"{rating.feedback}"</p>
                      <div className="text-xs text-muted-foreground">
                        {rating.subjects.name} • {rating.sections.name} • {new Date(rating.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {((rating.engagement + rating.concept_understanding + rating.content_spread_depth + 
                        rating.application_oriented_teaching + rating.pedagogy_techniques_tools + 
                        rating.communication_skills + rating.class_decorum + rating.teaching_aids) / 8).toFixed(1)}/5
                    </Badge>
                  </div>
                </div>
              ))}
            {ratings.filter(rating => rating.feedback && rating.feedback.trim() !== "").length === 0 && (
              <p className="text-muted-foreground text-center py-4">No feedback available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyPerformanceDetail;
