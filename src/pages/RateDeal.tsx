import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RateDeal() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [deal, setDeal] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherParty, setOtherParty] = useState<any>(null);

  useEffect(() => {
    fetchDealDetails();
  }, [dealId]);

  const fetchDealDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);

      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          requests (title),
          requester_profile:requester_id (id, username, reputation_score),
          accepter_profile:accepter_id (id, username, reputation_score)
        `)
        .eq("id", dealId)
        .single();

      if (error) throw error;

      setDeal(data);
      const isRequester = data.requester_id === session.user.id;
      setOtherParty(isRequester ? data.accepter_profile : data.requester_profile);
    } catch (error) {
      console.error("Error fetching deal:", error);
      toast.error("Failed to load deal details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      // Insert review
      const { error: reviewError } = await supabase.from("reviews").insert({
        deal_id: dealId,
        reviewer_id: currentUserId,
        reviewee_id: otherParty.id,
        rating,
        comment: comment || null,
      });

      if (reviewError) throw reviewError;

      // Update deal status to completed
      const { error: dealError } = await supabase
        .from("deals")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", dealId);

      if (dealError) throw dealError;

      // Update both users' profiles
      const profiles = [otherParty.id, currentUserId];
      for (const profileId of profiles) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_deals, completed_deals, reputation_score")
          .eq("id", profileId)
          .single();

        if (profile) {
          const updates: any = {
            total_deals: (profile.total_deals || 0) + 1,
            completed_deals: (profile.completed_deals || 0) + 1,
          };

          // Add reputation points only to the reviewee
          if (profileId === otherParty.id) {
            updates.reputation_score = (profile.reputation_score || 0) + (rating * 2);
          }

          await supabase
            .from("profiles")
            .update(updates)
            .eq("id", profileId);
        }
      }

      // Update request status
      await supabase
        .from("requests")
        .update({ status: "completed" })
        .eq("id", deal.request_id);

      toast.success("Rating submitted successfully!");
      navigate("/active-deals");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
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

  if (!deal || !otherParty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Deal not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Rate Your Experience</CardTitle>
          <p className="text-muted-foreground">{deal.requests.title}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <Avatar className="h-16 w-16">
              <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{otherParty.username}</p>
              <p className="text-sm text-muted-foreground">
                Current Rating: {otherParty.reputation_score}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 0 && "Select a rating"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Rating"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
