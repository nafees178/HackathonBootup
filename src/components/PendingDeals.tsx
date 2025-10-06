import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Check, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Deal {
  id: string;
  user_id: string;
  accepter_id: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    reputation_score: number;
    completed_deals: number;
    total_deals: number;
  };
}

interface PendingDealsProps {
  requestId: string;
}

export function PendingDeals({ requestId }: PendingDealsProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingDeals();
  }, [requestId]);

  const fetchPendingDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("request_interests")
        .select(`
          id,
          user_id,
          status,
          message,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            reputation_score,
            completed_deals,
            total_deals
          )
        `)
        .eq("request_id", requestId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data as any || []);
    } catch (error) {
      console.error("Error fetching pending interests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (interestId: string, accepterId: string) => {
    if (approvingId) return; // Prevent multiple clicks
    
    setApprovingId(interestId);
    try {
      // Get request details
      const { data: request, error: reqError } = await supabase
        .from("requests")
        .select("has_prerequisite, user_id")
        .eq("id", requestId)
        .single();

      if (reqError) throw reqError;

      // Check if a deal already exists for this request and accepter
      const { data: existingDeal } = await supabase
        .from("deals")
        .select("id")
        .eq("request_id", requestId)
        .eq("accepter_id", accepterId)
        .maybeSingle();

      if (existingDeal) {
        toast.info("This interest has already been accepted");
        return;
      }

      // Start a transaction-like operation
      // 1. Accept the selected interest
      const { error: acceptError } = await supabase
        .from("request_interests")
        .update({ status: "accepted" })
        .eq("id", interestId);

      if (acceptError) throw acceptError;

      // 2. Reject all other interests for this request
      const { error: rejectError } = await supabase
        .from("request_interests")
        .update({ status: "rejected" })
        .eq("request_id", requestId)
        .neq("id", interestId);

      if (rejectError) throw rejectError;

      // 3. Create the deal
      const { error: dealError } = await supabase
        .from("deals")
        .insert([{
          request_id: requestId,
          requester_id: request.user_id,
          accepter_id: accepterId,
          status: request.has_prerequisite ? "prerequisite_pending" : "active",
        }]);

      if (dealError) throw dealError;

      // Note: total_deals is automatically updated by database triggers

      // 4. Check if conversation already exists, if not create one
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant1_id.eq.${request.user_id},participant2_id.eq.${accepterId}),and(participant1_id.eq.${accepterId},participant2_id.eq.${request.user_id})`)
        .maybeSingle();

      // Create conversation only if it doesn't exist
      if (!existingConv) {
        const { error: convError } = await supabase
          .from("conversations")
          .insert({
            participant1_id: request.user_id,
            participant2_id: accepterId,
            request_id: requestId,
          });

        if (convError) throw convError;
      }

      // 5. Update request status
      const { error: statusError } = await supabase
        .from("requests")
        .update({ status: "in_progress" })
        .eq("id", requestId);

      if (statusError) throw statusError;

      toast.success("Interest approved! Deal created and you can now message them.");
      fetchPendingDeals();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (interestId: string) => {
    try {
      const { error } = await supabase
        .from("request_interests")
        .update({ status: "rejected" })
        .eq("id", interestId);

      if (error) throw error;

      toast.success("Interest rejected");
      fetchPendingDeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests ({deals.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deals.map((deal) => (
          <div key={deal.id} className="p-4 border rounded-lg space-y-3">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/profile/${deal.profiles.id}`)}
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{deal.profiles.username}</p>
                {deal.profiles.full_name && (
                  <p className="text-sm text-muted-foreground">{deal.profiles.full_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs">{deal.profiles.reputation_score}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {deal.profiles.completed_deals} deals completed
                  </span>
                </div>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(deal.id, deal.user_id)}
                className="flex-1 gap-1"
                disabled={approvingId !== null}
              >
                {approvingId === deal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(deal.id)}
                className="flex-1 gap-1"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
