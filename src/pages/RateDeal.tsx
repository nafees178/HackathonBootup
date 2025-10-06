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

      // Check if deal is in a state that can be rated (active with all tasks completed, or cancelled)
      const canRate = 
        (data.status === "active" && 
         data.requester_task_completed && 
         data.accepter_task_completed && 
         data.requester_verified_accepter && 
         data.accepter_verified_requester) ||
        data.status === "cancelled";

      if (!canRate) {
        toast.error("This deal is not ready to be rated yet");
        navigate("/active-deals");
        return;
      }

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

      // Calculate and update reviewee's reputation based on all their reviews
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", otherParty.id);

      let newReputation = 0;
      if (allReviews && allReviews.length > 0) {
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        newReputation = Math.round(avgRating * 20); // Scale to 0-100
      }

      // Update reviewee's profile with new reputation
      await supabase
        .from("profiles")
        .update({ reputation_score: newReputation })
        .eq("id", otherParty.id);

      // Check if both users have rated each other
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("deal_id", dealId);

      const bothRated = existingReviews && existingReviews.length === 2;

      if (bothRated && deal.status !== "cancelled") {
        // Update deal status to completed (triggers will automatically update completed_deals)
        await supabase
          .from("deals")
          .update({ 
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", dealId);

        // Recalculate reputation for both users based on all reviews
        const profiles = [deal.requester_id, deal.accepter_id];
        for (const profileId of profiles) {
          const { data: userReviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("reviewee_id", profileId);

          if (userReviews && userReviews.length > 0) {
            const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
            const reputation = Math.round(avgRating * 20);
            
            await supabase
              .from("profiles")
              .update({ reputation_score: reputation })
              .eq("id", profileId);
          }
        }

        // Update request status to completed
        await supabase
          .from("requests")
          .update({ status: "completed" })
          .eq("id", deal.request_id);
      }

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
