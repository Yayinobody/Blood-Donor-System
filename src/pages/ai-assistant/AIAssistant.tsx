import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Shield,
  Droplets,
  Heart,
  Loader2,
  Lock,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "@/types";

// Mock donor data (in real app, fetched from auth context / API)
const MOCK_DONOR_DATA = {
  display_id: "Donor #482",
  blood_type: "O-",
  last_donation_date: "2026-04-20",
  next_eligible_date: "2026-07-20",
  availability_status: "available" as const,
  verification_level: "strong" as const,
  total_donations: 4,
};

const suggestions = [
  "Am I eligible to donate right now?",
  "When was my last donation?",
  "What blood types can O- donate to?",
  "Where is the nearest blood bank?",
  "What's the minimum weight to donate?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello, ${MOCK_DONOR_DATA.display_id}! I'm your personal AnonBlood assistant. I can answer general questions about blood donation and check your personal eligibility. Your data is private and secure. How can I help?`,
      timestamp: new Date(),
      scope: "public",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: AssistantMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const lower = messageText.toLowerCase();
      let response: string;
      let scope: "public" | "personal" | "out_of_scope" = "public";

      // Personal eligibility questions
      if (
        lower.includes("eligible") ||
        lower.includes("can i donate") ||
        lower.includes("am i able")
      ) {
        const today = new Date();
        const nextEligible = new Date(MOCK_DONOR_DATA.next_eligible_date);
        const isEligible = today >= nextEligible;

        if (isEligible) {
          response = `**Yes, you are eligible to donate!** 🎉\n\nYour last donation was on **${MOCK_DONOR_DATA.last_donation_date}**, and your next eligible date was **${MOCK_DONOR_DATA.next_eligible_date}**. That window has passed, so you can donate now.\n\nYour current availability status is: **Available**.\n\nWould you like me to help you find nearby blood banks?`;
        } else {
          const daysLeft = Math.ceil(
            (nextEligible.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          response = `**Not yet.** Your last donation was on **${MOCK_DONOR_DATA.last_donation_date}**. Per WHO/DOH guidelines, you need to wait at least 12 weeks between whole blood donations.\n\nYour next eligible date is **${MOCK_DONOR_DATA.next_eligible_date}** (about ${daysLeft} days from now).\n\nYour availability status is currently set to **resting** to reflect this.`;
        }
        scope = "personal";
      }
      // Last donation
      else if (lower.includes("last donation") || lower.includes("when did i donate")) {
        response = `Your last donation was on **${MOCK_DONOR_DATA.last_donation_date}**. You've made **${MOCK_DONOR_DATA.total_donations} donations** total — thank you for saving lives! 💙\n\nYour next eligible date is **${MOCK_DONOR_DATA.next_eligible_date}**.`;
        scope = "personal";
      }
      // Compatibility
      else if (lower.includes("compatible") || lower.includes("donate to") || lower.includes("can o-")) {
        response = `As an **O-** donor, you're a **universal donor**! Your blood can be given to patients of **any blood type** (A+, A-, B+, B-, AB+, AB-, O+, O-).\n\nThis makes you extremely valuable in emergencies when the patient's blood type is unknown. O- blood is always in high demand.`;
        scope = "public";
      }
      // Nearest blood bank
      else if (lower.includes("nearest") || lower.includes("blood bank") || lower.includes("donation center")) {
        response = `Here are blood donation centers near you:\n\n1. **Philippine Red Cross - Manila** — Bonifacio Drive, Port Area (Open 8AM-5PM)\n2. **PGH Blood Bank** — Taft Avenue, Ermita (Open 24/7)\n3. **St. Luke's Medical Center** — Quezon City (Open 8AM-8PM)\n\nWould you like me to help schedule a donation appointment?`;
        scope = "public";
      }
      // Weight / general eligibility
      else if (lower.includes("weight") || lower.includes("minimum") || lower.includes("requirement")) {
        response = `According to WHO and Philippine DOH guidelines, to donate blood you need to:\n\n- Be at least **17 years old**\n- Weigh at least **50 kg (110 lbs)**\n- Be in **good health** on the day of donation\n- Not have donated whole blood in the **last 12 weeks**\n- Not have any blood-borne infections\n\nCertain medications or recent travel may temporarily defer you. Would you like more specific guidance?`;
        scope = "public";
      }
      // Out of scope
      else if (lower.includes("diagnose") || lower.includes("symptom") || lower.includes("another donor")) {
        response = `I'm not able to provide medical diagnoses or discuss information about other donors. My scope is limited to:\n\n- General blood donation guidelines\n- Your own eligibility and donation history\n- Blood bank locations and compatibility info\n\nPlease consult a medical professional for health concerns.`;
        scope = "out_of_scope";
      }
      // Default
      else {
        response = `Good question! I can help with:\n\n- Your personal donation eligibility and history\n- Blood type compatibility\n- Nearby blood banks and donation centers\n- General donation guidelines (WHO/DOH)\n\nCould you clarify what you'd like to know?`;
        scope = "public";
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
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Health Assistant
        </h1>
        <p className="text-gray-500 mt-1 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Authenticated mode — can access your donation data
          <Badge variant="success" className="ml-2 gap-1 text-xs">
            <CheckCircle className="h-3 w-3" /> {MOCK_DONOR_DATA.display_id}
          </Badge>
        </p>
      </motion.div>

      {/* Chat card */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AnonBlood AI</CardTitle>
              <p className="text-xs text-gray-500">Personal + General Knowledge</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Shield className="h-3 w-3" /> End-to-end encrypted
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
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
                {msg.scope === "personal" && (
                  <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                    <Lock className="h-3 w-3" /> Personal data used
                  </div>
                )}
                {msg.scope === "out_of_scope" && (
                  <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                    <Shield className="h-3 w-3" /> Out of scope
                  </div>
                )}
                <span className="text-[10px] opacity-50 block mt-1">
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
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about eligibility, compatibility, blood banks..."
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
            Your data is never shared. Logged for audit.
          </p>
        </div>
      </Card>
    </div>
  );
}