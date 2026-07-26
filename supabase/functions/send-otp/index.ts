import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp_code, expires_minutes = 15 } = await req.json();
    const brevoKey = Deno.env.get("BREVO_API_KEY");

    if (!brevoKey) {
      throw new Error("BREVO_API_KEY environment variable is missing.");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "AnonBlood", email: "rohanprogramacc@gmail.com" },
        to: [{ email }],
        subject: "Your AnonBlood Verification Code",
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:20px">
            <div style="text-align:center;margin-bottom:24px">
              <h2 style="color:#e11d48;margin:0">🩸 AnonBlood</h2>
              <p style="color:#666;margin-top:4px">Blood Donor Verification</p>
            </div>
            <p style="color:#333">You accepted a blood request. Enter this code to verify your identity:</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:10px;
                        background:#fff0f3;padding:24px;border-radius:12px;
                        text-align:center;color:#e11d48;margin:20px 0">
              ${otp_code}
            </div>
            <p style="color:#888;font-size:13px;text-align:center">
              This code expires in <strong>${expires_minutes} minutes</strong>.<br/>
              Do not share this code with anyone.
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:11px;color:#aaa;text-align:center">
              AnonBlood — Blood Donor Matchmaking Platform.<br/>
              If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API Error: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
