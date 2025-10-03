import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Zap, Award, User, Eye, Clock, CheckCircle, Shield, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  offerType: string;
  offerValue: string;
  category: string;
  prerequisites?: string | null;
  views: number;
  createdAt: string;
  userName: string;
  reputation: number;
  completedDeals: number;
  badges: string[];
}

const badgeIcons: Record<string, { icon: any; label: string; color: string }> = {
  trusted: { icon: Award, label: "Trusted", color: "text-primary" },
  "fast-responder": { icon: Zap, label: "Fast", color: "text-secondary" },
  "skill-master": { icon: Star, label: "Master", color: "text-accent" },
  "fair-trader": { icon: Shield, label: "Fair", color: "text-success" },
  "prerequisite-ready": { icon: CheckCircle, label: "Ready", color: "text-success" },
};

const offerTypeColors: Record<string, string> = {
  skill: "bg-primary/10 text-primary border-primary/20",
  item: "bg-secondary/10 text-secondary border-secondary/20",
  money: "bg-success/10 text-success border-success/20",
};

export const RequestCard = ({
  id,
  title,
  description,
  offerType,
  offerValue,
  category,
  prerequisites,
  views,
  createdAt,
  userName,
  reputation,
  completedDeals,
  badges,
}: RequestCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 animate-fade-in hover:scale-[1.02] cursor-pointer group" onClick={() => navigate(`/request/${id}`)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="font-semibold">{category}</Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span className="text-xs">{views}</span>
          </div>
        </div>
        
        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userName}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-secondary text-secondary" />
              <span className="text-xs text-muted-foreground">
                {reputation.toFixed(1)} ({completedDeals} deals)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {description}
        </p>

        {prerequisites && (
          <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-warning">Prerequisites Required</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{prerequisites}</p>
            </div>
          </div>
        )}
        
        <div className={`rounded-lg p-3 border ${offerTypeColors[offerType] || "bg-muted/50"}`}>
          <p className="text-xs font-medium mb-1 opacity-80">Offering in Return</p>
          <p className="font-bold text-sm">{offerValue}</p>
          <p className="text-xs capitalize mt-1 opacity-70">{offerType}</p>
        </div>

        {badges.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {badges.slice(0, 3).map((badge) => {
              const BadgeIcon = badgeIcons[badge];
              if (!BadgeIcon) return null;
              return (
                <div
                  key={badge}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-full"
                  title={BadgeIcon.label}
                >
                  <BadgeIcon.icon className={`h-3 w-3 ${BadgeIcon.color}`} />
                  <span className="text-muted-foreground">{BadgeIcon.label}</span>
                </div>
              );
            })}
            {badges.length > 3 && (
              <span className="text-xs text-muted-foreground">+{badges.length - 3}</span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
        </div>
        <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground" onClick={(e) => {
          e.stopPropagation();
          navigate(`/request/${id}`);
        }}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};