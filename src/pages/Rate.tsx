
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Faculty {
  id: string;
  name: string;
  department: string;
  position: string;
}

const Rate = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFaculty();
    }
  }, [user]);

  const fetchFaculty = async () => {
    const { data, error } = await supabase
      .from("faculty")
      .select("id, name, department, position")
      .order("name");

    if (error) {
      toast({ title: "Error fetching faculty", description: error.message, variant: "destructive" });
    } else {
      setFaculty(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFaculty || rating === 0) {
      toast({ title: "Please select faculty and rating", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("ratings")
      .insert([{
        faculty_id: selectedFaculty,
        user_id: user?.id,
        rating,
        comment,
      }]);

    setSubmitting(false);

    if (error) {
      toast({ title: "Error submitting rating", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rating submitted successfully" });
      setSelectedFaculty("");
      setRating(0);
      setComment("");
    }
  };

  const StarRating = ({ rating, onRatingChange, onHover, hoverRating }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    onHover: (rating: number) => void;
    hoverRating: number;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Rate Faculty</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Submit Faculty Rating</CardTitle>
            <CardDescription>
              Share your experience and help others by rating faculty members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="faculty">Select Faculty</Label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((facultyMember) => (
                      <SelectItem key={facultyMember.id} value={facultyMember.id}>
                        {facultyMember.name} - {facultyMember.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  onHover={setHoverRating}
                  hoverRating={hoverRating}
                />
                <p className="text-sm text-muted-foreground">
                  {rating > 0 && (
                    <>
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts about this faculty member..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {faculty.length === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">
                No faculty members available for rating. 
                <Link to="/faculty" className="text-primary hover:underline ml-1">
                  Add some faculty first
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Rate;
