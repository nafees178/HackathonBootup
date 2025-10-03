import { Award, Zap, Star, Shield, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type BadgeType = "trusted" | "fast_responder" | "skill_master" | "fair_trader" | "prerequisite_ready";

interface BadgeDisplayProps {
  badges: BadgeType[];
  size?: "sm" | "md" | "lg";
}

const badgeConfig = {
  trusted: {
    icon: Star,
    label: "Trusted",
    description: "100% completion rate for 5+ deals",
    color: "text-yellow-500"
  },
  fast_responder: {
    icon: Zap,
    label: "Fast Responder",
    description: "Replies quickly to messages",
    color: "text-blue-500"
  },
  skill_master: {
    icon: Award,
    label: "Skill Master",
    description: "Multiple high ratings in one category",
    color: "text-purple-500"
  },
  fair_trader: {
    icon: Shield,
    label: "Fair Trader",
    description: "Helped resolve disputes as mediator",
    color: "text-green-500"
  },
  prerequisite_ready: {
    icon: CheckCircle,
    label: "Prerequisite Ready",
    description: "Always fulfills prerequisite tasks",
    color: "text-orange-500"
  }
};

export const BadgeDisplay = ({ badges, size = "md" }: BadgeDisplayProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => {
          const config = badgeConfig[badge];
          const Icon = config.icon;
          
          return (
            <Tooltip key={badge}>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1 cursor-help">
                  <Icon className={`${iconSize} ${config.color}`} />
                  {size !== "sm" && <span>{config.label}</span>}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
