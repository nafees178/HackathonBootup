import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const dockItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Marketplace", url: "/marketplace", icon: Search },
  { title: "Post Request", url: "/create-request", icon: Plus },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Profile", url: "/profile", icon: User },
];

export function FloatingDock() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <TooltipProvider>
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-lg flex flex-col gap-2">
          {dockItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 hover:bg-accent ${
                        isActive ? "bg-accent text-foreground" : "text-muted-foreground"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          <div className="h-px w-8 bg-border my-1 self-center" />
          
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
