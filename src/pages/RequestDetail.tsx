import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { ContactDialog } from "@/components/ContactDialog";
import { PendingDeals } from "@/components/PendingDeals";
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
  Loader2,
  MapPin,
  Calendar,
  Trash2,
  Edit2
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
  deadline: string | null;
  images: string[] | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    location: string | null;
    reputation_score: number;
    total_deals: number;
    completed_deals: number;
  };
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

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestData | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasExistingDeal, setHasExistingDeal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchRequest();
    }
  }, [id, currentUserId]);

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
            location,
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

      // Check if current user already has a deal for this request
      if (currentUserId && currentUserId !== requestData.user_id) {
        const { data: existingDeal } = await supabase
          .from("deals")
          .select("id")
          .eq("request_id", id)
          .eq("accepter_id", currentUserId)
          .maybeSingle();

        setHasExistingDeal(!!existingDeal);
      }

      setRequest(requestData);
      setBadges(badgesData.map((b) => b.badge_type));
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
      // Check if user has already expressed interest
      const { data: existingInterest, error: interestCheckError } = await supabase
        .from("request_interests")
        .select("id")
        .eq("request_id", request.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (interestCheckError) throw interestCheckError;

      if (existingInterest) {
        toast.error("You have already expressed interest in this request.");
        setAccepting(false);
        return;
      }

      // Check if request is still open
      const { data: currentRequest, error: checkError } = await supabase
        .from("requests")
        .select("status")
        .eq("id", request.id)
        .single();

      if (checkError) throw checkError;
      
      if (currentRequest.status !== "open") {
        toast.error("This request is no longer available.");
        navigate("/marketplace");
        return;
      }

      // Create interest entry (request stays open for multiple interests)
      const { error: interestError } = await supabase
        .from("request_interests")
        .insert([{
          request_id: request.id,
          user_id: currentUserId,
          status: "pending",
        }]);

      if (interestError) throw interestError;

      toast.success("Interest expressed! The poster will review your application.");
      navigate("/marketplace");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!request || !isOwnRequest) return;

    if (!confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("requests")
        .delete()
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Request deleted successfully");
      navigate("/marketplace");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
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
    );
  }

  const isOwnRequest = currentUserId === request.user_id;
  const completionRate = request.profiles.total_deals > 0
    ? Math.round((request.profiles.completed_deals / request.profiles.total_deals) * 100)
    : 0;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-3">
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2 flex-1">{request.title}</CardTitle>
                    {isOwnRequest && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          onClick={() => navigate(`/create-request?edit=${request.id}`)}
                        >
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-destructive hover:text-destructive"
                          onClick={handleDeleteRequest}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-base px-4 py-1">{request.category}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <Badge>{requestTypeLabels[request.request_type]}</Badge>
                {request.status === "open" ? (
                  <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Open</Badge>
                ) : (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-6">
              {request.images && request.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {request.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Request image ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{request.description}</p>
              </div>

              {request.deadline && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-lg border">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Deadline:</span>
                  <span>{new Date(request.deadline).toLocaleDateString()} at {new Date(request.deadline).toLocaleTimeString()}</span>
                </div>
              )}

              {(request.pickup_location || request.dropoff_location) && (
                <div className="space-y-2">
                  {request.pickup_location && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-lg border">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium block">Pickup Location:</span>
                        <span className="text-muted-foreground">{request.pickup_location}</span>
                      </div>
                    </div>
                  )}
                  {request.dropoff_location && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-lg border">
                      <MapPin className="h-4 w-4 text-accent mt-0.5" />
                      <div>
                        <span className="font-medium block">Dropoff Location:</span>
                        <span className="text-muted-foreground">{request.dropoff_location}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-6 w-6 text-primary" />
                  <h4 className="font-bold text-xl">What I'm Offering</h4>
                </div>
                <p className="text-lg font-medium">
                  {request.offering}
                </p>
                {request.money_amount && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-3xl font-bold text-primary">₹{request.money_amount}</span>
                  </div>
                )}
              </div>

              {request.has_prerequisite && request.prerequisite_description && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Prerequisites Required</h4>
                        <p className="text-sm text-muted-foreground">{request.prerequisite_description}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Posted By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${request.profiles.id}`)}
              >
                <Avatar className="h-16 w-16">
                  <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{request.profiles.username}</p>
                  {request.profiles.full_name && <p className="text-sm text-muted-foreground">{request.profiles.full_name}</p>}
                  {request.profiles.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{request.profiles.location}</span>
                    </div>
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
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-bold">{request.profiles.completed_deals}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-success">{completionRate}%</span>
                </div>
              </div>

              <Separator />

              {!isOwnRequest && request.status === "open" && (
                <div className="space-y-3">
                  {hasExistingDeal ? (
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm font-medium">Already Requested</p>
                      <p className="text-xs text-muted-foreground mt-1">You've already expressed interest in this request</p>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleAcceptRequest} 
                      disabled={accepting}
                      className="w-full gap-2"
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
                  <ContactDialog
                    receiverId={request.user_id}
                    receiverUsername={request.profiles.username}
                    requestId={request.id}
                    requestTitle={request.title}
                  />
                </div>
              )}

              {isOwnRequest && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">This is your request</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isOwnRequest && <PendingDeals requestId={request.id} />}
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
