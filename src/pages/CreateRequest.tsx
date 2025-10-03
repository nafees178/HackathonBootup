import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Sparkles, Package } from "lucide-react";

const CreateRequest = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requestType: "skill_for_skill",
    offering: "",
    seeking: "",
    moneyAmount: "",
    category: "",
    hasPrerequisite: false,
    prerequisiteDescription: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([{
        user_id: userId,
        title: formData.title,
        description: formData.description,
        request_type: formData.requestType,
        offering: formData.offering,
        seeking: formData.seeking,
        money_amount: formData.moneyAmount ? parseFloat(formData.moneyAmount) : null,
        category: formData.category,
        has_prerequisite: formData.hasPrerequisite,
        prerequisite_description: formData.hasPrerequisite ? formData.prerequisiteDescription : null,
      }] as any);

      if (error) throw error;

      toast.success("Request posted successfully!");
      navigate("/marketplace");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10" style={{ background: "var(--gradient-mesh)" }} />
      
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Create New Request</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            What Do You Need?
          </h1>
          <p className="text-xl text-muted-foreground">Share your request with the community</p>
        </div>

        <Card className="max-w-3xl mx-auto border-2 border-primary/20 bg-card/80 backdrop-blur-xl relative animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
          
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">Post a Request</CardTitle>
                <CardDescription>Fill in the details below</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Need website design for my startup"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/50 border-primary/20 focus:border-primary/40 h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about what you need..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="bg-background/50 border-primary/20 focus:border-primary/40"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestType">Exchange Type *</Label>
                  <Select
                    value={formData.requestType}
                    onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                  >
                    <SelectTrigger className="bg-background/50 border-primary/20 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skill_for_skill">Skill ↔ Skill</SelectItem>
                      <SelectItem value="skill_for_item">Skill ↔ Item</SelectItem>
                      <SelectItem value="skill_for_money">Skill ↔ Money</SelectItem>
                      <SelectItem value="item_for_skill">Item ↔ Skill</SelectItem>
                      <SelectItem value="item_for_item">Item ↔ Item</SelectItem>
                      <SelectItem value="item_for_money">Item ↔ Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Design, Coding, Tutoring"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-background/50 border-primary/20 focus:border-primary/40 h-12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offering">What You're Offering *</Label>
                  <Input
                    id="offering"
                    placeholder="e.g., React tutoring"
                    value={formData.offering}
                    onChange={(e) => setFormData({ ...formData, offering: e.target.value })}
                    className="bg-background/50 border-primary/20 focus:border-primary/40 h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seeking">What You're Seeking *</Label>
                  <Input
                    id="seeking"
                    placeholder="e.g., Logo design"
                    value={formData.seeking}
                    onChange={(e) => setFormData({ ...formData, seeking: e.target.value })}
                    className="bg-background/50 border-primary/20 focus:border-primary/40 h-12"
                    required
                  />
                </div>
              </div>

              {formData.requestType.includes("money") && (
                <div className="space-y-2">
                  <Label htmlFor="moneyAmount">Amount (₹)</Label>
                  <Input
                    id="moneyAmount"
                    type="number"
                    placeholder="500"
                    value={formData.moneyAmount}
                    onChange={(e) => setFormData({ ...formData, moneyAmount: e.target.value })}
                    className="bg-background/50 border-primary/20 focus:border-primary/40 h-12"
                  />
                </div>
              )}

              <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-primary/10">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPrerequisite"
                    checked={formData.hasPrerequisite}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasPrerequisite: checked as boolean })
                    }
                  />
                  <Label htmlFor="hasPrerequisite" className="cursor-pointer font-medium">
                    This request has prerequisites
                  </Label>
                </div>

                {formData.hasPrerequisite && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="prerequisiteDescription">Prerequisite Description *</Label>
                    <Textarea
                      id="prerequisiteDescription"
                      placeholder="e.g., Must provide project files and assets before starting"
                      value={formData.prerequisiteDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, prerequisiteDescription: e.target.value })
                      }
                      rows={3}
                      className="bg-background/50 border-primary/20 focus:border-primary/40"
                      required={formData.hasPrerequisite}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-14 text-lg relative group overflow-hidden" disabled={loading}>
                <span className="relative z-10 flex items-center gap-2">
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  Post Request
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRequest;
