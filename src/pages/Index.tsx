
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="max-w-md w-full mx-auto bg-white dark:bg-zinc-900 p-8 border rounded-lg shadow flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-center">Welcome to the Faculty Ratings App</h1>
      <p className="text-center text-muted-foreground">
        Login or sign up to start rating your faculty and view ratings!
      </p>
      <Button asChild size="lg">
        <Link to="/auth">Login / Sign Up</Link>
      </Button>
    </div>
  </div>
);

export default Index;
