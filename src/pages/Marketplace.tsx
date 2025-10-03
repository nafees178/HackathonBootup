import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, User } from "lucide-react";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  offer_type: string;
  offer_value: string;
  prerequisites: string | null;
  status: string;
  views: number;
  created_at: string;
  profiles: {
    display_name: string | null;
    reputation_score: number;
    completed_deals: number;
    user_badges: Array<{
      badges: {
        name: string;
        icon: string;
      };
    }>;
  };
}

const Marketplace = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          profiles (
            display_name,
            reputation_score,
            completed_deals,
            user_badges (
              badges (
                name,
                icon
              )
            )
          )
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || request.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-trust-gradient bg-clip-text text-transparent cursor-pointer" onClick={() => navigate("/marketplace")}>
            TrustTrade
          </h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/create-request")} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Post Request
            </Button>
            <Avatar className="cursor-pointer" onClick={() => navigate("/profile")}>
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Marketplace</h2>
          <p className="text-muted-foreground">
            Browse {requests.length} active requests. Trade skills, items, or money.
          </p>
        </div>

        <FilterBar 
          onSearchChange={setSearchQuery} 
          onCategoryChange={setCategoryFilter}
          currentCategory={categoryFilter}
        />

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-card animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No requests found</p>
            <Button className="mt-4" onClick={() => navigate("/create-request")}>
              Post the first request
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                id={request.id}
                title={request.title}
                description={request.description}
                offerType={request.offer_type}
                offerValue={request.offer_value}
                category={request.category}
                prerequisites={request.prerequisites}
                views={request.views}
                createdAt={request.created_at}
                userName={request.profiles?.display_name || "Anonymous"}
                reputation={request.profiles?.reputation_score || 0}
                completedDeals={request.profiles?.completed_deals || 0}
                badges={request.profiles?.user_badges?.map((ub) => ub.badges.name) || []}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;