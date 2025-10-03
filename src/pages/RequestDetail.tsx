import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Star, 
  AlertCircle, 
  Package, 
  DollarSign,
  CheckCircle,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RequestData {
  id: string;
  title: string;
  description: string;
  request_type: string;
  offering: string;
  seeking: string;
  money_amount: number | null;
  category: string;
  status: string;
  has_prerequisite: boolean;
  prerequisite_description: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    reputation_score: number;
    total_deals: number;
    completed_deals: number;
  };
}

interface UserBadge {
  badge_type: string;
}

const requestTypeLabels: Record<string, string> = {
  skill_for_skill: "Skill ↔ Skill",
  skill_for_item: "Skill ↔ Item",
  skill_for_money: "Skill ↔ Money",
  item_for_skill: "Item ↔ Skill",
  item_for_item: "Item ↔ Item",
  item_for_money: "Item ↔ Money",
};

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestData | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequest();
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchRequest = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            reputation_score,
            total_deals,
            completed_deals
          )
        `)
        .eq("id", id)
        .single();

      if (requestError) throw requestError;

      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select("badge_type")
        .eq("user_id", requestData.user_id);

      if (badgesError) throw badgesError;

      setRequest(requestData);
      setBadges(badgesData.map((b: UserBadge) => b.badge_type));
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    if (!request) return;

    setAccepting(true);
    try {
      const { error } = await supabase.from("deals").insert([{
        request_id: request.id,
        requester_id: request.user_id,
        accepter_id: currentUserId,
        status: request.has_prerequisite ? "prerequisite_pending" : "active",
      }] as any);

      if (error) throw error;

      toast.success("Deal initiated! The requester will be notified.");
      navigate("/marketplace");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Request not found</p>
              <Button onClick={() => navigate("/marketplace")} className="mt-4">
                Back to Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnRequest = currentUserId === request.user_id;
  const completionRate = request.profiles.total_deals > 0
    ? Math.round((request.profiles.completed_deals / request.profiles.total_deals) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{request.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Posted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {request.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className="text-sm px-3 py-1">
                    {requestTypeLabels[request.request_type]}
                  </Badge>
                  {request.status === "open" ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Open
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Offering</h4>
                    </div>
                    <p className="text-lg">{request.offering}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-accent" />
                      <h4 className="font-semibold">Seeking</h4>
                    </div>
                    <p className="text-lg">
                      {request.seeking}
                      {request.money_amount && (
                        <span className="block text-2xl font-bold text-accent mt-1">
                          ₹{request.money_amount}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {request.has_prerequisite && request.prerequisite_description && (
                  <>
                    <Separator />
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold mb-2">Prerequisites Required</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {request.prerequisite_description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - User Info */}
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">Posted By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-primary/10">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-bold">{request.profiles.username}</p>
                    {request.profiles.full_name && (
                      <p className="text-sm text-muted-foreground">{request.profiles.full_name}</p>
                    )}
                  </div>
                </div>

                {badges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Badges</p>
                    <BadgeDisplay badges={badges as any} />
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reputation</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold">{request.profiles.reputation_score}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Deals</span>
                    <span className="font-bold">{request.profiles.completed_deals}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-bold text-success">{completionRate}%</span>
                  </div>
                </div>

                <Separator />

                {!isOwnRequest && request.status === "open" && (
                  <Button
                    onClick={handleAcceptRequest}
                    className="w-full gap-2 h-12 text-lg"
                    disabled={accepting}
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Accept Request
                      </>
                    )}
                  </Button>
                )}

                {isOwnRequest && (
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">This is your request</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
