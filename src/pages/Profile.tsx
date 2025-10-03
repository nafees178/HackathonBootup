import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Star, CheckCircle, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  reputation_score: number;
  total_deals: number;
  completed_deals: number;
}

interface Badge {
  badge_type: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;

      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select("badge_type")
        .eq("user_id", session.user.id);

      if (badgesError) throw badgesError;

      setProfile(profileData);
      setBadges(badgesData.map((b: Badge) => b.badge_type));
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const completionRate = profile.total_deals > 0 
    ? Math.round((profile.completed_deals / profile.total_deals) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10" style={{ background: "var(--gradient-mesh)" }} />
      
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Your Profile</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Trader Profile
          </h1>
        </div>

        <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-xl relative animate-slide-up max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
          
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-glow">
                <AvatarFallback className="text-4xl bg-primary/10">
                  <User className="h-16 w-16 text-primary" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <CardTitle className="text-4xl mb-2">{profile.username}</CardTitle>
                {profile.full_name && (
                  <p className="text-lg text-muted-foreground mb-4">{profile.full_name}</p>
                )}
                {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}
                
                {badges.length > 0 && (
                  <div className="mt-4 flex justify-center md:justify-start">
                    <BadgeDisplay badges={badges as any} size="lg" />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-glow transition-all">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-4xl font-bold text-primary mb-1">{profile.reputation_score}</p>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Reputation Score</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 bg-gradient-to-br from-success/10 to-success/5 hover:shadow-glow transition-all">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <p className="text-4xl font-bold text-success mb-1">{profile.completed_deals}</p>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Completed Deals</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-glow transition-all">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-4xl font-bold text-accent mb-1">{completionRate}%</p>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Completion Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
