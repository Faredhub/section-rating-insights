
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import StudentRegistrationForm from "@/components/StudentRegistrationForm";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { session, user, loading: authLoading } = useSupabaseAuth();

  // Redirect if logged in
  useEffect(() => {
    if (!authLoading && session && user) {
      navigate("/student-dashboard");
    }
  }, [session, user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login successful" });
      navigate("/student-dashboard");
    }
    setLoading(false);
  };

  const handleRegistrationSuccess = () => {
    toast({
      title: "Registration Complete!",
      description: "You can now log in with your credentials."
    });
  };

  // Prevent showing form while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4">
      {/* Admin Button in top right */}
      <div className="absolute top-4 right-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin-dashboard")}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Admin Dashboard
        </Button>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Faculty Rating System</h1>
          <p className="text-muted-foreground">Student Portal</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Student Login</TabsTrigger>
            <TabsTrigger value="register">Student Registration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Login to Your Account</CardTitle>
                <CardDescription>Enter your credentials to access the student portal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-medium">Email</label>
                    <Input
                      id="login-email"
                      placeholder="Enter your email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="login-password" className="text-sm font-medium">Password</label>
                    <Input
                      id="login-password"
                      placeholder="Enter your password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <StudentRegistrationForm onSuccess={handleRegistrationSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
