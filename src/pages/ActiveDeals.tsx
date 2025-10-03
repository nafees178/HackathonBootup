import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, User, Star, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Deal {
  id: string;
  status: string;
  requester_task_completed: boolean;
  accepter_task_completed: boolean;
  requester_verified_accepter: boolean;
  accepter_verified_requester: boolean;
  prerequisite_completed: boolean;
  cancellation_requested_by: string | null;
  cancellation_agreed: boolean;
  created_at: string;
  request_id: string;
  requester_id: string;
  accepter_id: string;
  requests: {
    title: string;
    description: string;
    offering: string;
    seeking: string;
    has_prerequisite: boolean;
    prerequisite_description: string | null;
  };
  requester_profile: {
    id: string;
    username: string;
    reputation_score: number;
  };
  accepter_profile: {
    id: string;
    username: string;
    reputation_score: number;
  };
  reviews?: Array<{ reviewer_id: string }>;
}

export default function ActiveDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [dealToCancel, setDealToCancel] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchActiveDeals();
    }
  }, [currentUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchActiveDeals = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          requests (title, description, offering, seeking, has_prerequisite, prerequisite_description),
          requester_profile:requester_id (id, username, reputation_score),
          accepter_profile:accepter_id (id, username, reputation_score)
        `)
        .or(`requester_id.eq.${currentUserId},accepter_id.eq.${currentUserId}`)
        .in("status", ["prerequisite_pending", "active"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch reviews for each deal to check if user has already rated
      const dealsWithReviews = await Promise.all(
        (data || []).map(async (deal) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("reviewer_id")
            .eq("deal_id", deal.id);
          return { ...deal, reviews: reviews || [] };
        })
      );

      setDeals(dealsWithReviews as any);
    } catch (error) {
      console.error("Error fetching active deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (dealId: string, isRequester: boolean) => {
    try {
      const field = isRequester ? "requester_task_completed" : "accepter_task_completed";
      const { error } = await supabase
        .from("deals")
        .update({ [field]: true })
        .eq("id", dealId);

      if (error) throw error;

      toast.success("Your task marked as complete!");
      fetchActiveDeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerify = async (dealId: string, isRequester: boolean) => {
    try {
      const verifyField = isRequester ? "requester_verified_accepter" : "accepter_verified_requester";
      const { error } = await supabase
        .from("deals")
        .update({ [verifyField]: true })
        .eq("id", dealId);

      if (error) throw error;

      // Check if both verified
      const { data: updatedDeal } = await supabase
        .from("deals")
        .select("*")
        .eq("id", dealId)
        .single();

      const bothVerified = updatedDeal?.requester_verified_accepter && updatedDeal?.accepter_verified_requester;

      if (bothVerified) {
        toast.success("Both parties verified! Redirecting to rating page...");
        setTimeout(() => navigate(`/rate-deal/${dealId}`), 1000);
      } else {
        toast.success("Verification recorded!");
        fetchActiveDeals();
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelRequest = async (dealId: string) => {
    try {
      const deal = deals.find(d => d.id === dealId);
      if (!deal) return;

      // If this is the first cancellation request
      if (!deal.cancellation_requested_by) {
        const { error } = await supabase
          .from("deals")
          .update({ cancellation_requested_by: currentUserId })
          .eq("id", dealId);

        if (error) throw error;
        
        toast.success("Cancellation request sent. Waiting for the other party to agree.");
        setCancelDialogOpen(false);
        setDealToCancel(null);
        fetchActiveDeals();
        return;
      }

      // If the other party agrees to cancellation
      if (deal.cancellation_requested_by !== currentUserId) {
        const { error: updateError } = await supabase
          .from("deals")
          .update({ 
            status: "cancelled",
            cancellation_agreed: true 
          })
          .eq("id", dealId);

        if (updateError) throw updateError;

        // Update request status back to open
        await supabase
          .from("requests")
          .update({ status: "open" })
          .eq("id", deal.request_id);

        toast.success("Deal cancelled by mutual agreement. You can now rate each other.");
        setTimeout(() => navigate(`/rate-deal/${dealId}`), 1000);
        setCancelDialogOpen(false);
        setDealToCancel(null);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelCancellationRequest = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ cancellation_requested_by: null })
        .eq("id", dealId);

      if (error) throw error;
      
      toast.success("Cancellation request withdrawn.");
      fetchActiveDeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openCancelDialog = (dealId: string) => {
    setDealToCancel(dealId);
    setCancelDialogOpen(true);
  };

  const handlePrerequisiteComplete = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ 
          prerequisite_completed: true,
          status: "active"
        })
        .eq("id", dealId);

      if (error) throw error;
      toast.success("Prerequisites marked as complete! Deal is now active.");
      fetchActiveDeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Active Deals</h1>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No active deals yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {deals.map((deal) => {
            const isRequester = deal.requester_id === currentUserId;
            const otherParty = isRequester ? deal.accepter_profile : deal.requester_profile;
            const myTaskCompleted = isRequester ? deal.requester_task_completed : deal.accepter_task_completed;
            const otherTaskCompleted = isRequester ? deal.accepter_task_completed : deal.requester_task_completed;
            const myVerification = isRequester ? deal.requester_verified_accepter : deal.accepter_verified_requester;
            const otherVerification = isRequester ? deal.accepter_verified_requester : deal.requester_verified_accepter;
            const bothTasksComplete = myTaskCompleted && otherTaskCompleted;
            const bothVerified = myVerification && otherVerification;
            const hasRated = deal.reviews?.some(r => r.reviewer_id === currentUserId) || false;
            const iCancelledRequested = deal.cancellation_requested_by === currentUserId;
            const otherCancelRequested = deal.cancellation_requested_by && !iCancelledRequested;

            return (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{deal.requests.title}</CardTitle>
                      <Badge variant={deal.status === "active" ? "default" : "secondary"}>
                        {deal.status === "prerequisite_pending" ? "Prerequisites Pending" : "Active"}
                      </Badge>
                    </div>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/profile/${otherParty.id}`)}
                    >
                      <Avatar>
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{otherParty.username}</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{otherParty.reputation_score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {isRequester ? "You're offering" : "They're offering"}
                      </p>
                      <p className="font-medium">{deal.requests.offering}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {isRequester ? "You're seeking" : "They're seeking"}
                      </p>
                      <p className="font-medium">{deal.requests.seeking}</p>
                    </div>
                  </div>

                  {deal.status === "prerequisite_pending" && deal.requests.has_prerequisite && (
                    <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-4">
                      <div>
                        <p className="font-semibold mb-2">Prerequisites Required:</p>
                        <p className="text-sm">{deal.requests.prerequisite_description}</p>
                      </div>
                      {!deal.prerequisite_completed && (
                        <Button 
                          onClick={() => handlePrerequisiteComplete(deal.id)}
                          className="w-full"
                        >
                          Mark Prerequisites as Complete
                        </Button>
                      )}
                      {deal.prerequisite_completed && (
                        <p className="text-sm text-success flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Prerequisites completed! Deal is active.
                        </p>
                      )}
                    </div>
                  )}

                  {deal.status === "active" && (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Task Progress</h3>
                        
                        {/* My Task */}
                        <div className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Your Task</span>
                            {myTaskCompleted ? (
                              <Badge className="bg-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => handleMarkComplete(deal.id, isRequester)}
                              >
                                Mark as Complete
                              </Button>
                            )}
                          </div>
                          {myTaskCompleted && (
                            <p className="text-sm text-muted-foreground">
                              {otherVerification ? "✓ Verified by " + otherParty.username : "Waiting for verification"}
                            </p>
                          )}
                        </div>

                        {/* Other Party's Task */}
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{otherParty.username}'s Task</span>
                            {otherTaskCompleted ? (
                              <Badge className="bg-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </div>
                          {otherTaskCompleted && !myVerification && (
                            <Button 
                              size="sm"
                              onClick={() => handleVerify(deal.id, isRequester)}
                              className="w-full mt-2 gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Verify Completion
                            </Button>
                          )}
                          {myVerification && (
                            <p className="text-sm text-success mt-2">
                              ✓ You verified their completion
                            </p>
                          )}
                        </div>

                        {otherTaskCompleted && !myVerification && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-sm text-center">
                              {otherParty.username} marked their task complete! Verify their work.
                            </p>
                          </div>
                        )}

                        {bothTasksComplete && myVerification && otherVerification && (
                          <div className="space-y-3 p-4 rounded-lg border border-success/20 bg-success/5">
                            <h3 className="font-semibold flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-success" />
                              {hasRated ? "Already rated!" : "All verified! Ready to rate"}
                            </h3>
                            {!hasRated && (
                              <Button 
                                onClick={() => navigate(`/rate-deal/${deal.id}`)}
                                className="w-full"
                              >
                                Rate & Complete Deal
                              </Button>
                            )}
                            {hasRated && (
                              <p className="text-sm text-center text-muted-foreground">
                                Waiting for {otherParty.username} to rate
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {otherCancelRequested && (
                        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                          <p className="font-semibold text-destructive">
                            {otherParty.username} has requested to cancel this deal
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              variant="destructive"
                              onClick={() => handleCancelRequest(deal.id)}
                              className="flex-1"
                            >
                              Agree to Cancel
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleCancelCancellationRequest(deal.id)}
                              className="flex-1"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}

                      {iCancelledRequested && (
                        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-3">
                          <p className="font-semibold">
                            Waiting for {otherParty.username} to agree to cancellation
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => handleCancelCancellationRequest(deal.id)}
                            className="w-full"
                          >
                            Withdraw Cancellation Request
                          </Button>
                        </div>
                      )}

                      {!deal.cancellation_requested_by && (
                        <Button 
                          variant="outline" 
                          onClick={() => openCancelDialog(deal.id)}
                          className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                          Request to Cancel Deal
                        </Button>
                      )}
                    </>
                  )}

                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/messages`)}
                    className="w-full"
                  >
                    Message {otherParty.username}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Cancel Deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a cancellation request to the other party. Both users must agree to cancel the deal. 
              After cancellation, you'll both be able to rate each other. The request will be reopened for others to accept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Deal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => dealToCancel && handleCancelRequest(dealToCancel)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Request Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
