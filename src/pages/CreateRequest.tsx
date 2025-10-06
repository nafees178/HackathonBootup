import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, Package, HelpCircle, Eye, ArrowLeft, Upload, X, MapPin, Calendar, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestCard } from "@/components/RequestCard";

const categories = [
  "Bring Items", "Exchange Items", "Help/Service", "Transportation",
  "Tutoring/Teaching", "Physical Tasks", "Errands", "Food Delivery",
  "Shopping", "Moving/Shifting", "Pet Care", "Event Help", "Other"
];

const CreateRequest = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("form");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requestType: "skill_for_skill",
    offering: "",
    moneyAmount: "",
    category: "",
    hasPrerequisite: false,
    prerequisiteDescription: "",
    deadline: "",
    pickupLocation: "",
    dropoffLocation: "",
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

  useEffect(() => {
    if (userId && activeTab === "your-requests") {
      fetchYourRequests();
    }
  }, [userId, activeTab]);

  // Handle edit query parameter
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && userId) {
      loadRequestForEdit(editId);
    }
  }, [searchParams, userId]);

  const loadRequestForEdit = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Request not found");
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        requestType: data.request_type as any,
        offering: data.offering,
        moneyAmount: data.money_amount?.toString() || "",
        category: data.category,
        hasPrerequisite: data.has_prerequisite,
        prerequisiteDescription: data.prerequisite_description || "",
        deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : "",
        pickupLocation: data.pickup_location || "",
        dropoffLocation: data.dropoff_location || "",
      });
      
      setEditingRequestId(requestId);
      setActiveTab("form");
      toast.success("Loaded request for editing");
    } catch (error) {
      console.error("Error loading request:", error);
      toast.error("Failed to load request");
    }
  };

  const fetchYourRequests = async () => {
    if (!userId) return;

    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          profiles (id, username, reputation_score, location)
        `)
        .eq("user_id", userId)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching your requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleEdit = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    // Populate form with request data
    setFormData({
      title: request.title,
      description: request.description,
      requestType: request.request_type as any,
      offering: request.offering,
      moneyAmount: request.money_amount?.toString() || "",
      category: request.category,
      hasPrerequisite: request.has_prerequisite,
      prerequisiteDescription: request.prerequisite_description || "",
      deadline: request.deadline ? new Date(request.deadline).toISOString().slice(0, 16) : "",
      pickupLocation: request.pickup_location || "",
      dropoffLocation: request.dropoff_location || "",
    });
    
    setEditingRequestId(requestId);
    setActiveTab("form");
    toast.success("Editing request. Update and submit to save changes.");
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const { error } = await supabase
        .from("requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request deleted successfully!");
      fetchYourRequests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('request-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('request-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }
    } catch (error: any) {
      toast.error("Failed to upload images: " + error.message);
      throw error;
    } finally {
      setUploadingImages(false);
    }

    return uploadedUrls;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }
    
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    
    if (!formData.offering.trim()) {
      newErrors.offering = "Please specify what you're offering";
    } else if (formData.offering.length > 500) {
      newErrors.offering = "Must be less than 500 characters";
    }
    
    if (formData.requestType.includes("money") && (!formData.moneyAmount || parseFloat(formData.moneyAmount) <= 0)) {
      newErrors.moneyAmount = "Please enter a valid amount";
    }
    
    if (formData.hasPrerequisite && !formData.prerequisiteDescription.trim()) {
      newErrors.prerequisiteDescription = "Please provide prerequisites details";
    } else if (formData.hasPrerequisite && formData.prerequisiteDescription.length > 1000) {
      newErrors.prerequisiteDescription = "Must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !validateForm()) return;

    setLoading(true);
    try {
      const imageUrls = await uploadImages();

      if (editingRequestId) {
        // Update existing request
        const { error } = await supabase
          .from("requests")
          .update({
            title: formData.title,
            description: formData.description,
            request_type: formData.requestType as any,
            offering: formData.offering,
            seeking: formData.title,
            money_amount: formData.moneyAmount ? parseFloat(formData.moneyAmount) : null,
            category: formData.category,
            has_prerequisite: formData.hasPrerequisite,
            prerequisite_description: formData.hasPrerequisite ? formData.prerequisiteDescription : null,
            deadline: formData.deadline || null,
            images: imageUrls.length > 0 ? imageUrls : null,
            pickup_location: formData.pickupLocation || null,
            dropoff_location: formData.dropoffLocation || null,
          })
          .eq("id", editingRequestId);

        if (error) throw error;
        toast.success("Request updated successfully!");
      } else {
        // Create new request
        const { error } = await supabase.from("requests").insert([{
          user_id: userId,
          title: formData.title,
          description: formData.description,
          request_type: formData.requestType,
          offering: formData.offering,
          seeking: formData.title,
          money_amount: formData.moneyAmount ? parseFloat(formData.moneyAmount) : null,
          category: formData.category,
          has_prerequisite: formData.hasPrerequisite,
          prerequisite_description: formData.hasPrerequisite ? formData.prerequisiteDescription : null,
          deadline: formData.deadline || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          pickup_location: formData.pickupLocation || null,
          dropoff_location: formData.dropoffLocation || null,
        }] as any);

        if (error) throw error;
        toast.success("Request posted successfully!");
      }
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        requestType: "skill_for_skill",
        offering: "",
        moneyAmount: "",
        category: "",
        hasPrerequisite: false,
        prerequisiteDescription: "",
        deadline: "",
        pickupLocation: "",
        dropoffLocation: "",
      });
      setImageFiles([]);
      setEditingRequestId(null);
      
      setActiveTab("your-requests");
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
    money_for_skill: "Money ↔ Skill",
    money_for_item: "Money ↔ Item",
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
          <h1 className="text-4xl font-bold mb-2">Requests</h1>
          <p className="text-muted-foreground">Post new requests or manage your existing ones</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="form">Post Request</TabsTrigger>
            <TabsTrigger value="your-requests">Your Requests</TabsTrigger>
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
                    <CardTitle className="text-2xl">
                      {editingRequestId ? "Edit Request" : "Request Details"}
                    </CardTitle>
                    <CardDescription>
                      {editingRequestId ? "Update your request information" : "Fill in all required information carefully"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">What do you need? *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Someone to buy me lunch from canteen"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={errors.title ? "border-destructive rounded-xl" : "rounded-xl"}
                      required
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive rounded-xl" : "rounded-xl"}>
                          <SelectValue placeholder="Pick a category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requestType">Exchange Type *</Label>
                      <Select
                        value={formData.requestType}
                        onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="skill_for_skill">Skill ↔ Skill</SelectItem>
                          <SelectItem value="skill_for_item">Skill ↔ Item</SelectItem>
                          <SelectItem value="skill_for_money">Skill ↔ Money</SelectItem>
                          <SelectItem value="item_for_skill">Item ↔ Skill</SelectItem>
                          <SelectItem value="item_for_item">Item ↔ Item</SelectItem>
                          <SelectItem value="item_for_money">Item ↔ Money</SelectItem>
                          <SelectItem value="money_for_skill">Money ↔ Skill</SelectItem>
                          <SelectItem value="money_for_item">Money ↔ Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offering">What are you offering? *</Label>
                    <Input
                      id="offering"
                      placeholder="e.g., I'll write your assignment OR ₹150"
                      value={formData.offering}
                      onChange={(e) => setFormData({ ...formData, offering: e.target.value })}
                      className={errors.offering ? "border-destructive rounded-xl" : "rounded-xl"}
                      required
                    />
                    {errors.offering && <p className="text-sm text-destructive">{errors.offering}</p>}
                  </div>

                  {formData.requestType.includes("money") && (
                    <div className="space-y-2">
                      <Label htmlFor="moneyAmount">Amount (₹) *</Label>
                      <Input
                        id="moneyAmount"
                        type="number"
                        placeholder="150"
                        value={formData.moneyAmount}
                        onChange={(e) => setFormData({ ...formData, moneyAmount: e.target.value })}
                        className={errors.moneyAmount ? "border-destructive rounded-xl" : "rounded-xl"}
                      />
                      {errors.moneyAmount && <p className="text-sm text-destructive">{errors.moneyAmount}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Details *</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell more about what you need... e.g., Need it by 3pm today, will pay after delivery"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={errors.description ? "border-destructive rounded-xl" : "rounded-xl"}
                      rows={3}
                      required
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/2000 characters
                    </p>
                  </div>

                  <details className="group">
                    <summary className="cursor-pointer font-medium text-sm flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <span>⚙️ Advanced Options</span>
                      <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-4 space-y-4 p-4 border rounded-xl">
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                          id="deadline"
                          type="datetime-local"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasPrerequisite"
                          checked={formData.hasPrerequisite}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, hasPrerequisite: checked as boolean })
                          }
                        />
                        <Label htmlFor="hasPrerequisite" className="cursor-pointer text-sm">
                          Has prerequisites (conditions before starting)
                        </Label>
                      </div>

                      {formData.hasPrerequisite && (
                        <Textarea
                          placeholder="What needs to be done first?"
                          value={formData.prerequisiteDescription}
                          onChange={(e) =>
                            setFormData({ ...formData, prerequisiteDescription: e.target.value })
                          }
                          className="rounded-xl"
                          rows={2}
                        />
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="images">Images (Optional, max 5)</Label>
                        <Input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="rounded-xl"
                        />
                        {imageFiles.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {imageFiles.map((file, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </details>

                  <div className="flex max-[499px]:flex-col gap-3">
                    {editingRequestId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingRequestId(null);
                          setFormData({
                            title: "",
                            description: "",
                            requestType: "skill_for_skill",
                            offering: "",
                            moneyAmount: "",
                            category: "",
                            hasPrerequisite: false,
                            prerequisiteDescription: "",
                            deadline: "",
                            pickupLocation: "",
                            dropoffLocation: "",
                          });
                          setImageFiles([]);
                          setActiveTab("your-requests");
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setActiveTab("preview")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Request
                    </Button>
                    <Button type="submit" className="flex-1" size="lg" disabled={loading || uploadingImages}>
                      {(loading || uploadingImages) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingRequestId ? "Update Request" : "Post Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="your-requests">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Your Requests</h2>
                <p className="text-sm text-muted-foreground">Manage your posted requests</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchYourRequests()}
                disabled={loadingRequests}
              >
                <RefreshCw className={`h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {loadingRequests ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">You haven't posted any requests yet</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab("form")}
                  >
                    Create Your First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((request) => (
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{formData.title || "Your Request Title"}</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formData.category || "Category"}</Badge>
                  <Badge>{requestTypeLabels[formData.requestType]}</Badge>
                  {formData.deadline && (
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(formData.deadline).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {imageFiles.map((file, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {formData.description || "Your detailed description will appear here..."}
                  </p>
                </div>

                <Separator />

                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Offering</h4>
                  <p className="text-lg">{formData.offering || "What you're offering"}</p>
                  {formData.moneyAmount && (
                    <p className="text-2xl font-bold text-accent mt-2">₹{formData.moneyAmount}</p>
                  )}
                </div>

                {formData.hasPrerequisite && formData.prerequisiteDescription && (
                  <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-3">
                    <h4 className="font-semibold">Prerequisites Required</h4>
                    <p className="text-sm text-muted-foreground">{formData.prerequisiteDescription}</p>
                    {(formData.pickupLocation || formData.dropoffLocation) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {formData.pickupLocation && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs font-medium">Pickup</p>
                              <p className="text-xs text-muted-foreground">{formData.pickupLocation}</p>
                            </div>
                          </div>
                        )}
                        {formData.dropoffLocation && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs font-medium">Dropoff</p>
                              <p className="text-xs text-muted-foreground">{formData.dropoffLocation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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