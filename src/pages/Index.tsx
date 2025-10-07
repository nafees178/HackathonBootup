import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, TrendingUp, MessageSquare, User, Star, CheckCircle, Award, ArrowRight, ListChecks, ClipboardList, RefreshCw } from "lucide-react";
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
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
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
      setRefreshing(false);
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
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {userProfile ? `Welcome back, ${userProfile.username}!` : "Welcome to ViniMay"}
              </h1>
              <p className="text-base md:text-xl text-muted-foreground mb-6">
                Exchange skills, items & services in your community
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link to="/create-request">
                  <Button size="lg" className="rounded-full gap-2 shadow-lg">
                    <Plus className="h-5 w-5" />
                    Post Request
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="rounded-full gap-2">
                    Browse Marketplace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {userProfile && (
              <Link to="/profile" className="hidden md:block">
                <Card className="p-6 border-2 hover:border-primary transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-20 w-20 border-4 border-border">
                      <AvatarFallback className="text-2xl bg-muted">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-bold text-lg">{userProfile.username}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">{userProfile.reputation_score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/create-request">
            <Card className="card-hover border-2 cursor-pointer h-full group">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-foreground mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8 text-background" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold mb-1">Post Request</h3>
                <p className="text-xs text-muted-foreground">Share your needs</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/marketplace">
            <Card className="card-hover border-2 cursor-pointer h-full group">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-foreground" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold mb-1">Browse Market</h3>
                <p className="text-xs text-muted-foreground">Find opportunities</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/active-deals">
            <Card className="card-hover border-2 cursor-pointer h-full group">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-success/20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ListChecks className="h-8 w-8 text-success" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold mb-1">Active Deals</h3>
                <p className="text-xs text-muted-foreground">Track progress</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/messages">
            <Card className="card-hover border-2 cursor-pointer h-full group">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-8 w-8 text-foreground" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold mb-1">Messages</h3>
                <p className="text-xs text-muted-foreground">Chat with users</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Dashboard - Only show if logged in */}
        {userProfile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-2 overflow-hidden group hover:border-primary transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reputation Score</p>
                    <p className="text-3xl font-bold">{userProfile.reputation_score}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="h-7 w-7 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 overflow-hidden group hover:border-primary transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed Deals</p>
                    <p className="text-3xl font-bold">{userProfile.completed_deals}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-7 w-7 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 overflow-hidden group hover:border-primary transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                    <p className="text-3xl font-bold">{completionRate}%</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Recent Requests</h2>
              <p className="text-sm text-muted-foreground">Fresh opportunities from the community</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link to="/marketplace">
                <Button variant="outline" className="gap-2 rounded-xl">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {recentRequests.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-16 text-center">
                <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to post a request!</p>
                <Link to="/create-request">
                  <Button className="gap-2 rounded-full">
                    <Plus className="h-5 w-5" />
                    Post a Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

        {/* How It Works Section */}
        <Card className="border-2 bg-gradient-to-br from-muted/30 to-muted/10">
          <CardContent className="py-12 px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">How ViniMay Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Simple, secure, and community-driven exchange platform
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <div className="bg-primary/5 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Post Your Request</h3>
                <p className="text-sm text-muted-foreground">
                  Share what you're offering and what you're looking for in the community
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-4 mx-auto">
                  <MessageSquare className="h-8 w-8 text-foreground" />
                </div>
                <div className="bg-accent/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Connect & Negotiate</h3>
                <p className="text-sm text-muted-foreground">
                  Review interested users and start conversations to finalize details
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div className="bg-success/10 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-success">3</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Complete & Rate</h3>
                <p className="text-sm text-muted-foreground">
                  Exchange and build your reputation with successful deals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
