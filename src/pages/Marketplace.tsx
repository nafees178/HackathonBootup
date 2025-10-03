import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, CheckCircle, Clock, Plus, MessageSquare, Star, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalRequests: number;
  activeDeals: number;
  completedDeals: number;
  avgReputation: number;
  myRequests: number;
  myDeals: number;
}

const Marketplace = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    activeDeals: 0,
    completedDeals: 0,
    avgReputation: 0,
    myRequests: 0,
    myDeals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch total open requests
      const { count: requestCount } = await supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      // Fetch active deals
      const { count: activeDealsCount } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "prerequisite_pending", "active"]);

      // Fetch completed deals
      const { count: completedDealsCount } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Fetch average reputation
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("reputation_score");
      
      const avgRep = profilesData && profilesData.length > 0
        ? Math.round(profilesData.reduce((acc, p) => acc + (p.reputation_score || 0), 0) / profilesData.length)
        : 0;

      let myRequests = 0;
      let myDeals = 0;

      if (session) {
        // Fetch user's requests
        const { count: userRequestsCount } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);

        // Fetch user's deals
        const { count: userDealsCount } = await supabase
          .from("deals")
          .select("*", { count: "exact", head: true })
          .or(`requester_id.eq.${session.user.id},accepter_id.eq.${session.user.id}`);

        myRequests = userRequestsCount || 0;
        myDeals = userDealsCount || 0;

        // Fetch recent activity
        const { data: recentReqs } = await supabase
          .from("requests")
          .select(`
            id,
            title,
            created_at,
            profiles (username)
          `)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentActivity(recentReqs || []);
      }

      setStats({
        totalRequests: requestCount || 0,
        activeDeals: activeDealsCount || 0,
        completedDeals: completedDealsCount || 0,
        avgReputation: avgRep,
        myRequests,
        myDeals,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of marketplace activity and your statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Available in marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeDeals}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Deals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedDeals}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Reputation</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgReputation}</div>
            <p className="text-xs text-muted-foreground mt-1">Community average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.myRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Your posted requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.myDeals}</div>
            <p className="text-xs text-muted-foreground mt-1">Your total deals</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/create-request" className="block">
              <Button className="w-full justify-start gap-2" variant="outline">
                <Plus className="h-4 w-4" />
                Post New Request
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button className="w-full justify-start gap-2" variant="outline">
                <TrendingUp className="h-4 w-4" />
                Browse Requests
              </Button>
            </Link>
            <Link to="/messages" className="block">
              <Button className="w-full justify-start gap-2" variant="outline">
                <MessageSquare className="h-4 w-4" />
                View Messages
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    to={`/request/${activity.id}`}
                    className="block p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {activity.profiles?.username} • {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Marketplace;
