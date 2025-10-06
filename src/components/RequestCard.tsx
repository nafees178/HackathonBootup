import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, ArrowRight, AlertCircle, MapPin, Edit2, Trash2 } from "lucide-react";
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
  deadline?: string;
  userId: string;
  username: string;
  reputationScore: number;
  location?: string;
  onEdit?: (requestId: string) => void;
  onDelete?: (requestId: string) => void;
  showActions?: boolean;
}

const requestTypeLabels: Record<string, string> = {
  skill_for_skill: "Skill ↔ Skill",
  skill_for_item: "Skill ↔ Item",
  skill_for_money: "Skill ↔ Money",
  item_for_skill: "Item ↔ Skill",
  item_for_item: "Item ↔ Item",
  item_for_money: "Item ↔ Money",
  money_for_skill: "Money ↔ Skill",
  money_for_item: "Money ↔ Item",
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
  deadline,
  userId,
  username,
  reputationScore,
  location,
  onEdit,
  onDelete,
  showActions = false,
}: RequestCardProps) => {
  return (
    <Card className="card-hover border-2 group rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="text-xs mb-2 rounded-full">{category}</Badge>
            <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {title}
            </CardTitle>
          </div>
          {showActions && onEdit && onDelete && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(id);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>

        <div className="flex items-center gap-3 text-sm">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => window.location.href = `/profile/${userId}`}
          >
            <Avatar className="h-7 w-7 border-2 border-border">
              <AvatarFallback className="text-xs bg-muted">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground text-xs">{username}</span>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
            <span className="text-xs text-muted-foreground">★</span>
            <span className="text-xs font-semibold">{reputationScore}</span>
          </div>
        </div>

        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Offering</p>
          <p className="font-bold text-base text-foreground">
            {offering}
          </p>
          {moneyAmount && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-primary font-bold text-xl">₹{moneyAmount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] rounded-full border-primary/30 bg-primary/5">
            {requestTypeLabels[requestType]}
          </Badge>
          {hasPrerequisite && (
            <Badge variant="outline" className="gap-1 text-[10px] rounded-full text-destructive border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-3 w-3" />
              Prerequisites
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
          {deadline && (
            <div className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>Due: {formatDistanceToNow(new Date(deadline), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Link to={`/request/${id}`} className="w-full">
          <Button className="w-full gap-2 rounded-xl" size="sm">
            View Details
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
