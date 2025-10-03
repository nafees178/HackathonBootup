import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  requestType: string;
  offering: string;
  seeking: string;
  moneyAmount?: number;
  category: string;
  hasPrerequisite: boolean;
  createdAt: string;
  username: string;
  reputationScore: number;
}

const requestTypeLabels: Record<string, string> = {
  skill_for_skill: "Skill ↔ Skill",
  skill_for_item: "Skill ↔ Item",
  skill_for_money: "Skill ↔ Money",
  item_for_skill: "Item ↔ Skill",
  item_for_item: "Item ↔ Item",
  item_for_money: "Item ↔ Money",
};

export const RequestCard = ({
  id,
  title,
  description,
  requestType,
  offering,
  seeking,
  moneyAmount,
  category,
  hasPrerequisite,
  createdAt,
  username,
  reputationScore,
}: RequestCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-glow bg-gradient-to-br from-card to-card/50 backdrop-blur">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4 mb-3">
          <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 border-primary/20 bg-primary/5">
            {category}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{username}</span>
          </div>
          
          <div className="flex items-center gap-1 text-yellow-500">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">{reputationScore}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Offering</p>
            <p className="font-medium text-sm line-clamp-1">{offering}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Seeking</p>
            <p className="font-medium text-sm line-clamp-1">
              {seeking}
              {moneyAmount && <span className="block text-accent font-bold">₹{moneyAmount}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
            {requestTypeLabels[requestType] || requestType}
          </Badge>
          {hasPrerequisite && (
            <Badge variant="outline" className="gap-1 text-xs border-destructive/20 text-destructive">
              <AlertCircle className="h-3 w-3" />
              Prerequisites
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
        </div>
      </CardContent>

      <CardFooter className="relative">
        <Link to={`/request/${id}`} className="w-full">
          <Button className="w-full gap-2 group/btn relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              View Details
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
