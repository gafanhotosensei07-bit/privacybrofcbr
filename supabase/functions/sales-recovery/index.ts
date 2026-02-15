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

    // Buscar checkouts pendentes que:
    // - Têm menos de 3 emails enviados
    // - Foram criados há mais de 5 minutos
    // - O último email foi enviado há mais de 1 hora (ou nunca foi enviado)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // First: never sent (recovery_email_count = 0, created > 5min ago)
    const { data: neverSent, error: e1 } = await supabase
      .from("checkout_attempts")
      .select("id, customer_name, customer_email, model_name, plan_name, plan_price, recovery_email_count")
      .eq("payment_status", "pending")
      .lt("recovery_email_count", 3)
      .lt("created_at", fiveMinAgo)
      .is("recovery_email_last_sent_at", null)
      .limit(50);

    // Second: already sent but last email > 1 hour ago and count < 3
    const { data: readyForNext, error: e2 } = await supabase
      .from("checkout_attempts")
      .select("id, customer_name, customer_email, model_name, plan_name, plan_price, recovery_email_count")
      .eq("payment_status", "pending")
      .lt("recovery_email_count", 3)
      .not("recovery_email_last_sent_at", "is", null)
      .lt("recovery_email_last_sent_at", oneHourAgo)
      .limit(50);

    if (e1) throw e1;
    if (e2) throw e2;

    const pendingCheckouts = [...(neverSent || []), ...(readyForNext || [])];

    if (pendingCheckouts.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum checkout para recuperar", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const checkout of pendingCheckouts) {
      const firstName = (checkout.customer_name || "").split(" ")[0] || "Visitante";
      const modelName = checkout.model_name || "a modelo";
      const planPrice = checkout.plan_price ? `R$ ${Number(checkout.plan_price).toFixed(2).replace(".", ",")}` : "";
      const emailNum = (checkout.recovery_email_count || 0) + 1;

      const subjects = [
        `${firstName}, seu acesso a ${modelName} ainda está disponível`,
        `${firstName}, lembrete sobre seu acesso a ${modelName}`,
        `${firstName}, ultimo lembrete - acesso a ${modelName}`,
      ];
      const urgencyTexts = [
        "Notamos que você gerou o PIX mas o pagamento ainda não foi confirmado.",
        "Este é um segundo lembrete sobre seu pagamento pendente.",
        "Este é o último lembrete que enviaremos sobre este pagamento.",
      ];

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#1a1a2e;padding:25px 20px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Seu acesso está esperando</h1>
    </div>
    <div style="padding:25px 20px;color:#333;">
      <p style="font-size:16px;">Ola ${firstName},</p>
      <p style="font-size:15px;line-height:1.6;">
        ${urgencyTexts[emailNum - 1]}
      </p>
      <p style="font-size:15px;line-height:1.6;">
        O conteudo exclusivo de <strong>${modelName}</strong> esta disponivel para voce.
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:15px;margin:20px 0;text-align:center;border:1px solid #eee;">
        <p style="color:#666;font-size:13px;margin:0 0 5px;">Plano selecionado</p>
        <p style="color:#333;font-size:18px;font-weight:bold;margin:0;">${checkout.plan_name} - ${planPrice}</p>
      </div>
      <div style="text-align:center;margin:25px 0;">
        <a href="https://privacybrofcbr.lovable.app/modelo/${encodeURIComponent(checkout.model_name?.toLowerCase().replace(/\s+/g, '') || '')}" 
           style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:14px 35px;border-radius:6px;font-size:16px;font-weight:bold;">
          Completar meu acesso
        </a>
      </div>
      <p style="font-size:13px;color:#999;text-align:center;">
        Se voce ja pagou, desconsidere este email. O acesso sera liberado automaticamente.
      </p>
    </div>
    <div style="background:#f5f5f5;padding:12px 20px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:11px;margin:0;">Privacy - Conteudo Exclusivo</p>
      <p style="color:#bbb;font-size:10px;margin:4px 0 0;">
        <a href="https://privacybrofcbr.lovable.app" style="color:#bbb;">Visitar site</a>
      </p>
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
            from: "Privacy <noreply@privacybrofc.shop>",
            reply_to: "noreply@privacybrofc.shop",
            to: [checkout.customer_email],
            subject: subjects[emailNum - 1],
            html: htmlBody,
          }),
        });

        if (res.ok) {
          await supabase
            .from("checkout_attempts")
            .update({ 
              recovery_email_sent: true,
              recovery_email_count: emailNum,
              recovery_email_last_sent_at: new Date().toISOString(),
            })
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
