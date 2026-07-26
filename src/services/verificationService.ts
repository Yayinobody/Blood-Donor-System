import { supabase } from "@/utils/supabaseClient";

export interface VerificationTokenResponse {
  success: boolean;
  message: string;
}

/** Generate a cryptographically random 6-digit OTP string */
function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 900000 + 100000); // always 6 digits
}

export const verificationService = {
  /**
   * Generate a 6-digit OTP, store it in public.verification_tokens,
   * and dispatch it via Pipedream → Brevo email.
   */
  async requestVerificationOtp(
    email: string,
    tokenType: "seeker_verification" | "donor_verification" | "donation_confirmation" = "donor_verification",
    targetId?: string
  ): Promise<VerificationTokenResponse> {
    try {
      const token = generateOtpCode();

      // Store in verification_tokens (expires in 15 minutes)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error: insertError } = await supabase
        .from("verification_tokens")
        .insert({
          email,
          token,
          token_type: tokenType,
          target_id: targetId || null,
          expires_at: expiresAt,
        });

      if (insertError) {
        throw new Error(`Failed to store verification token: ${insertError.message}`);
      }

      // Send via Supabase Edge Function: send-otp
      supabase.functions.invoke("send-otp", {
        body: {
          email,
          otp_code: token,
          token_type: tokenType,
          expires_minutes: 15,
        },
      }).then(({ error }) => {
        if (error) console.warn("OTP Edge function notice:", error.message);
      });

      return {
        success: true,
        message: `Verification code sent to ${email}.`,
      };
    } catch (err: any) {
      console.error("requestVerificationOtp error:", err.message);
      throw err;
    }
  },

  /**
   * Verify the OTP code against public.verification_tokens.
   * Checks: matching email + token, correct type, not expired, not already used.
   * On success: marks token as used and updates public.users.is_verified.
   */
  async verifyEmailOtp(
    email: string,
    token: string,
    userId?: string,
    tokenType: "seeker_verification" | "donor_verification" | "donation_confirmation" = "donor_verification",
    targetId?: string
  ): Promise<boolean> {
    try {
      // Fetch matching unused, unexpired token
      const { data: rows, error: fetchErr } = await supabase
        .from("verification_tokens")
        .select("id, expires_at, used_at")
        .eq("email", email)
        .eq("token", token)
        .eq("token_type", tokenType)
        .is("used_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchErr) throw new Error(fetchErr.message);
      if (!rows || rows.length === 0) {
        throw new Error("Invalid verification code. Please check and try again.");
      }

      const row = rows[0];

      // Check expiry
      if (new Date(row.expires_at) < new Date()) {
        throw new Error("Verification code has expired. Please request a new one.");
      }

      // Mark token as used
      await supabase
        .from("verification_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", row.id);

      // Mark user as light-verified in public.users
      if (userId) {
        await supabase
          .from("users")
          .update({
            is_verified: true,
            verification_method: "email",
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }

      // For seeker verification — mark the request as verified
      if (tokenType === "seeker_verification" && targetId) {
        await supabase
          .from("requests")
          .update({ is_verified: true })
          .eq("id", targetId);
      }

      return true;
    } catch (err: any) {
      console.error("verifyEmailOtp error:", err.message);
      throw err;
    }
  },

  /**
   * Verify a phone OTP (SMS) via Supabase Auth.
   * On success, marks user as phone-verified in public.users.
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
            updated_at: new Date().toISOString(),
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
   * Submit Strong Verification (Government ID upload) for Admin review.
   * Stores in public.verification_submissions.
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

      if (uploadError) {
        console.warn("ID upload warning:", uploadError.message);
      }

      const { data: submission, error: dbError } = await supabase
        .from("verification_submissions")
        .insert({
          user_id: userId,
          verification_type: "strong",
          status: "pending",
          id_document_url: filePath,
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
   * Generate a unique UUID accept-link token for the seeker and send them
   * an "Accept & See Donor Details" email via Pipedream → Brevo.
   * Token stored in verification_tokens with type seeker_verification.
   */
  async generateSeekerAcceptToken(
    matchId: string,
    seekerEmail: string,
    seekerName: string | null,
    hospitalName: string | null,
    bloodType: string,
    donorDisplayId: string
  ): Promise<string> {
    const linkToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("verification_tokens")
      .insert({
        email: seekerEmail,
        token: linkToken,
        token_type: "seeker_verification",
        target_id: matchId,
        expires_at: expiresAt,
      });

    if (error) throw new Error(`Failed to create seeker accept token: ${error.message}`);

    const acceptUrl = `${window.location.origin}/seeker-confirm?token=${linkToken}`;

    // Send seeker the "Accept" email via Supabase Edge Function
    supabase.functions.invoke("send-seeker-accept", {
      body: {
        seeker_email: seekerEmail,
        seeker_name: seekerName || "Blood Seeker",
        hospital_name: hospitalName || "your hospital",
        blood_type: bloodType,
        donor_display_id: donorDisplayId,
        accept_url: acceptUrl,
      },
    }).then(({ error }) => {
      if (error) console.warn("Seeker accept email notice:", error.message);
    });

    return linkToken;
  },

  /**
   * Light verification for seekers — marks the request as verified.
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
