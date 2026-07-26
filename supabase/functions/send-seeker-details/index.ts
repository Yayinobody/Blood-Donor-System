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
      donor_display_id,
      donor_email,
      donor_phone,
      hospital_name = "your hospital",
      blood_type,
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
        subject: "🩸 Your Donor's Contact Details — AnonBlood",
        htmlContent: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:20px">
            <div style="text-align:center;margin-bottom:24px">
              <h2 style="color:#e11d48;margin:0">🩸 AnonBlood</h2>
              <p style="color:#666;margin-top:4px">Donor Contact Details</p>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="color:#16a34a;font-weight:bold;margin:0 0 4px 0">✅ Match Confirmed!</p>
              <p style="color:#333;margin:0;font-size:14px">
                Here are the contact details for your donor for <strong>${blood_type}</strong> at <strong>${hospital_name}</strong>.
              </p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:10px 0;color:#888;width:40%">Donor ID</td>
                <td style="padding:10px 0;font-weight:bold;color:#333">${donor_display_id}</td>
              </tr>
              <tr style="border-top:1px solid #f3f4f6">
                <td style="padding:10px 0;color:#888">Email</td>
                <td style="padding:10px 0">
                  <a href="mailto:${donor_email}" style="color:#e11d48;font-weight:bold">${donor_email}</a>
                </td>
              </tr>
              ${
                donor_phone
                  ? `
              <tr style="border-top:1px solid #f3f4f6">
                <td style="padding:10px 0;color:#888">Phone</td>
                <td style="padding:10px 0">
                  <a href="tel:${donor_phone}" style="color:#e11d48;font-weight:bold">${donor_phone}</a>
                </td>
              </tr>`
                  : ""
              }
            </table>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;
                        padding:14px;font-size:12px;color:#92400e;margin-top:20px">
              <strong>⚠️ Safety Reminder:</strong> AnonBlood's role ends here. Please contact the donor
              and coordinate through your hospital's proper medical channels.
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:11px;color:#aaa;text-align:center">
              AnonBlood — Discovery &amp; Matchmaking Only.<br/>
              Please do not reply to this email.
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
