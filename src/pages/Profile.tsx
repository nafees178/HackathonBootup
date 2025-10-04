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
import { User, Star, CheckCircle, TrendingUp, Edit, MapPin, Phone, Globe, Github, Linkedin, Twitter, Briefcase, GraduationCap, QrCode, Upload, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

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

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    username: string;
  };
  deals: {
    requests: {
      title: string;
    };
  };
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [selectedQr, setSelectedQr] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    phone: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    portfolio_description: "",
    work_experience: "",
    education: "",
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

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_fkey(username),
          deals!inner(
            requests!inner(title)
          )
        `)
        .eq("reviewee_id", session.user.id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      setProfile(profileData);
      setReviews(reviewsData || []);
      setFormData({
        full_name: profileData.full_name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        phone: profileData.phone || "",
        website: profileData.website || "",
        github: profileData.github || "",
        linkedin: profileData.linkedin || "",
        twitter: profileData.twitter || "",
        portfolio_description: profileData.portfolio_description || "",
        work_experience: profileData.work_experience || "",
        education: profileData.education || "",
      });
      setBadges(badgesData.map((b) => b.badge_type));
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQrSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setSelectedQr(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const removeQr = () => {
    setSelectedQr(null);
    if (qrPreview) {
      URL.revokeObjectURL(qrPreview);
      setQrPreview(null);
    }
  };

  const handleQrUpload = async () => {
    if (!selectedQr) return;

    setUploadingQr(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete old QR if exists
      if ((profile as any)?.payment_qr_url) {
        const oldPath = (profile as any).payment_qr_url.split('/').slice(-2).join('/');
        await supabase.storage.from('payment-qr').remove([oldPath]);
      }

      const fileExt = selectedQr.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${session.user.id}/qr_${timestamp}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-qr')
        .upload(fileName, selectedQr);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-qr')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ payment_qr_url: publicUrl })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      toast.success("Payment QR code uploaded successfully!");
      removeQr();
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingQr(false);
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold">My Profile</h1>
          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1 sm:gap-2 text-sm sm:text-base">
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GitHub</Label>
                  <Input
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter</Label>
                  <Input
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Portfolio Description</Label>
                  <Textarea
                    value={formData.portfolio_description}
                    onChange={(e) => setFormData({ ...formData, portfolio_description: e.target.value })}
                    rows={3}
                    placeholder="Describe your work and portfolio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work Experience</Label>
                  <Textarea
                    value={formData.work_experience}
                    onChange={(e) => setFormData({ ...formData, work_experience: e.target.value })}
                    rows={3}
                    placeholder="Your professional experience"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Education</Label>
                  <Textarea
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    rows={2}
                    placeholder="Your educational background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment QR Code</Label>
                  <div className="space-y-3">
                    {(profile as any)?.payment_qr_url && !qrPreview && (
                      <div className="relative inline-block">
                        <img 
                          src={(profile as any).payment_qr_url} 
                          alt="Current QR" 
                          className="h-32 w-32 object-cover rounded-lg border" 
                        />
                      </div>
                    )}
                    {qrPreview && (
                      <div className="relative inline-block">
                        <img src={qrPreview} alt="New QR Preview" className="h-32 w-32 object-cover rounded-lg border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={removeQr}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        id="qr-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleQrSelect}
                        className="hidden"
                      />
                      {(profile as any)?.payment_qr_url && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              if (!session) return;
                              
                              const oldPath = (profile as any).payment_qr_url.split('/').slice(-2).join('/');
                              await supabase.storage.from('payment-qr').remove([oldPath]);
                              
                              await supabase
                                .from("profiles")
                                .update({ payment_qr_url: null })
                                .eq("id", session.user.id);
                              
                              toast.success("QR code removed");
                              fetchProfile();
                            } catch (error: any) {
                              toast.error(error.message);
                            }
                          }}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove QR Code
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('qr-upload')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {(profile as any)?.payment_qr_url ? "Update QR Code" : "Upload QR Code"}
                      </Button>
                      {selectedQr && (
                        <Button
                          type="button"
                          onClick={handleQrUpload}
                          disabled={uploadingQr}
                        >
                          {uploadingQr ? "Uploading..." : "Save QR Code"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={handleUpdate} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment QR Code</DialogTitle>
              <DialogDescription>Scan this QR code to make a payment</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <img 
                src={(profile as any)?.payment_qr_url} 
                alt="Payment QR Code" 
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl sm:text-3xl">{profile.username}</CardTitle>
                  {(profile as any)?.payment_qr_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQrModalOpen(true)}
                      className="ml-2"
                    >
                      <QrCode className="h-5 w-5" />
                    </Button>
                  )}
                </div>
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

                <div className="flex flex-wrap gap-3 mb-4">
                  {(profile as any).website && (
                    <a href={(profile as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {(profile as any).github && (
                    <a href={(profile as any).github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {(profile as any).linkedin && (
                    <a href={(profile as any).linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {(profile as any).twitter && (
                    <a href={(profile as any).twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </a>
                  )}
                </div>
                
                {badges.length > 0 && <BadgeDisplay badges={badges as any} />}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
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

        {(profile as any).portfolio_description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{(profile as any).portfolio_description}</p>
            </CardContent>
          </Card>
        )}

        {(profile as any).work_experience && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{(profile as any).work_experience}</p>
            </CardContent>
          </Card>
        )}

        {(profile as any).education && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{(profile as any).education}</p>
            </CardContent>
          </Card>
        )}

        {reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.reviewer.username}</p>
                      <p className="text-sm text-muted-foreground">{review.deals.requests.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
