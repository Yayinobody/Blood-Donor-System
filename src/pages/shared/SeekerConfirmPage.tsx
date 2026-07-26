import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, XCircle, Droplets, Mail } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import toast from "react-hot-toast";

type PageState = "loading" | "confirmed" | "already_used" | "error";

export default function SeekerConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<PageState>("loading");
  const [donorEmail, setDonorEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("No confirmation token found in this link.");
      return;
    }
    handleSeekerConfirm(token);
  }, [token]);

  const handleSeekerConfirm = async (linkToken: string) => {
    try {
      // 1. Look up the token in verification_tokens
      const { data: rows, error: tokenErr } = await supabase
        .from("verification_tokens")
        .select("id, email, target_id, expires_at, used_at")
        .eq("token", linkToken)
        .eq("token_type", "seeker_verification")
        .limit(1);

      if (tokenErr) throw new Error(tokenErr.message);
      if (!rows || rows.length === 0) {
        setErrorMsg("This confirmation link is invalid or has already expired.");
        setState("error");
        return;
      }

      const row = rows[0];

      // Already used — seeker already confirmed
      if (row.used_at) {
        setState("already_used");
        return;
      }

      // Check expiry
      if (new Date(row.expires_at) < new Date()) {
        setErrorMsg("This confirmation link has expired (links are valid for 24 hours).");
        setState("error");
        return;
      }

      const matchId = row.target_id;
      const seekerEmail = row.email;

      // 2. Fetch match + donor + request details
      const { data: match, error: matchErr } = await supabase
        .from("request_matches")
        .select(`
          id, donor_id, request_id,
          requests:request_id (
            id, seeker_name, hospital_name, blood_type_needed
          ),
          users:donor_id (
            id, full_name, email, phone, display_id
          )
        `)
        .eq("id", matchId)
        .single();

      if (matchErr || !match) throw new Error("Could not load match details.");

      const donor = Array.isArray(match.users) ? match.users[0] : match.users;
      const request = Array.isArray(match.requests) ? match.requests[0] : match.requests;

      if (!donor || !donor.email) throw new Error("Donor details not available.");

      // 3. Mark token as used
      await supabase
        .from("verification_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", row.id);

      // 4. Mark seeker's request as verified
      await supabase
        .from("requests")
        .update({ is_verified: true })
        .eq("id", match.request_id);

      // 5. Mark contact as revealed in request_matches
      await supabase
        .from("request_matches")
        .update({
          status: "contact_revealed",
          contact_revealed: true,
          revealed_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      // 6. Log to contact_reveal_audit
      await supabase
        .from("contact_reveal_audit")
        .insert({
          request_id: match.request_id,
          donor_id: match.donor_id,
          seeker_email: seekerEmail,
          reveal_timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        });

      // 7. Send donor details email to seeker via Supabase Edge Function
      supabase.functions.invoke("send-seeker-details", {
        body: {
          seeker_email: seekerEmail,
          seeker_name: request?.seeker_name || "Blood Seeker",
          donor_display_id: donor.display_id,
          donor_email: donor.email,
          donor_phone: donor.phone || null,
          hospital_name: request?.hospital_name || "your hospital",
          blood_type: request?.blood_type_needed,
        },
      }).then(({ error }) => {
        if (error) console.warn("Seeker details email notice:", error.message);
      });

      setDonorEmail(donor.email);
      setState("confirmed");
    } catch (err: any) {
      console.error("SeekerConfirmPage error:", err.message);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 to-accent/10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 shadow-xl border border-white/20 backdrop-blur-xl text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-dark">
              Anon<span className="text-primary">Blood</span>
            </span>
          </div>

          {/* Loading */}
          {state === "loading" && (
            <div className="py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-500">Confirming your request…</p>
            </div>
          )}

          {/* Success */}
          {state === "confirmed" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-dark">Confirmed!</h2>
              <p className="text-gray-500 text-sm">
                You've accepted the match. The donor's contact details have been sent to your email address.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-dark">
                  <Mail className="h-4 w-4 text-primary" /> Check your inbox
                </div>
                <p>
                  We've sent the donor's contact details to <strong>{donorEmail ? "your email" : "your registered email"}</strong>. Please check your inbox (and spam folder).
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-left">
                <strong>🔔 Safety reminder:</strong> AnonBlood's role ends here. Please coordinate with the donor through proper medical channels. Meet in hospital or clinical settings for the actual donation.
              </div>
            </motion.div>
          )}

          {/* Already used */}
          {state === "already_used" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-dark">Already Confirmed</h2>
              <p className="text-gray-500 text-sm">
                You've already accepted this match. The donor's contact details were sent to your email when you first clicked the link.
              </p>
            </motion.div>
          )}

          {/* Error */}
          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-dark">Link Invalid</h2>
              <p className="text-gray-500 text-sm">{errorMsg}</p>
              <p className="text-xs text-gray-400">
                If you believe this is an error, contact the donor directly or submit a new request.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
