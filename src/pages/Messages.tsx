import { useEffect, useState, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "../components/Header";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Conversation, Message } from "../types";

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await api.get<Conversation[]>("/conversations");
      setConversations(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conv: Conversation) => {
    setSelected(conv);
    try {
      const data = await api.get<Conversation>(`/conversations/${conv.id}`);
      setMessages(data.messages ?? []);
    } catch {}
  };

  const sendMessage = async () => {
    if (!text.trim() || !selected) return;
    setSending(true);
    try {
      const msg = await api.post<Message>(`/conversations/${selected.id}/messages`, { content: text.trim() });
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch {
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Messages" onRefresh={fetchConversations} loading={loading} />

      <div className="flex-1 flex overflow-hidden">
        {/* Liste conversations */}
        <div className="w-72 border-r border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-xs text-gray-400 text-center py-8">Chargement...</div>
            ) : conversations.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-8 px-4">
                Aucune conversation
              </div>
            ) : (
              conversations.map((conv) => {
                const last = conv.messages?.[conv.messages.length - 1];
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selected?.id === conv.id ? "bg-[#f0faf5]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fern to-forest flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                        {conv.buyer?.name?.slice(0, 1).toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{conv.buyer?.name ?? `Conversation #${conv.id}`}</p>
                        {last && (
                          <p className="text-[11px] text-gray-400 truncate">{last.content}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Zone chat */}
        {selected ? (
          <div className="flex-1 flex flex-col bg-[#f8faf9] overflow-hidden">
            {/* Header chat */}
            <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fern to-forest flex items-center justify-center text-xs font-black text-white">
                {selected.buyer?.name?.slice(0, 1).toUpperCase() ?? "?"}
              </div>
              <p className="text-sm font-bold">{selected.buyer?.name ?? `Conv. #${selected.id}`}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-fern text-white rounded-br-sm"
                          : "bg-white border border-gray-100 text-[#1E2D24] rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.content}
                      <p className={`text-[10px] mt-0.5 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                        {format(new Date(msg.createdAt), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 px-5 py-3 flex items-center gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Écrire un message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-fern focus:ring-2 focus:ring-fern/10 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="w-9 h-9 bg-fern rounded-xl flex items-center justify-center text-white hover:bg-forest transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <MessageCircle size={32} className="text-gray-300" />
            <p className="text-sm font-medium">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
