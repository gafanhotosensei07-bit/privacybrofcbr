import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { models } from "@/data/models";

interface ConversationWithLastMessage {
  id: string;
  model_slug: string;
  last_message?: string;
  last_message_at?: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConversations();
  }, [user, authLoading]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, model_slug, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch last message for each conversation
      const convos: ConversationWithLastMessage[] = [];
      for (const conv of data) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        convos.push({
          id: conv.id,
          model_slug: conv.model_slug,
          last_message: msgs?.[0]?.content,
          last_message_at: msgs?.[0]?.created_at,
        });
      }
      setConversations(convos);
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[hsl(30,20%,97%)] flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <img src={logoIcon} alt="Privacy" className="h-10" />
        <h1 className="text-base font-bold text-foreground">Mensagens</h1>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Vá ao perfil de uma criadora e clique em "Enviar mensagem"
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => {
              const model = models.find((m) => m.slug === conv.model_slug);
              if (!model) return null;

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.model_slug}`)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <img
                    src={model.avatar}
                    alt={model.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-[hsl(24,95%,53%)]/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{model.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message || "Nenhuma mensagem"}
                    </p>
                  </div>
                  {conv.last_message_at && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {new Date(conv.last_message_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
