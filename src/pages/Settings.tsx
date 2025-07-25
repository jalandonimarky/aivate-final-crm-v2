import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/theme/ModeToggle";
import type { Profile } from "@/types/crm";
import { useTheme } from "next-themes"; // Import useTheme
import { cn } from "@/lib/utils"; // Import cn

// Zod schema for profile updates
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

// Zod schema for password updates
const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const { theme } = useTheme(); // Get current theme

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    const fetchOrCreateUserProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        toast({
          title: "Error",
          description: userError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url, role, created_at, updated_at")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          toast({
            title: "Error",
            description: profileError.message,
            variant: "destructive",
          });
        } else if (profileData) {
          setUserProfile(profileData as Profile);
          profileForm.reset({
            firstName: profileData.first_name || "",
            lastName: profileData.last_name || "",
            email: profileData.email,
          });
        } else {
          const { data: newProfileData, error: createProfileError } = await supabase
            .from("profiles")
            .insert({ 
              id: user.id,
              email: user.email || "",
              first_name: user.user_metadata?.first_name || "",
              last_name: user.user_metadata?.last_name || "",
            })
            .select("id, first_name, last_name, email, avatar_url, role, created_at, updated_at")
            .single();

          if (createProfileError) {
            toast({
              title: "Error creating profile",
              description: createProfileError.message,
              variant: "destructive",
            });
          } else if (newProfileData) {
            setUserProfile(newProfileData as Profile);
            profileForm.reset({
              firstName: newProfileData.first_name || "",
              lastName: newProfileData.last_name || "",
              email: newProfileData.email,
            });
            toast({
              title: "Profile Created",
              description: "A new profile has been created for your account.",
            });
          }
        }
      }
      setLoading(false);
    };

    fetchOrCreateUserProfile();
  }, [toast, profileForm]);

  const handleProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated.");

      if (values.email !== userProfile?.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: values.email,
        });
        if (emailUpdateError) throw emailUpdateError;
        toast({
          title: "Email Update",
          description: "Your email has been updated. Please check your new email for a confirmation link.",
        });
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ first_name: values.firstName, last_name: values.lastName, email: values.email })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      const { data: profileData, error: refetchError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();
      if (refetchError) throw refetchError;
      setUserProfile(profileData as Profile);
      profileForm.reset({
        firstName: profileData?.first_name || "",
        lastName: profileData?.last_name || "",
        email: profileData?.email || "",
      });

    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className={cn(
          "text-3xl font-bold mb-6",
          theme === "dark" ? "text-primary" : "text-accent" // Conditional text color
        )}>
          Settings
        </h1>
        <Skeleton className="h-24 w-full mb-6" />
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Theme Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className={cn(
        "text-3xl font-bold mb-6",
        theme === "dark" ? "text-primary" : "text-accent" // Conditional text color
      )}>
        Settings
      </h1>

      {/* Profile Settings Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...profileForm.register("firstName")} />
                {profileForm.formState.errors.firstName && (
                  <p className="text-destructive text-sm">{profileForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...profileForm.register("lastName")} />
                {profileForm.formState.errors.lastName && (
                  <p className="text-destructive text-sm">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...profileForm.register("email")} />
              {profileForm.formState.errors.email && (
                <p className="text-destructive text-sm">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-gradient-primary" disabled={loading}>
                {loading ? "Saving..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Change Password Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-destructive text-sm">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" {...passwordForm.register("confirmNewPassword")} />
              {passwordForm.formState.errors.confirmNewPassword && (
                <p className="text-destructive text-sm">{passwordForm.formState.errors.confirmNewPassword.message}</p>
                )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-gradient-primary" disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Theme Settings Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Theme Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="text-base">Dark Mode</Label>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}