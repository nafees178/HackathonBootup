import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Send, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
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
            .select("id, username")
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

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, message, sender_id, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        id: msg.id,
        content: msg.message,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
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
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    setSending(true);
    try {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      const receiverId = conversation.participant1_id === currentUserId
        ? conversation.participant2_id
        : conversation.participant1_id;

      const messageContent = newMessage;
      const { data, error } = await supabase.from("messages").insert([{
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        receiver_id: receiverId,
        message: messageContent,
        subject: "Conversation",
      }]).select().single();

      if (error) throw error;

      // Immediately add message to local state
      if (data) {
        setMessages((prev) => [...prev, {
          id: data.id,
          content: data.message,
          sender_id: data.sender_id,
          created_at: data.created_at,
        }]);
      }

      setNewMessage("");
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
            <CardTitle>
              {selectedConversation
                ? conversations.find(c => c.id === selectedConversation)?.profiles.username || "Conversation"
                : "Select a conversation"}
            </CardTitle>
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
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
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
    </div>
  );
}
