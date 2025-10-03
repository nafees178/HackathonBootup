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
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingDeals();
  }, [requestId]);

  const fetchPendingDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          id,
          accepter_id,
          status,
          created_at,
          profiles:accepter_id (
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
      console.error("Error fetching pending deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dealId: string, accepterId: string) => {
    try {
      // Get request details
      const { data: request, error: reqError } = await supabase
        .from("requests")
        .select("has_prerequisite, user_id")
        .eq("id", requestId)
        .single();

      if (reqError) throw reqError;

      // Update deal status
      const newStatus = request.has_prerequisite ? "prerequisite_pending" : "active";
      const { error: dealError } = await supabase
        .from("deals")
        .update({ status: newStatus })
        .eq("id", dealId);

      if (dealError) throw dealError;

      // Create conversation
      const { error: convError } = await supabase
        .from("conversations")
        .insert({
          participant1_id: request.user_id,
          participant2_id: accepterId,
          request_id: requestId,
        });

      if (convError && convError.code !== "23505") throw convError; // Ignore duplicate

      // Update request status
      const { error: statusError } = await supabase
        .from("requests")
        .update({ status: "in_progress" })
        .eq("id", requestId);

      if (statusError) throw statusError;

      toast.success("Deal approved! You can now message them.");
      fetchPendingDeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ status: "cancelled" })
        .eq("id", dealId);

      if (error) throw error;

      toast.success("Request rejected");
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
                onClick={() => handleApprove(deal.id, deal.accepter_id)}
                className="flex-1 gap-1"
              >
                <Check className="h-4 w-4" />
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
