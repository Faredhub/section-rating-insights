
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface RegistrationFormProps {
  onSuccess: () => void;
}

interface Year {
  id: string;
  name: string;
}

interface Semester {
  id: string;
  name: string;
  year_id: string;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface RegistrationNumber {
  id: string;
  registration_number: string;
}

const StudentRegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    registrationNumber: "",
    yearId: "",
    semesterId: "",
    sectionId: ""
  });

  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [registrationNumbers, setRegistrationNumbers] = useState<RegistrationNumber[]>([]);
  const [filteredRegNumbers, setFilteredRegNumbers] = useState<RegistrationNumber[]>([]);
  const [regSearchTerm, setRegSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    fetchYears();
    fetchRegistrationNumbers();
  }, []);

  // Filter registration numbers based on search
  useEffect(() => {
    const filtered = registrationNumbers.filter(reg =>
      reg.registration_number.toLowerCase().includes(regSearchTerm.toLowerCase())
    );
    setFilteredRegNumbers(filtered);
  }, [registrationNumbers, regSearchTerm]);

  // Fetch semesters when year changes
  useEffect(() => {
    if (formData.yearId) {
      fetchSemesters(formData.yearId);
      setFormData(prev => ({ ...prev, semesterId: "", sectionId: "" }));
    }
  }, [formData.yearId]);

  // Fetch sections when semester changes
  useEffect(() => {
    if (formData.semesterId) {
      fetchSections(formData.semesterId);
      setFormData(prev => ({ ...prev, sectionId: "" }));
    }
  }, [formData.semesterId]);

  const fetchYears = async () => {
    const { data } = await supabase.from("years").select("*").order("name");
    setYears(data || []);
  };

  const fetchSemesters = async (yearId: string) => {
    const { data } = await supabase
      .from("semesters")
      .select("*")
      .eq("year_id", yearId)
      .order("name");
    setSemesters(data || []);
  };

  const fetchSections = async (semesterId: string) => {
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("semester_id", semesterId)
      .order("name");
    setSections(data || []);
  };

  const fetchRegistrationNumbers = async () => {
    const { data } = await supabase
      .from("registration_numbers")
      .select("*")
      .eq("is_used", false)
      .order("registration_number");
    setRegistrationNumbers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.registrationNumber || !formData.yearId || !formData.semesterId || !formData.sectionId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // First, create the user account
      const redirectUrl = `${window.location.origin}/student-dashboard`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: redirectUrl }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create student profile
        const { error: profileError } = await supabase
          .from("student_profiles")
          .insert({
            user_id: authData.user.id,
            name: formData.name,
            registration_number: formData.registrationNumber,
            year_id: formData.yearId,
            semester_id: formData.semesterId,
            section_id: formData.sectionId
          });

        if (profileError) throw profileError;

        toast({
          title: "Registration Successful!",
          description: "Please check your email for verification instructions."
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>Create your student account with academic details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Registration Number</label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search registration number..."
                  value={regSearchTerm}
                  onChange={(e) => setRegSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={formData.registrationNumber} onValueChange={(value) => setFormData(prev => ({ ...prev, registrationNumber: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select registration number" />
                </SelectTrigger>
                <SelectContent>
                  {filteredRegNumbers.map((reg) => (
                    <SelectItem key={reg.id} value={reg.registration_number}>
                      {reg.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Year</label>
              <Select value={formData.yearId} onValueChange={(value) => setFormData(prev => ({ ...prev, yearId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Semester</label>
              <Select value={formData.semesterId} onValueChange={(value) => setFormData(prev => ({ ...prev, semesterId: value }))} disabled={!formData.yearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Section</label>
              <Select value={formData.sectionId} onValueChange={(value) => setFormData(prev => ({ ...prev, sectionId: value }))} disabled={!formData.semesterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentRegistrationForm;
