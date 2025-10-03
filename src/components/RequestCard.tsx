import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, ArrowRight, AlertCircle, MapPin } from "lucide-react";
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
  location?: string;
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
  location,
}: RequestCardProps) => {
  return (
    <Card className="hover:border-primary/50 transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-3">
          <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
          <Badge variant="outline">{category}</Badge>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{username}</span>
          </div>
          <span className="text-xs">★ {reputationScore}</span>
        </div>

        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Offering</p>
            <p className="font-medium text-xs line-clamp-1">{offering}</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Seeking</p>
            <p className="font-medium text-xs line-clamp-1">
              {seeking}
              {moneyAmount && <span className="block text-primary">₹{moneyAmount}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {requestTypeLabels[requestType]}
          </Badge>
          {hasPrerequisite && (
            <Badge variant="outline" className="gap-1 text-xs text-destructive border-destructive/20">
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

      <CardFooter>
        <Link to={`/request/${id}`} className="w-full">
          <Button className="w-full gap-2" size="sm">
            View Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
