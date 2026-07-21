import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "@/types";
import axios from "axios";

interface AIChatWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessages?: AssistantMessage[];
  position?: "bottom-right" | "bottom-left";
  className?: string;
  apiBaseUrl?: string; // Allow custom API URL
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    source: string;
    file_name: string;
    score: number;
  }>;
}

// Default API Base URL
const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function AIChatWidget({
  isOpen,
  onOpenChange,
  initialMessages,
  position = "bottom-right",
  className,
  apiBaseUrl = DEFAULT_API_BASE_URL,
}: AIChatWidgetProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(
    initialMessages || [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm your privacy-first AI assistant. I can help you with blood donation eligibility, compatibility, and medical guidance. Your identity remains anonymous. How can I help you today?",
        timestamp: new Date(),
        scope: "public",
      },
    ]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || isLoading) return;

    // Clear any previous errors
    setError(null);

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      scope: "public",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post<ChatResponse>(
        `${apiBaseUrl}/api/chat`,
        { question: messageText },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Determine scope based on content or response
      let scope: "public" | "personal" | "out_of_scope" = "public";

      // Check if the question might be personal
      const personalKeywords = ["my", "mine", "me", "personal", "account", "history", "my blood type"];
      if (personalKeywords.some(keyword => messageText.toLowerCase().includes(keyword))) {
        scope = "out_of_scope";
      }

      // Check if response contains sources
      const hasSources = response.data.sources && response.data.sources.length > 0;

      const aiMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.answer,
        timestamp: new Date(),
        scope,
        // Add sources as metadata if needed
        metadata: hasSources ? { sources: response.data.sources } : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Log sources for debugging
      if (hasSources) {
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

      const errorAiMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
        scope: "public",
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

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const positionClasses = {
    "bottom-right": "bottom-24 right-6",
    "bottom-left": "bottom-24 left-6",
  };

  const buttonPositionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "fixed z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-600 transition-colors flex items-center justify-center",
          buttonPositionClasses[position],
          className
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden",
              positionClasses[position],
              className
            )}
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">AnonBlood AI</span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                <Shield className="h-3 w-3 inline mr-1" /> Anonymous & encrypted session
              </p>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white border text-dark rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Display sources if available */}
                    {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Sources:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {msg.metadata.sources.map((source, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 px-2 py-0.5 rounded-full"
                            >
                              {source.source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.scope === "out_of_scope" && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        (Personal data not accessible in public mode)
                      </p>
                    )}

                    <span className="text-[10px] opacity-70 block mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about eligibility, compatibility..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary hover:bg-primary-600 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                <Shield className="inline h-3 w-3 mr-1" />
                End-to-end encrypted • No personal data stored
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Optional: Custom hook to manage chat state globally
export function useAIChat(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return {
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen((prev) => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
