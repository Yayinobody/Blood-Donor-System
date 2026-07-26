import { supabase } from "@/utils/supabaseClient";

export interface VerificationTokenResponse {
  success: boolean;
  message: string;
  token?: string;
}

export const verificationService = {
  /**
   * Request and send a secure one-time verification OTP token to an email address.
   * Calls DB RPC `generate_verification_token` and dispatches email via Edge Function.
   */
  async requestVerificationOtp(
    email: string,
    tokenType: "seeker_verification" | "donor_verification" | "donation_confirmation" = "donor_verification",
    targetId?: string
  ): Promise<VerificationTokenResponse> {
    try {
      // 1. Call database RPC to generate secure token with 15m expiration
      const { data, error } = await supabase.rpc("generate_verification_token", {
        p_email: email,
        p_token_type: tokenType,
        p_target_id: targetId || null,
      });

      if (error) {
        throw new Error(`Failed to generate verification token: ${error.message}`);
      }

      const generatedToken = data?.token;

      // 2. Dispatch email via Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && generatedToken) {
        fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            email,
            token: generatedToken,
            recipient_type: tokenType === "seeker_verification" ? "seeker" : "donor",
            target_id: targetId,
          }),
        }).catch((err) => console.warn("Email dispatch notification notice:", err));
      }

      return {
        success: true,
        message: `Verification code sent to ${email}.`,
        token: generatedToken,
      };
    } catch (err: any) {
      console.error("requestVerificationOtp error:", err.message);
      throw err;
    }
  },

  /**
   * Verify a secure one-time token using DB RPC `verify_one_time_token` or Supabase Auth.
   * NO MOCK FALLBACKS — Strict verification.
   */
  async verifyEmailOtp(
    email: string,
    token: string,
    userId?: string,
    tokenType: "seeker_verification" | "donor_verification" | "donation_confirmation" = "donor_verification",
    targetId?: string
  ): Promise<boolean> {
    try {
      // 1. Try DB RPC verify_one_time_token first
      const { data: rpcData, error: rpcErr } = await supabase.rpc("verify_one_time_token", {
        p_email: email,
        p_token: token,
        p_token_type: tokenType,
        p_target_id: targetId || userId || null,
      });

      if (!rpcErr && rpcData?.success) {
        return true;
      }

      // 2. Fallback to Supabase Auth verifyOtp if standard auth session OTP was used
      const { data: authData, error: authErr } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (authErr) {
        const errorMsg = rpcData?.message || authErr.message || "Invalid or expired verification code.";
        throw new Error(errorMsg);
      }

      // Update user verification status in public.users if auth OTP succeeded
      const verifiedId = authData.user?.id || userId;
      if (verifiedId) {
        await supabase
          .from("users")
          .update({
            is_verified: true,
            verification_method: "email",
            verified_at: new Date().toISOString(),
          })
          .eq("id", verifiedId);
      }

      return true;
    } catch (err: any) {
      console.error("verifyEmailOtp error:", err.message);
      throw err;
    }
  },

  /**
   * Complete Light Verification for Phone SMS OTP code via Supabase Auth.
   */
  async verifyPhoneOtp(phone: string, token: string, userId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (error) {
        throw new Error(error.message || "Invalid SMS verification code.");
      }

      const verifiedUserId = data.user?.id || userId;
      if (verifiedUserId) {
        await supabase
          .from("users")
          .update({
            phone,
            is_verified: true,
            verification_method: "phone",
            verified_at: new Date().toISOString(),
          })
          .eq("id", verifiedUserId);
      }

      return true;
    } catch (err: any) {
      console.error("verifyPhoneOtp error:", err.message);
      throw err;
    }
  },

  /**
   * Submit Strong Verification (Government ID Document Upload) for Admin Review.
   */
  async submitStrongVerification(
    userId: string,
    file: File,
    idDocumentType: string
  ): Promise<{ submissionId: string }> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `verification-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file, { upsert: true });

      const documentUrl = uploadError ? filePath : filePath;

      const { data: submission, error: dbError } = await supabase
        .from("verification_submissions")
        .insert({
          user_id: userId,
          verification_type: "strong",
          status: "pending",
          id_document_url: documentUrl,
          id_document_type: idDocumentType,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return { submissionId: submission.id };
    } catch (err: any) {
      console.error("Strong verification submission error:", err.message);
      throw err;
    }
  },

  /**
   * Verify seeker's request (Light verification for seekers).
   */
  async verifySeekerRequest(requestId: string, email?: string, token?: string): Promise<boolean> {
    if (email && token) {
      return await this.verifyEmailOtp(email, token, undefined, "seeker_verification", requestId);
    }
    const { error } = await supabase
      .from("requests")
      .update({ is_verified: true })
      .eq("id", requestId);

    if (error) throw error;
    return true;
  },
};
