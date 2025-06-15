
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  faculty: {
    name: string;
    department: string;
    position: string;
  };
}

interface FacultyStats {
  faculty_id: string;
  faculty_name: string;
  department: string;
  position: string;
  average_rating: number;
  total_ratings: number;
}

const Ratings = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [facultyStats, setFacultyStats] = useState<FacultyStats[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRatings();
      fetchFacultyStats();
    }
  }, [user]);

  const fetchRatings = async () => {
    const { data, error } = await supabase
      .from("ratings")
      .select(`
        id,
        rating,
        comment,
        created_at,
        faculty:faculty_id (
          name,
          department,
          position
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching ratings", description: error.message, variant: "destructive" });
    } else {
      setRatings(data || []);
    }
    setLoadingData(false);
  };

  const fetchFacultyStats = async () => {
    const { data, error } = await supabase
      .from("faculty_stats")
      .select("*")
      .order("average_rating", { ascending: false });

    if (error) {
      console.error("Error fetching faculty stats:", error);
    } else {
      setFacultyStats(data || []);
    }
  };

  const StarDisplay = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading || loadingData) {
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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Faculty Ratings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Faculty Stats Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Faculty Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facultyStats.map((faculty) => (
              <Card key={faculty.faculty_id}>
                <CardHeader>
                  <CardTitle className="text-lg">{faculty.faculty_name}</CardTitle>
                  <CardDescription>{faculty.position} - {faculty.department}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={Math.round(faculty.average_rating)} />
                      <span className="font-semibold">{faculty.average_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {faculty.total_ratings} rating{faculty.total_ratings !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {facultyStats.length === 0 && (
            <Card>
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground">
                  No faculty ratings available yet.
                  <Link to="/rate" className="text-primary hover:underline ml-1">
                    Be the first to rate!
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Ratings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Ratings</h2>
          <div className="space-y-4">
            {ratings.map((rating) => (
              <Card key={rating.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{rating.faculty.name}</CardTitle>
                      <CardDescription>
                        {rating.faculty.position} - {rating.faculty.department}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={rating.rating} />
                      <span className="font-semibold">{rating.rating}/5</span>
                    </div>
                  </div>
                </CardHeader>
                {rating.comment && (
                  <CardContent>
                    <p className="text-muted-foreground italic">"{rating.comment}"</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Rated on {new Date(rating.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {ratings.length === 0 && (
            <Card>
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground">
                  No ratings submitted yet.
                  <Link to="/rate" className="text-primary hover:underline ml-1">
                    Submit the first rating!
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Ratings;
