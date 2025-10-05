import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Send, Loader2, Star, ImagePlus, X, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  image_url?: string | null;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    payment_qr_url?: string | null;
  };
  messages: Message[];
}

interface RatingPrompt {
  dealId: string;
  otherUserId: string;
  otherUsername: string;
  requestTitle: string;
}

export default function Conversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ratingPrompt, setRatingPrompt] = useState<RatingPrompt | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      subscribeToMessages();
      checkForRatingPrompt(selectedConversation);
    }
  }, [selectedConversation]);

  const checkForRatingPrompt = async (conversationId: string) => {
    if (!currentUserId) return;

    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const otherUserId = conversation.participant1_id === currentUserId
        ? conversation.participant2_id
        : conversation.participant1_id;

      // Find active deals between these users where both have verified (ready to rate)
      const { data: deals, error } = await supabase
        .from("deals")
        .select(`
          id,
          status,
          requester_id,
          accepter_id,
          requester_verified_accepter,
          accepter_verified_requester,
          requests!inner(title)
        `)
        .eq("status", "active")
        .eq("requester_verified_accepter", true)
        .eq("accepter_verified_requester", true)
        .or(`and(requester_id.eq.${currentUserId},accepter_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},accepter_id.eq.${currentUserId})`);

      if (error) throw error;

      if (deals && deals.length > 0) {
        // Check if user has already rated this deal
        for (const deal of deals) {
          const { data: existingReview } = await supabase
            .from("reviews")
            .select("id")
            .eq("deal_id", deal.id)
            .eq("reviewer_id", currentUserId)
            .maybeSingle();

          if (!existingReview) {
            // Found a deal that needs rating
            setRatingPrompt({
              dealId: deal.id,
              otherUserId,
              otherUsername: conversation.profiles.username,
              requestTitle: deal.requests.title,
            });
            return;
          }
        }
      }

      setRatingPrompt(null);
    } catch (error) {
      console.error("Error checking for rating prompt:", error);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant1_id.eq.${currentUserId},participant2_id.eq.${currentUserId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch other participant profiles
      const conversationsWithProfiles = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant1_id === currentUserId 
            ? conv.participant2_id 
            : conv.participant1_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, payment_qr_url")
            .eq("id", otherUserId)
            .single();

          return {
            ...conv,
            profiles: profile || { id: otherUserId, username: "Unknown" },
            messages: [],
          };
        })
      );

      setConversations(conversationsWithProfiles);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, message, sender_id, created_at, image_url")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        id: msg.id,
        content: msg.message,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        image_url: msg.image_url,
      })));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`conversation-${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, {
            id: payload.new.id,
            content: payload.new.message,
            sender_id: payload.new.sender_id,
            created_at: payload.new.created_at,
            image_url: payload.new.image_url,
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation || !currentUserId) return;

    setSending(true);
    try {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      const receiverId = conversation.participant1_id === currentUserId
        ? conversation.participant2_id
        : conversation.participant1_id;

      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const messageContent = newMessage || " ";
      const { data, error } = await supabase.from("messages").insert([{
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        receiver_id: receiverId,
        message: messageContent,
        subject: "Conversation",
        image_url: imageUrl,
      }]).select().single();

      if (error) throw error;

      // Immediately add message to local state
      if (data) {
        setMessages((prev) => [...prev, {
          id: data.id,
          content: data.message,
          sender_id: data.sender_id,
          created_at: data.created_at,
          image_url: data.image_url,
        }]);
      }

      setNewMessage("");
      removeImage();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ScrollArea className="h-[400px] sm:h-[600px]">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-2 sm:p-4 rounded-lg text-left transition-colors ${
                        selectedConversation === conv.id
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/profile/${conv.profiles.id}`;
                          }}
                        >
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {conv.profiles.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex-1 truncate">
                {selectedConversation
                  ? conversations.find(c => c.id === selectedConversation)?.profiles.username || "Conversation"
                  : "Select a conversation"}
              </CardTitle>
              {selectedConversation && conversations.find(c => c.id === selectedConversation)?.profiles.payment_qr_url && (
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-auto shrink-0 hover:bg-accent hover:text-accent-foreground transition-all"
                  onClick={() => {
                    const conv = conversations.find(c => c.id === selectedConversation);
                    if (conv?.profiles.payment_qr_url) {
                      setSelectedQrUrl(conv.profiles.payment_qr_url);
                      setQrModalOpen(true);
                    }
                  }}
                  title="View Payment QR Code"
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {selectedConversation ? (
              <div className="space-y-4">
                {ratingPrompt && (
                  <Alert className="bg-primary/10 border-primary/20">
                    <Star className="h-4 w-4 text-primary" />
                    <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm">
                        Rate your experience with {ratingPrompt.otherUsername} for "{ratingPrompt.requestTitle}"
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/rate-deal/${ratingPrompt.dealId}`)}
                        className="w-full sm:w-auto"
                      >
                        Rate Now
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                        }`}
                      >
                         <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                            msg.sender_id === currentUserId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content.trim() && <p className="text-sm">{msg.content}</p>}
                          {msg.image_url && (
                            <div className="relative group mt-2">
                              <img 
                                src={msg.image_url} 
                                alt="Message attachment" 
                                className="max-w-full h-auto max-h-64 rounded-lg"
                              />
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(msg.image_url!);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `message_image_${msg.id}.png`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                    toast.success("Image downloaded!");
                                  } catch (error) {
                                    toast.error("Failed to download image");
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="chat-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => document.getElementById('chat-image')?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={sending}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to make a payment to{" "}
              {selectedConversation && conversations.find(c => c.id === selectedConversation)?.profiles.username}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {selectedQrUrl && (
              <>
                <img 
                  src={selectedQrUrl} 
                  alt="Payment QR Code" 
                  className="max-w-full h-auto rounded-lg"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch(selectedQrUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const username = conversations.find(c => c.id === selectedConversation)?.profiles.username;
                      a.download = `${username}_payment_qr.png`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success("QR code downloaded!");
                    } catch (error) {
                      toast.error("Failed to download QR code");
                    }
                  }}
                  className="w-full gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Download QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
