import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { models } from "@/data/models";
import VerifiedBadge from "@/components/VerifiedBadge";

interface Message {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

const ChatConversation = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const model = models.find((m) => m.slug === slug);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (slug) initConversation();
  }, [user, authLoading, slug]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    // Try to find existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("model_slug", slug!)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
      fetchMessages(existing.id);
    } else {
      // Create new conversation
      const { data: created } = await supabase
        .from("conversations")
        .insert({ user_id: user!.id, model_slug: slug! })
        .select("id")
        .single();

      if (created) {
        setConversationId(created.id);
      }
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_type, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const tempMsg: Message = {
      id: crypto.randomUUID(),
      sender_type: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "user",
        content,
      })
      .select("id, sender_type, content, created_at")
      .single();

    // Replace temp message with real one
    if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data : m)));
    }

    setSending(false);
  };

  if (!model) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(30,20%,97%)]">
        <p className="text-foreground">Conversa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border sticky top-0 z-10">
        <button onClick={() => navigate("/chat")} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <img
          src={model.avatar}
          alt={model.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h1 className="text-sm font-bold text-foreground truncate">{model.name}</h1>
            {model.verified && <VerifiedBadge className="h-4 w-4" />}
          </div>
          <p className="text-[11px] text-muted-foreground">{model.username}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">
              Inicie uma conversa com {model.name} 💬
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender_type === "user"
                  ? "bg-[hsl(24,95%,53%)] text-white rounded-br-md"
                  : "bg-background border border-border text-foreground rounded-bl-md"
              }`}
            >
              <p className="leading-relaxed">{msg.content}</p>
              <p
                className={`text-[10px] mt-1 ${
                  msg.sender_type === "user" ? "text-white/60" : "text-muted-foreground"
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-muted/30 border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(24,95%,53%)] focus:ring-1 focus:ring-[hsl(24,95%,53%)]/20 transition-all"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-[hsl(24,95%,53%)] text-white disabled:opacity-50 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;
