import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Package, HelpCircle, Eye, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [
  "Design", "Development", "Marketing", "Writing", "Tutoring", 
  "Music", "Video", "Photography", "Consulting", "Other"
];

const CreateRequest = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("form");
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    }
    if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (formData.offering.length < 5) {
      newErrors.offering = "Please provide more detail";
    }
    if (formData.seeking.length < 5) {
      newErrors.seeking = "Please provide more detail";
    }
    if (formData.requestType.includes("money") && (!formData.moneyAmount || parseFloat(formData.moneyAmount) <= 0)) {
      newErrors.moneyAmount = "Please enter a valid amount";
    }
    if (formData.hasPrerequisite && formData.prerequisiteDescription.length < 20) {
      newErrors.prerequisiteDescription = "Please provide detailed prerequisites";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !validateForm()) return;

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

  const requestTypeLabels: Record<string, string> = {
    skill_for_skill: "Skill ↔ Skill",
    skill_for_item: "Skill ↔ Item",
    skill_for_money: "Skill ↔ Money",
    item_for_skill: "Item ↔ Skill",
    item_for_item: "Item ↔ Item",
    item_for_money: "Item ↔ Money",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Post a Request</h1>
          <p className="text-muted-foreground">Create a detailed request to find the perfect match</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="form">Create Request</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Request Details</CardTitle>
                    <CardDescription>Fill in all required information carefully</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Request Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Need website design for my startup"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={errors.title ? "border-destructive" : ""}
                      required
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formData.title.length}/100 characters (min 10)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide comprehensive details about what you need, expected timeline, deliverables, etc."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={errors.description ? "border-destructive" : ""}
                      rows={6}
                      required
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/1000 characters (min 50)
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requestType">Exchange Type *</Label>
                      <Select
                        value={formData.requestType}
                        onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                      >
                        <SelectTrigger>
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
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offering">What You're Offering *</Label>
                      <Input
                        id="offering"
                        placeholder="e.g., React tutoring (2 hours)"
                        value={formData.offering}
                        onChange={(e) => setFormData({ ...formData, offering: e.target.value })}
                        className={errors.offering ? "border-destructive" : ""}
                        required
                      />
                      {errors.offering && <p className="text-sm text-destructive">{errors.offering}</p>}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        Be specific about time, quality, or quantity
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seeking">What You're Seeking *</Label>
                      <Input
                        id="seeking"
                        placeholder="e.g., Professional logo design"
                        value={formData.seeking}
                        onChange={(e) => setFormData({ ...formData, seeking: e.target.value })}
                        className={errors.seeking ? "border-destructive" : ""}
                        required
                      />
                      {errors.seeking && <p className="text-sm text-destructive">{errors.seeking}</p>}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        Describe exactly what you need
                      </p>
                    </div>
                  </div>

                  {formData.requestType.includes("money") && (
                    <div className="space-y-2">
                      <Label htmlFor="moneyAmount">Amount (₹) *</Label>
                      <Input
                        id="moneyAmount"
                        type="number"
                        placeholder="500"
                        value={formData.moneyAmount}
                        onChange={(e) => setFormData({ ...formData, moneyAmount: e.target.value })}
                        className={errors.moneyAmount ? "border-destructive" : ""}
                      />
                      {errors.moneyAmount && <p className="text-sm text-destructive">{errors.moneyAmount}</p>}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
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
                    <p className="text-xs text-muted-foreground">
                      Prerequisites are conditions that must be met before work can begin
                    </p>

                    {formData.hasPrerequisite && (
                      <div className="space-y-2">
                        <Label htmlFor="prerequisiteDescription">Prerequisite Description *</Label>
                        <Textarea
                          id="prerequisiteDescription"
                          placeholder="e.g., Must provide project files, assets, and content outline before starting design work"
                          value={formData.prerequisiteDescription}
                          onChange={(e) =>
                            setFormData({ ...formData, prerequisiteDescription: e.target.value })
                          }
                          className={errors.prerequisiteDescription ? "border-destructive" : ""}
                          rows={3}
                          required={formData.hasPrerequisite}
                        />
                        {errors.prerequisiteDescription && (
                          <p className="text-sm text-destructive">{errors.prerequisiteDescription}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setActiveTab("preview")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Request
                    </Button>
                    <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Request
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{formData.title || "Your Request Title"}</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formData.category || "Category"}</Badge>
                  <Badge>{requestTypeLabels[formData.requestType]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {formData.description || "Your detailed description will appear here..."}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Offering</h4>
                    <p className="text-lg">{formData.offering || "What you're offering"}</p>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Seeking</h4>
                    <p className="text-lg">{formData.seeking || "What you're seeking"}</p>
                    {formData.moneyAmount && (
                      <p className="text-2xl font-bold text-accent mt-2">₹{formData.moneyAmount}</p>
                    )}
                  </div>
                </div>

                {formData.hasPrerequisite && formData.prerequisiteDescription && (
                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <h4 className="font-semibold mb-2">Prerequisites Required</h4>
                    <p className="text-sm text-muted-foreground">{formData.prerequisiteDescription}</p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("form")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Edit
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateRequest;
