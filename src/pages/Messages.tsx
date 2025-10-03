import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Send, Inbox, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: {
    username: string;
    id: string;
  };
  receiver: {
    username: string;
    id: string;
  };
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchMessages();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username),
          receiver:profiles!messages_receiver_id_fkey(id, username)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);
      
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read && m.receiver.id === currentUserId).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading messages...</p>
              </CardContent>
            </Card>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => {
              const isReceived = message.receiver.id === currentUserId;
              const otherUser = isReceived ? message.sender : message.receiver;
              
              return (
                <Card 
                  key={message.id}
                  className={`cursor-pointer hover:border-primary/40 transition-colors ${
                    !message.is_read && isReceived ? 'border-primary/60 bg-primary/5' : ''
                  }`}
                  onClick={() => isReceived && !message.is_read && markAsRead(message.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {isReceived ? 'From' : 'To'}: {otherUser.username}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            {!message.is_read && isReceived && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs text-primary">
                                <Inbox className="h-3 w-3" />
                                New
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold mb-2">{message.subject}</p>
                    <p className="text-muted-foreground">{message.message}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
