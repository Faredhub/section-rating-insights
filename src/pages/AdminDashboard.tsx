
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Star, BookOpen, TrendingUp, ArrowLeft } from "lucide-react";

const AdminDashboard = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalRatings: 0,
    totalStudents: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Get faculty count
      const { count: facultyCount } = await supabase
        .from("faculty")
        .select("*", { count: "exact", head: true });

      // Get ratings count
      const { count: ratingsCount } = await supabase
        .from("faculty_credentials_ratings")
        .select("*", { count: "exact", head: true });

      // Get unique students count (from ratings)
      const { data: studentData } = await supabase
        .from("faculty_credentials_ratings")
        .select("student_id");

      const uniqueStudents = new Set(studentData?.map(r => r.student_id) || []).size;

      // Calculate average rating across all credentials
      const { data: ratingsData } = await supabase
        .from("faculty_credentials_ratings")
        .select("engagement, concept_understanding, content_spread_depth, application_oriented_teaching, pedagogy_techniques_tools, communication_skills, class_decorum, teaching_aids");

      let totalRatingSum = 0;
      let totalRatingCount = 0;

      ratingsData?.forEach(rating => {
        const values = [
          rating.engagement,
          rating.concept_understanding,
          rating.content_spread_depth,
          rating.application_oriented_teaching,
          rating.pedagogy_techniques_tools,
          rating.communication_skills,
          rating.class_decorum,
          rating.teaching_aids
        ];
        totalRatingSum += values.reduce((sum, val) => sum + val, 0);
        totalRatingCount += values.length;
      });

      const avgRating = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;

      setStats({
        totalFaculty: facultyCount || 0,
        totalRatings: ratingsCount || 0,
        totalStudents: uniqueStudents,
        averageRating: Number(avgRating.toFixed(2))
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error logging out", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged out successfully" });
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin: {user.email}</span>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground">Faculty members registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRatings}</div>
              <p className="text-xs text-muted-foreground">Ratings submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Students who rated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">Out of 5 stars</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Manage Faculty</CardTitle>
              <CardDescription>Add, edit, or remove faculty members</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/faculty")}>
                Manage Faculty
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>View All Ratings</CardTitle>
              <CardDescription>Browse all faculty ratings and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/ratings")}>
                View Ratings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Manage Academic Structure</CardTitle>
              <CardDescription>Manage years, semesters, sections, and subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
