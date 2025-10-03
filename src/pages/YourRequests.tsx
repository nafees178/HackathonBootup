import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function YourRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchYourRequests();
    }
  }, [currentUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
  };

  const fetchYourRequests = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          profiles (id, username, reputation_score, location)
        `)
        .eq("user_id", currentUserId)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching your requests:", error);
    } finally {
      setLoading(false);
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
      <h1 className="text-4xl font-bold mb-8">Your Requests</h1>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You haven't posted any requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              id={request.id}
              title={request.title}
              description={request.description}
              requestType={request.request_type}
              offering={request.offering}
              seeking={request.seeking}
              moneyAmount={request.money_amount}
              category={request.category}
              hasPrerequisite={request.has_prerequisite}
              createdAt={request.created_at}
              userId={request.profiles.id}
              username={request.profiles.username}
              reputationScore={request.profiles.reputation_score}
              location={request.profiles.location}
            />
          ))}
        </div>
      )}
    </div>
  );
}
