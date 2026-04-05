import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { useLocation } from "wouter";

type Message = {
  id: number;
  sessionId: string;
  senderType: "user" | "manus" | "antigravity";
  userId: number | null;
  content: string;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create session
  const createSessionMutation = trpc.chat.getOrCreateSession.useMutation();
  const getMessagesMutation = trpc.chat.getMessages.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  // Initialize session
  useEffect(() => {
    if (!user) return;

    const initSession = async () => {
      try {
        const session = await createSessionMutation.mutateAsync({
          title: `Chat - ${new Date().toLocaleString()}`,
        });
        setSessionId(session.id);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };

    initSession();
  }, [user]);

  // Load messages
  useEffect(() => {
    if (!sessionId) return;

    const loadMessages = async () => {
      try {
        const msgs = await getMessagesMutation.mutateAsync({
          sessionId,
          apiKey: import.meta.env.VITE_MANUS_BRIDGE_API_KEY || "",
        });
        if (msgs) {
          setMessages(msgs);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();

    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    setIsLoading(true);
    try {
      const newMessage = await sendMessageMutation.mutateAsync({
        sessionId,
        content: inputValue,
      });

      setInputValue("");
      // Add message to UI immediately
      if (newMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: 0,
            sessionId,
            senderType: "user",
            userId: user?.id || null,
            content: inputValue,
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case "user":
        return "คุณกรณ์";
      case "manus":
        return "Manus";
      case "antigravity":
        return "Antigravity AI";
      default:
        return "Unknown";
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case "user":
        return "bg-blue-600 text-blue-50";
      case "manus":
        return "bg-purple-600 text-purple-50";
      case "antigravity":
        return "bg-green-600 text-green-50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access the chat</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">
          Manus-Antigravity Chat Bridge
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Session ID: {sessionId || "Loading..."}
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </Card>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderType === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-xs lg:max-w-md px-4 py-3 ${getSenderColor(
                  msg.senderType
                )}`}
              >
                <p className="text-xs font-semibold mb-1">
                  {getSenderLabel(msg.senderType)}
                </p>
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4 shadow-lg">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || !sessionId}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || !sessionId}
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {!sessionId && (
          <p className="text-xs text-muted-foreground mt-2">Initializing session...</p>
        )}
      </div>
    </div>
  );
}
