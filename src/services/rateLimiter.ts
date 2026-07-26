import { supabase } from "@/utils/supabaseClient";

const DAILY_REQUEST_LIMIT = 3;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string; // ISO midnight of next day
  message?: string;
}

function getMidnightTodayUtc(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export const rateLimiter = {
  /**
   * Check if a seeker identifier (email, phone, or IP) can submit another blood request today.
   * Returns { allowed, remaining, resetAt }.
   */
  async checkRequestLimit(identifier: string): Promise<RateLimitResult> {
    const { start, end } = getMidnightTodayUtc();
    const resetAt = end;

    try {
      const { count, error } = await supabase
        .from("rate_limit_logs")
        .select("id", { count: "exact", head: true })
        .eq("identifier", identifier)
        .eq("request_type", "blood_request")
        .gte("timestamp", start)
        .lt("timestamp", end);

      if (error) throw error;

      const used = count ?? 0;
      const remaining = Math.max(0, DAILY_REQUEST_LIMIT - used);
      const allowed = remaining > 0;

      if (!allowed) {
        // Log this blocked attempt
        await this._logAttempt(identifier, "blood_request", true);
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          message: `You have reached today's request limit (${DAILY_REQUEST_LIMIT} per day). Please try again tomorrow.`,
        };
      }

      return { allowed: true, remaining, resetAt };
    } catch (err: any) {
      console.error("Rate limit check error:", err.message);
      // Fail open — if we can't check, allow the request (don't block users due to infra issues)
      return { allowed: true, remaining: 1, resetAt };
    }
  },

  /**
   * Record a successful request submission for rate-limiting tracking.
   */
  async recordRequest(identifier: string, type: string = "blood_request"): Promise<void> {
    await this._logAttempt(identifier, type, false);
  },

  /**
   * Check if an AI chat session identifier is rate-limited.
   * Separate limit for chatbot queries to prevent LLM scraping.
   */
  async checkChatLimit(identifier: string): Promise<RateLimitResult> {
    const CHAT_DAILY_LIMIT = 50;
    const { start, end } = getMidnightTodayUtc();
    const resetAt = end;

    try {
      const { count, error } = await supabase
        .from("rate_limit_logs")
        .select("id", { count: "exact", head: true })
        .eq("identifier", identifier)
        .eq("request_type", "ai_chat")
        .gte("timestamp", start)
        .lt("timestamp", end);

      if (error) throw error;

      const used = count ?? 0;
      const remaining = Math.max(0, CHAT_DAILY_LIMIT - used);
      const allowed = remaining > 0;

      if (!allowed) {
        await this._logAttempt(identifier, "ai_chat", true);
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          message: `AI chat daily limit reached. Please try again tomorrow.`,
        };
      }

      return { allowed: true, remaining, resetAt };
    } catch {
      return { allowed: true, remaining: 10, resetAt };
    }
  },

  async _logAttempt(identifier: string, type: string, blocked: boolean): Promise<void> {
    try {
      await supabase.from("rate_limit_logs").insert({
        identifier,
        request_type: type,
        timestamp: new Date().toISOString(),
        blocked,
      });
    } catch (err: any) {
      console.warn("Rate limit log insert failed:", err.message);
    }
  },
};
