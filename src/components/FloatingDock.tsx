import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User, LogOut, ListChecks, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  { title: "Your Requests", url: "/your-requests", icon: FileText },
  { title: "Active Deals", url: "/active-deals", icon: ListChecks },
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
    <>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 md:block hidden">
        <TooltipProvider>
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-center mb-1">
              <ThemeToggle />
            </div>
            
            <div className="h-px w-8 bg-border self-center" />
            
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
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border max-[499px]:overflow-x-auto">
        <div className="flex items-center justify-around max-[499px]:justify-start max-[499px]:min-w-max px-2 py-3 max-w-screen-sm mx-auto">
          {dockItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all duration-200 max-[499px]:flex-shrink-0 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-[10px] font-medium max-[499px]:whitespace-nowrap">{item.title.split(' ')[0]}</span>
              </NavLink>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all duration-200 text-muted-foreground max-[499px]:flex-shrink-0"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[10px] font-medium max-[499px]:whitespace-nowrap">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
