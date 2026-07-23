import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

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
    const {
      seeker_email,
      blood_type_needed,
      hospital_name,
      donor_display_id,
      urgency_level,
    } = await req.json();

    if (!seeker_email) {
      return new Response(JSON.stringify({ error: "seeker_email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const urgencyText: Record<string, string> = {
      within_hours: "⚠️ Within Hours (URGENT)",
      within_day: "Within a Day",
      planning: "Planning Ahead",
      emergency: "🚨 Emergency",
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Blood Donor System <onboarding@resend.dev>",
        to: [seeker_email],
        subject: "🩸 A donor has accepted your blood request!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fff;">
            <div style="background: linear-gradient(135deg, #e53e3e, #c53030); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🩸 Donor Found!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Someone is ready to help save your life</p>
            </div>

            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #2d3748; margin: 0 0 16px; font-size: 18px;">Request Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #718096; font-size: 14px;">Blood Type Needed</td>
                  <td style="padding: 8px 0; color: #e53e3e; font-weight: bold; font-size: 16px;">${blood_type_needed}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #718096; font-size: 14px;">Hospital</td>
                  <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${hospital_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #718096; font-size: 14px;">Urgency</td>
                  <td style="padding: 8px 0; color: #2d3748;">${urgencyText[urgency_level] ?? urgency_level}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #718096; font-size: 14px;">Donor ID</td>
                  <td style="padding: 8px 0; color: #2d3748;">${donor_display_id}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #c53030; margin: 0; font-size: 14px;">
                <strong>What's next?</strong> The donor now has your contact information and will reach out to coordinate the donation. Please keep your phone and email accessible.
              </p>
            </div>

            <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 24px;">
              This is an automated message from the Blood Donor System. Do not reply to this email.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
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
