import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

interface ContactDialogProps {
  receiverId: string;
  receiverUsername: string;
  requestId?: string;
  requestTitle?: string;
}

export function ContactDialog({ receiverId, receiverUsername, requestId, requestTitle }: ContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: requestTitle ? `Regarding: ${requestTitle}` : "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to send messages");
        return;
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant1_id.eq.${session.user.id},participant2_id.eq.${receiverId}),and(participant1_id.eq.${receiverId},participant2_id.eq.${session.user.id})`)
        .maybeSingle();

      let conversationId = existingConv?.id;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert([{
            participant1_id: session.user.id,
            participant2_id: receiverId,
            request_id: requestId || null,
          }])
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // Send message
      const { error } = await supabase.from("messages").insert([{
        conversation_id: conversationId,
        sender_id: session.user.id,
        receiver_id: receiverId,
        request_id: requestId || null,
        subject: formData.subject,
        message: formData.message,
      }] as any);

      if (error) throw error;

      toast.success("Message sent successfully!");
      setOpen(false);
      setFormData({ subject: "", message: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Request Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact {receiverUsername}</DialogTitle>
          <DialogDescription>
            Send a message to request their service or ask questions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What's this about?"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe what you need..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              required
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
