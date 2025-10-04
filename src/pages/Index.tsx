import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, TrendingUp, MessageSquare, User, Star, CheckCircle, Award, ArrowRight, ListChecks, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Request {
  id: string;
  title: string;
  description: string;
  request_type: string;
  offering: string;
  seeking: string;
  money_amount: number | null;
  category: string;
  has_prerequisite: boolean;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    reputation_score: number;
    location: string | null;
  };
}

interface UserProfile {
  username: string;
  reputation_score: number;
  total_deals: number;
  completed_deals: number;
}

const Index = () => {
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for new requests
    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'requests'
        },
        async (payload) => {
          console.log('New request received:', payload);
          // Fetch the complete request with profile data
          const { data: newRequest, error } = await supabase
            .from("requests")
            .select(`
              *,
              profiles (id, username, reputation_score, location)
            `)
            .eq("id", payload.new.id)
            .single();

          if (!error && newRequest) {
            setRecentRequests(prev => [newRequest, ...prev.slice(0, 7)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);

      // Fetch recent requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("requests")
        .select(`
          *,
          profiles (id, username, reputation_score, location)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(8);

      if (requestsError) throw requestsError;
      setRecentRequests(requestsData || []);

      // Fetch user profile if logged in
      if (session) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, reputation_score, total_deals, completed_deals")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = userProfile && userProfile.total_deals > 0 
    ? Math.round((userProfile.completed_deals / userProfile.total_deals) * 100)
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 text-foreground truncate">
                Welcome {userProfile ? `back, ${userProfile.username}` : "to Tit4Tat"}!
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-muted-foreground">
                Your marketplace for skill and item exchanges
              </p>
            </div>
            {userProfile && (
              <Link to="/profile" className="flex-shrink-0">
                <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-border cursor-pointer hover:border-primary transition-all duration-200">
                  <AvatarFallback className="text-base md:text-xl bg-muted">
                    <User className="h-6 w-6 md:h-8 md:w-8" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
            <Link to="/create-request" className="block">
              <Card className="card-hover cursor-pointer border hover:border-primary h-full">
                <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 px-3 md:px-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                      <Plus className="h-5 w-5 md:h-6 md:w-6 text-background" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 text-center md:text-left">
                      <h3 className="font-semibold text-sm md:text-base">Post</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">Share what you need</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/your-requests" className="block">
              <Card className="card-hover cursor-pointer border hover:border-primary h-full">
                <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 px-3 md:px-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-foreground" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 text-center md:text-left">
                      <h3 className="font-semibold text-sm md:text-base">Requests</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">View your posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/marketplace" className="block">
              <Card className="card-hover cursor-pointer border hover:border-primary h-full">
                <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 px-3 md:px-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-foreground" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 text-center md:text-left">
                      <h3 className="font-semibold text-sm md:text-base">Market</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">Find opportunities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/active-deals" className="block">
              <Card className="card-hover cursor-pointer border hover:border-primary h-full">
                <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 px-3 md:px-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                      <ListChecks className="h-5 w-5 md:h-6 md:w-6 text-success" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 text-center md:text-left">
                      <h3 className="font-semibold text-sm md:text-base">Deals</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">Track your tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/messages" className="block">
              <Card className="card-hover cursor-pointer border hover:border-primary h-full">
                <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 px-3 md:px-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-foreground" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 text-center md:text-left">
                      <h3 className="font-semibold text-sm md:text-base">Messages</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">Check conversations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* User Stats */}
          {userProfile && (
            <Card className="mb-6 md:mb-8 border-2">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Award className="h-4 w-4 md:h-5 md:w-5" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                      <span className="text-2xl md:text-4xl font-bold">{userProfile.reputation_score}</span>
                    </div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Reputation</p>
                  </div>

                  <div className="text-center">
                    <div className="flex flex-col items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
                      <span className="text-2xl md:text-4xl font-bold">{userProfile.completed_deals}</span>
                    </div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Completed</p>
                  </div>

                  <div className="text-center">
                    <div className="flex flex-col items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
                      <span className="text-2xl md:text-4xl font-bold">{completionRate}%</span>
                    </div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Requests */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Recent Requests</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Fresh opportunities • Live Updates ✨</p>
            </div>
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2 text-sm md:text-base">
                View All <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to post a request!</p>
                <Link to="/create-request">
                  <Button className="gap-2">
                    <Plus className="h-5 w-5" />
                    Post a Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {recentRequests.map((request) => (
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

        {/* Info Section */}
        <Card className="border-2">
          <CardContent className="py-8 md:py-12 px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">How Tit4Tat Works</h2>
              <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8">
                Exchange skills, items, or services with people in your community. Post what you need, 
                browse what others offer, and create mutually beneficial deals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
                <div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 md:mb-3 mx-auto md:mx-0">
                    <span className="text-xl md:text-2xl font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-1 md:mb-2 text-center md:text-left text-sm md:text-base">Post Your Request</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                    Share what you're offering and what you're looking for
                  </p>
                </div>
                <div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 md:mb-3 mx-auto md:mx-0">
                    <span className="text-xl md:text-2xl font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-1 md:mb-2 text-center md:text-left text-sm md:text-base">Connect & Agree</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                    Review interested users and start a conversation
                  </p>
                </div>
                <div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 md:mb-3 mx-auto md:mx-0">
                    <span className="text-xl md:text-2xl font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-1 md:mb-2 text-center md:text-left text-sm md:text-base">Complete & Rate</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                    Exchange and build your reputation with successful deals
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
