import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar checkouts pendentes há mais de 5 minutos que ainda não receberam email
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: pendingCheckouts, error: fetchError } = await supabase
      .from("checkout_attempts")
      .select("id, customer_name, customer_email, model_name, plan_name, plan_price")
      .eq("payment_status", "pending")
      .eq("recovery_email_sent", false)
      .lt("created_at", fiveMinAgo)
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingCheckouts || pendingCheckouts.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum checkout pendente para recuperar", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const checkout of pendingCheckouts) {
      const firstName = (checkout.customer_name || "").split(" ")[0] || "Visitante";
      const modelName = checkout.model_name || "a modelo";
      const planPrice = checkout.plan_price ? `R$ ${Number(checkout.plan_price).toFixed(2).replace(".", ",")}` : "";

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#ff6b35,#e91e63);padding:30px 20px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⚡ Seu acesso está esperando!</h1>
    </div>
    <div style="padding:30px 20px;color:#eee;">
      <p style="font-size:18px;">Oi <strong>${firstName}</strong>! 👋</p>
      <p style="font-size:16px;line-height:1.6;">
        Notamos que você gerou o PIX para acessar o conteúdo exclusivo de <strong>${modelName}</strong>, 
        mas o pagamento ainda não foi confirmado.
      </p>
      <p style="font-size:16px;line-height:1.6;">
        O conteúdo dela é <strong>muito procurado</strong> e as vagas são limitadas! 🔥
      </p>
      <div style="background:#252545;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#ff6b35;font-size:14px;margin:0 0 5px;">Plano selecionado</p>
        <p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">${checkout.plan_name} — ${planPrice}</p>
      </div>
      <div style="text-align:center;margin:25px 0;">
        <a href="https://privacybrofcbr.lovable.app/modelo/${encodeURIComponent(checkout.model_name?.toLowerCase().replace(/\s+/g, '') || '')}" 
           style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#e91e63);color:#fff;text-decoration:none;padding:16px 40px;border-radius:30px;font-size:18px;font-weight:bold;">
          🔓 COMPLETAR MEU ACESSO
        </a>
      </div>
      <p style="font-size:14px;color:#888;text-align:center;">
        Se você já pagou, desconsidere este email. O acesso será liberado automaticamente.
      </p>
    </div>
    <div style="background:#111;padding:15px 20px;text-align:center;">
      <p style="color:#555;font-size:12px;margin:0;">Privacy — Conteúdo Exclusivo</p>
    </div>
  </div>
</body>
</html>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Privacy <onboarding@resend.dev>",
            to: [checkout.customer_email],
            subject: `⚡ ${firstName}, seu acesso a ${modelName} ainda está disponível!`,
            html: htmlBody,
          }),
        });

        if (res.ok) {
          // Marcar como enviado
          await supabase
            .from("checkout_attempts")
            .update({ recovery_email_sent: true })
            .eq("id", checkout.id);
          sentCount++;
        } else {
          const errText = await res.text();
          errors.push(`${checkout.customer_email}: ${errText.substring(0, 100)}`);
        }
      } catch (e: any) {
        errors.push(`${checkout.customer_email}: ${e.message}`);
      }
    }

    console.log(`Sales recovery: ${sentCount} emails sent, ${errors.length} errors`);

    return new Response(JSON.stringify({ 
      sent: sentCount, 
      total: pendingCheckouts.length,
      errors: errors.length > 0 ? errors : undefined 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Sales recovery error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
