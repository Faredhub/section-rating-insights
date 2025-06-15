
import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Faculty {
  id: string;
  name: string;
  department: string;
  email: string;
  position: string;
  created_at: string;
}

const Faculty = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    email: "",
    position: "",
  });

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
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching faculty", description: error.message, variant: "destructive" });
    } else {
      setFaculty(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingFaculty) {
      const { error } = await supabase
        .from("faculty")
        .update(formData)
        .eq("id", editingFaculty.id);

      if (error) {
        toast({ title: "Error updating faculty", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Faculty updated successfully" });
        fetchFaculty();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("faculty")
        .insert([formData]);

      if (error) {
        toast({ title: "Error adding faculty", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Faculty added successfully" });
        fetchFaculty();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("faculty")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting faculty", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Faculty deleted successfully" });
      fetchFaculty();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", department: "", email: "", position: "" });
    setEditingFaculty(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (facultyMember: Faculty) => {
    setEditingFaculty(facultyMember);
    setFormData({
      name: facultyMember.name,
      department: facultyMember.department,
      email: facultyMember.email,
      position: facultyMember.position,
    });
    setIsDialogOpen(true);
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
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Faculty Management</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFaculty ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
                <DialogDescription>
                  {editingFaculty ? "Update faculty information" : "Enter faculty details below"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingFaculty ? "Update" : "Add"} Faculty
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculty.map((facultyMember) => (
            <Card key={facultyMember.id}>
              <CardHeader>
                <CardTitle>{facultyMember.name}</CardTitle>
                <CardDescription>{facultyMember.position}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Department:</strong> {facultyMember.department}</p>
                  <p><strong>Email:</strong> {facultyMember.email}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(facultyMember)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(facultyMember.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {faculty.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No faculty members found. Add some to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Faculty;
