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
    const {
      seeker_email,
      seeker_name = "Blood Seeker",
      hospital_name = "your hospital",
      blood_type,
      donor_display_id,
      accept_url,
    } = await req.json();

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
        to: [{ email: seeker_email, name: seeker_name }],
        subject: "🩸 A Donor Accepted Your Blood Request — Action Required",
        htmlContent: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:20px">
            <div style="text-align:center;margin-bottom:24px">
              <h2 style="color:#e11d48;margin:0">🩸 AnonBlood</h2>
              <p style="color:#666;margin-top:4px">Someone wants to help you</p>
            </div>
            <p style="color:#333">Hi <strong>${seeker_name}</strong>,</p>
            <p style="color:#333">
              A verified donor (<strong>${donor_display_id}</strong>) has accepted your blood request
              for <strong>${blood_type}</strong> at <strong>${hospital_name}</strong>.
            </p>
            <p style="color:#333">
              Click the button below to <strong>confirm and receive the donor's contact details</strong>
              directly to this email address.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${accept_url}"
                 style="background:#e11d48;color:white;padding:14px 32px;
                        border-radius:8px;text-decoration:none;font-size:16px;
                        font-weight:bold;display:inline-block">
                ✅ Accept &amp; Get Donor Details
              </a>
            </div>
            <div style="background:#fff8f8;border:1px solid #fecdd3;border-radius:8px;padding:14px;font-size:13px;color:#666">
              ⏰ This link expires in <strong>24 hours</strong>.<br/>
              🔒 Only click this link if you genuinely need this blood donation.
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:11px;color:#aaa;text-align:center">
              AnonBlood's role ends at contact reveal. Please coordinate directly with the donor
              through your hospital's proper medical channels.
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
