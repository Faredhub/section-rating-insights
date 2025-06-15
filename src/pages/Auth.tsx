
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { session, user, loading: authLoading } = useSupabaseAuth();

  // Redirect if logged in
  useEffect(() => {
    if (!authLoading && session && user) {
      navigate("/");
    }
  }, [session, user, authLoading, navigate]);

  const toggleMode = () => setIsLogin((m) => !m);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Login successful" });
        // navigate("/") is handled by the effect above upon login state change
      }
    } else {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) {
        toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sign Up successful", description: "Please check your email for verification instructions." });
        setIsLogin(true);
      }
    }
    setLoading(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-white dark:bg-zinc-900 border rounded-lg p-6 w-full max-w-md shadow space-y-4">
        <h2 className="text-xl font-semibold mb-2">{isLogin ? "Log In" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            name="email"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <Input
            name="password"
            placeholder="Password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : isLogin ? "Log In" : "Sign Up"}
          </Button>
        </form>
        <button
          onClick={toggleMode}
          className="text-xs mt-2 underline-offset-2 underline text-muted-foreground"
          type="button"
          disabled={loading}
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;

