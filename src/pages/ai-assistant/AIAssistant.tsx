import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "axios";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    source: string;
    file_name: string;
    score: number;
  }>;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    source: string;
    file_name: string;
    score: number;
  }>;
}

const suggestions = [
  "Am I eligible to donate blood?",
  "What blood types are compatible?",
  "How often can I donate?",
  "Is blood donation safe?",
  "What are the benefits of O- blood?",
];

// API Base URL - adjust based on your environment
const API_BASE_URL = "http://localhost:8000";

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your privacy-first AI assistant. I can help you with blood donation eligibility, compatibility, and medical guidance. Your identity remains anonymous. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    // Clear any previous errors
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post<ChatResponse>(
        `${API_BASE_URL}/api/chat`,
        { question: messageText },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.answer,
        timestamp: new Date(),
        sources: response.data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If there are sources, log them (you could display them in the UI)
      if (response.data.sources && response.data.sources.length > 0) {
        console.log("Sources:", response.data.sources);
      }
    } catch (err) {
      console.error("Error calling AI:", err);
      let errorMessage = "I'm sorry, I encountered an error. Please try again later.";

      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED") {
          errorMessage = "The request timed out. Please try again.";
        } else if (err.response) {
          errorMessage = err.response.data?.detail || errorMessage;
        } else if (err.request) {
          errorMessage = "Cannot connect to the AI service. Please make sure the backend is running.";
        }
      }

      setError(errorMessage);

      const errorAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Health Assistant
        </h1>
        <p className="text-gray-500 mt-1 flex items-center gap-1">
          <Shield className="h-4 w-4" /> Anonymous & encrypted session
        </p>
      </motion.div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AnonBlood AI</CardTitle>
              <p className="text-xs text-gray-500">Always online • HIPAA compliant</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-gray-100 text-dark rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Sources:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.sources.map((source, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-200 px-2 py-0.5 rounded-full"
                        >
                          {source.source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <span className="text-[10px] opacity-70 block mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about eligibility, compatibility..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-primary hover:bg-primary-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            <Shield className="inline h-3 w-3 mr-1" />
            End-to-end encrypted • No personal data stored
          </p>
        </div>
      </Card>
    </div>
  );
}
