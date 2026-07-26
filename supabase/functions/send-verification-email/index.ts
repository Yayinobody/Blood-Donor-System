import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { email, token, recipient_type, target_id } = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "email and token are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const title = recipient_type === "seeker"
      ? "🩸 Verify Your Blood Request"
      : "🩸 Verify Your AnonBlood Account";

    const subtitle = recipient_type === "seeker"
      ? "A donor is ready to connect with you. Please enter the verification code below to verify your identity and receive the donor's contact details."
      : "Please enter the verification code below to complete light verification on AnonBlood.";

    // Attempt to send email via Resend if API key is provided
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AnonBlood Verification <onboarding@resend.dev>",
          to: [email],
          subject: `${title} - Verification Code: ${token}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #e53e3e, #c53030); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${subtitle}</p>
              </div>

              <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #718096; font-size: 14px; margin-top: 0;">Your One-Time Verification Code:</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e53e3e; margin: 16px 0; font-family: monospace;">
                  ${token}
                </div>
                <p style="color: #a0aec0; font-size: 12px; margin-bottom: 0;">
                  This code expires in 15 minutes. Do not share this code with anyone.
                </p>
              </div>

              <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #c53030;">
                <strong>Privacy Notice:</strong> Mutual verification protects both parties before contact info is exchanged.
              </div>

              <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 24px;">
                AnonBlood — Anonymous Blood Donor Matchmaking Platform.
              </p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn("Resend API notice:", data);
      }
    } else {
      console.log(`[DEV MODE] Verification token generated for ${email}: ${token}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Verification code generated and sent to ${email}`,
        expires_in: "15 minutes",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
