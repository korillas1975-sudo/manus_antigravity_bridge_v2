import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            Manus-Antigravity Chat Bridge
          </h1>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => setLocation("/chat")}>
                  Open Chat
                </Button>
                <Button variant="ghost" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Login with Manus
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isAuthenticated ? (
          <div className="space-y-8">
            <Card className="p-8 bg-card">
              <div className="flex items-center gap-4 mb-6">
                <MessageCircle className="w-12 h-12 text-accent" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome, {user?.name || "User"}!
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    You're ready to start chatting with Manus and Antigravity AI
                  </p>
                </div>
              </div>

              <div className="bg-secondary border border-border rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-foreground mb-2">
                  How it works:
                </h3>
                <ul className="space-y-2 text-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">1.</span>
                    <span>Click "Open Chat" to start a conversation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">2.</span>
                    <span>Type your messages and send them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">3.</span>
                    <span>Connect Antigravity AI using the MCP configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">4.</span>
                    <span>See all three parties communicate in real-time</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => setLocation("/chat")}
                className="w-full py-6 text-lg font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Open Chat Room
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>

            <Card className="p-8 bg-card">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Setup Instructions
              </h3>
              <div className="space-y-4 text-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    For Antigravity Integration:
                  </h4>
                  <p className="text-sm mb-2">
                    Download the MCP Server script from the settings page and
                    follow the configuration guide to connect Antigravity AI to
                    this chat.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-12 bg-card text-center">
            <MessageCircle className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Welcome to Manus-Antigravity Chat Bridge
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              A real-time chat system that lets you communicate with both Manus
              and Antigravity AI in a single conversation.
            </p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="px-8 py-3 text-lg"
            >
              Login with Manus to Get Started
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
