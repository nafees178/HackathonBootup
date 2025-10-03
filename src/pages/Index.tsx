import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, TrendingUp, MessageSquare, User, Star, CheckCircle, Award, ArrowRight, ListChecks } from "lucide-react";
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
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-3">
                Welcome {userProfile ? `back, ${userProfile.username}` : "to Tit4Tat"}!
              </h1>
              <p className="text-xl text-muted-foreground">
                Your marketplace for skill and item exchanges
              </p>
            </div>
            {userProfile && (
              <Link to="/profile">
                <Avatar className="h-20 w-20 border-4 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                  <AvatarFallback className="text-2xl">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link to="/create-request" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Post Request</h3>
                      <p className="text-sm text-muted-foreground">Share what you need</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/marketplace" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Browse Marketplace</h3>
                      <p className="text-sm text-muted-foreground">Find opportunities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/active-deals" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                      <ListChecks className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Active Deals</h3>
                      <p className="text-sm text-muted-foreground">Track your tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/messages" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Messages</h3>
                      <p className="text-sm text-muted-foreground">Check conversations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* User Stats */}
          {userProfile && (
            <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <span className="text-4xl font-bold">{userProfile.reputation_score}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Reputation Score</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-6 w-6 text-success" />
                      <span className="text-4xl font-bold">{userProfile.completed_deals}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Completed Deals</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="h-6 w-6 text-accent" />
                      <span className="text-4xl font-bold">{completionRate}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Requests */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recent Requests</h2>
              <p className="text-muted-foreground">Fresh opportunities from the community</p>
            </div>
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2">
                View All <ArrowRight className="h-4 w-4" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">How Tit4Tat Works</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Exchange skills, items, or services with people in your community. Post what you need, 
                browse what others offer, and create mutually beneficial deals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2 text-center md:text-left">Post Your Request</h3>
                  <p className="text-sm text-muted-foreground text-center md:text-left">
                    Share what you're offering and what you're looking for
                  </p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2 text-center md:text-left">Connect & Agree</h3>
                  <p className="text-sm text-muted-foreground text-center md:text-left">
                    Review interested users and start a conversation
                  </p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2 text-center md:text-left">Complete & Rate</h3>
                  <p className="text-sm text-muted-foreground text-center md:text-left">
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
