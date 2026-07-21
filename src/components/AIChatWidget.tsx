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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "@/types";

interface AIChatWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessages?: AssistantMessage[];
  position?: "bottom-right" | "bottom-left";
  className?: string;
}

export function AIChatWidget({
  isOpen,
  onOpenChange,
  initialMessages,
  position = "bottom-right",
  className,
}: AIChatWidgetProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(
    initialMessages || [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm the AnonBlood assistant. I can help with blood donation questions, compatibility info, and finding donation centers. How can I help?",
        timestamp: new Date(),
        scope: "public",
      },
    ]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AssistantMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (you can replace this with actual API call)
    setTimeout(() => {
      const lower = userMsg.content.toLowerCase();
      let response: string;
      let scope: "public" | "personal" | "out_of_scope" = "public";

      if (lower.includes("nearest") || lower.includes("donation center") || lower.includes("blood bank")) {
        response = `Based on our database, the nearest blood donation centers are:\n\n1. **Philippine Red Cross - Manila** — Bonifacio Drive, Port Area\n2. **PGH Blood Bank** — Taft Avenue, Ermita\n3. **St. Luke's Medical Center** — Quezon City\n\nWould you like directions to any of these?`;
      } else if (lower.includes("compatible") || lower.includes("donate to")) {
        response = `Blood type compatibility:\n\n- **O-** can donate to: all types (universal donor)\n- **O+** can donate to: O+, A+, B+, AB+\n- **A-** can donate to: A-, A+, AB-, AB+\n- **B-** can donate to: B-, B+, AB-, AB+\n- **AB+** can donate to: AB+ only (universal recipient)\n\nWhich type are you asking about?`;
      } else if (lower.includes("weight") || lower.includes("eligible")) {
        response = `According to WHO and DOH guidelines, to donate blood you generally need to:\n\n- Be at least 17 years old\n- Weigh at least 50 kg (110 lbs)\n- Be in good health\n- Not have donated whole blood in the last 12 weeks\n\nSpecific conditions may affect eligibility. Would you like more details?`;
      } else if (lower.includes("personal") || lower.includes("my") || lower.includes("account")) {
        response = `I can't access personal account information in public mode. Please log in to ask questions about your specific eligibility or donation history.`;
        scope = "out_of_scope";
      } else {
        response = `Good question! For the most accurate information, I recommend checking the WHO blood donation guidelines or speaking with a medical professional. Is there something specific about blood donation I can help clarify?`;
      }

      const aiMsg: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        scope,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1200);
  };

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
            <div className="bg-primary p-4 text-white z-50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">AnonBlood Assistant</span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                <Shield className="h-3 w-3 inline mr-1" /> Public mode — no personal data
              </p>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white border text-dark rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.scope === "out_of_scope" && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        (Out of scope — login required)
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-md px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about blood donation..."
                  className="flex-1 text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
