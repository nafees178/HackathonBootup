import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Star, CheckCircle, TrendingUp, Edit, MapPin, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  location: string;
  phone: string;
  reputation_score: number;
  total_deals: number;
  completed_deals: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    phone: "",
  });
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
      setFormData({
        full_name: profileData.full_name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        phone: profileData.phone || "",
      });
      setBadges(badgesData.map((b) => b.badge_type));
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const completionRate = profile.total_deals > 0 
    ? Math.round((profile.completed_deals / profile.total_deals) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Profile</h1>
          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>Update your profile information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <Button onClick={handleUpdate} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-12 w-12 text-primary" />
              </div>

              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{profile.username}</CardTitle>
                {profile.full_name && <p className="text-lg text-muted-foreground mb-3">{profile.full_name}</p>}
                {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
                
                {badges.length > 0 && <BadgeDisplay badges={badges as any} />}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Star className="h-10 w-10 text-primary mb-3" />
                <p className="text-3xl font-bold mb-1">{profile.reputation_score}</p>
                <p className="text-sm text-muted-foreground">Reputation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="h-10 w-10 text-success mb-3" />
                <p className="text-3xl font-bold mb-1">{profile.completed_deals}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="h-10 w-10 text-accent mb-3" />
                <p className="text-3xl font-bold mb-1">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
