import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Star, 
  Eye, 
  Clock, 
  User,
  CheckCircle,
  AlertCircle,
  Award,
  Zap,
  Shield,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const badgeIcons: Record<string, { icon: any; label: string; color: string }> = {
  trusted: { icon: Award, label: "Trusted", color: "text-primary" },
  "fast-responder": { icon: Zap, label: "Fast Responder", color: "text-secondary" },
  "skill-master": { icon: Star, label: "Skill Master", color: "text-accent" },
  "fair-trader": { icon: Shield, label: "Fair Trader", color: "text-success" },
  "prerequisite-ready": { icon: CheckCircle, label: "Prerequisite Ready", color: "text-success" },
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        setCurrentUserId(user.id);

        const { data, error } = await supabase
          .from("requests")
          .select(`
            *,
            profiles (
              display_name,
              bio,
              reputation_score,
              completed_deals,
              response_time_hours,
              user_badges (
                badges (
                  name,
                  icon,
                  description
                )
              )
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        // Increment views
        await supabase
          .from("requests")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", id);

        setRequest(data);
      } catch (error) {
        console.error("Error fetching request:", error);
        toast({
          title: "Error",
          description: "Failed to load request details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const handleAcceptRequest = () => {
    toast({
      title: "Coming Soon",
      description: "Deal acceptance flow will be implemented next!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Request not found</p>
          <Button onClick={() => navigate("/marketplace")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === request.user_id;
  const badges = request.profiles?.user_badges?.map((ub: any) => ub.badges) || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="font-semibold">
                        {request.category}
                      </Badge>
                      <Badge variant="outline">{request.status}</Badge>
                    </div>
                    <CardTitle className="text-3xl mb-2">{request.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{request.views} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Offering in Return</h3>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 capitalize">
                          {request.offer_type}
                        </p>
                        <p className="text-xl font-bold text-primary">{request.offer_value}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {request.prerequisites && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        <h3 className="font-semibold text-lg">Prerequisites Required</h3>
                      </div>
                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                        <p className="text-muted-foreground">{request.prerequisites}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Requester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {request.profiles?.display_name || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      <span className="text-sm font-medium">
                        {request.profiles?.reputation_score?.toFixed(1) || "0.0"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({request.profiles?.completed_deals || 0} deals)
                      </span>
                    </div>
                  </div>
                </div>

                {request.profiles?.bio && (
                  <p className="text-sm text-muted-foreground">{request.profiles.bio}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Responds in ~{request.profiles?.response_time_hours || 24} hours</span>
                </div>

                {badges.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Badges</p>
                    <div className="space-y-2">
                      {badges.map((badge: any) => {
                        const BadgeIcon = badgeIcons[badge.name];
                        if (!BadgeIcon) return null;
                        return (
                          <div
                            key={badge.name}
                            className="flex items-start gap-2 p-2 bg-muted rounded-lg"
                          >
                            <BadgeIcon.icon className={`h-4 w-4 ${BadgeIcon.color} mt-0.5`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{BadgeIcon.label}</p>
                              <p className="text-xs text-muted-foreground">{badge.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Card */}
            {!isOwner && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button className="w-full" size="lg" onClick={handleAcceptRequest}>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Accept Request
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    This is your request
                  </p>
                  <Button variant="outline" className="w-full">
                    Edit Request
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Delete Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
