import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(""); // New state for first name
  const [lastName, setLastName] = useState("");   // New state for last name
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Password reset email sent",
          description: "Check your email for a link to reset your password.",
        });
        setIsForgotPassword(false);
        setIsLogin(true);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({
          title: "Logged in successfully",
          description: "Welcome back!",
        });
      } else {
        // --- REMOVED DOMAIN VALIDATION ---
        // if (!email.endsWith("@aivate.net")) {
        //   toast({
        //     title: "Registration Error",
        //     description: "Only @aivate.net email addresses are allowed for registration.",
        //     variant: "destructive",
        //   });
        //   setLoading(false);
        //   return;
        // }
        // --- END REMOVED DOMAIN VALIDATION ---

        // For sign-up, pass first_name and last_name in user_metadata
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        if (error) throw error;

        // Profile creation is now handled by a Supabase database trigger (handle_new_user function)
        // No need to manually insert into profiles table here.

        toast({
          title: "Signed up successfully",
          description: "Please check your email to confirm your account.",
        });
        setIsLogin(true); // <--- Added this line to switch to login view
      }
    } catch (error: any) {
      toast({
        title: isForgotPassword ? "Password Reset Error" : "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleModeSwitch = (mode: 'login' | 'signup' | 'forgot') => {
    resetForm();
    setIsLogin(mode === 'login');
    setIsForgotPassword(mode === 'forgot');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-medium">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {isForgotPassword ? "Reset Password" : (isLogin ? "AIVate CRM" : "Join AIVate CRM")}
          </CardTitle>
          <p className="text-muted-foreground">
            {isForgotPassword 
              ? "Enter your email to receive a password reset link" 
              : (isLogin ? "Sign in to your account" : "Create your account")
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="grid grid-cols-2 gap-4"> {/* Use grid for first/last name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={loading}>
              {loading 
                ? (isForgotPassword ? "Sending..." : (isLogin ? "Signing In..." : "Signing Up..."))
                : (isForgotPassword ? "Send Reset Link" : (isLogin ? "Sign In" : "Sign Up"))
              }
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm space-y-2">
            {isForgotPassword ? (
              <Button variant="link" onClick={() => handleModeSwitch('login')} className="p-0 h-auto text-primary">
                Back to Sign In
              </Button>
            ) : isLogin ? (
              <>
                <div>
                  Don't have an account?{" "}
                  <Button variant="link" onClick={() => handleModeSwitch('signup')} className="p-0 h-auto bg-gradient-primary bg-clip-text text-transparent">
                    Sign Up
                  </Button>
                </div>
                <div>
                  <Button variant="link" onClick={() => handleModeSwitch('forgot')} className="p-0 h-auto text-muted-foreground hover:text-primary">
                    Forgot your password?
                  </Button>
                </div>
              </>
            ) : (
              <div>
                Already have an account?{" "}
                <Button variant="link" onClick={() => handleModeSwitch('login')} className="p-0 h-auto text-primary">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}