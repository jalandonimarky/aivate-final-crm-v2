import { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  Briefcase, 
  CheckSquare, 
  BarChart3,
  Settings,
  LogOut,
  KanbanSquare,
  AppWindow // Import AppWindow icon
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRMData } from "@/hooks/useCRMData";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Project Management", url: "/kanban", icon: KanbanSquare }, // New Kanban item
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Deals", url: "/deals", icon: Briefcase },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Reporting", url: "/analytics", icon: BarChart3 }, // Changed from Analytics to Reporting
  { title: "Web Applications", url: "/web-applications", icon: AppWindow },
];

export function AppSidebar() {
  const { state, setState, isPinned } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();
  const { profiles } = useCRMData();
  const currentPath = location.pathname;

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } = {} } = await supabase.auth.getUser(); // Destructure with default empty object
      if (user) {
        const profile = profiles.find(p => p.id === user.id); // Changed from p.user_id to p.id
        setCurrentUserProfile(profile);
      }
    };
    fetchUser();
  }, [profiles]);

  const handleMouseEnter = () => {
    if (!isPinned) {
      setState('expanded');
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setState('collapsed');
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClasses = (active: boolean) =>
    active 
      ? "bg-accent text-accent-foreground font-medium shadow-glow" // Changed to bg-accent and text-accent-foreground
      : "hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"; // Changed hover styles

  const handleLogoClick = () => {
    window.location.reload(); // Force a full page reload
  };

  return (
    <>
      {!isPinned && (
        <div
          onMouseEnter={handleMouseEnter}
          className="fixed top-0 left-0 h-full w-4 z-30"
        />
      )}
      <Sidebar
        onMouseLeave={handleMouseLeave}
        className={cn(
          "w-64 bg-gradient-card border-r border-border/50 transition-transform duration-300 ease-in-out",
          "fixed top-0 left-0 h-full z-40",
          state === "collapsed" ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <SidebarContent className="p-4 flex flex-col">
          {/* Logo */}
          <div className="mb-8">
            <a href="/" onClick={handleLogoClick} className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0636/9768/2537/files/AIVATE_2.png?v=1752900464" 
                alt="Aivate Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="font-cloud text-xl font-bold text-gray-900 dark:text-white">
                Aivate
              </span>
            </a>
          </div>

          {/* Main Navigation */}
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel>
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${getNavClasses(isActive(item.url))}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}