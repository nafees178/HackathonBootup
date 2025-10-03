import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
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
    username: string;
    reputation_score: number;
    location: string | null;
  };
}

const Index = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          profiles (username, reputation_score, location)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || request.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(requests.map((r) => r.category)))];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tit4Tat</h1>
            <p className="text-muted-foreground">Discover requests and start trading</p>
          </div>
          <Link to="/create-request">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Post Request
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!loading && (
          <p className="text-sm text-muted-foreground mb-6">
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} available
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Link to="/create-request">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Post a Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRequests.map((request) => (
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
                username={request.profiles.username}
                reputationScore={request.profiles.reputation_score}
                location={request.profiles.location}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/marketplace">
            <Button variant="outline" size="lg">
              View All Requests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
