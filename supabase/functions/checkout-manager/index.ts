import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "insert") {
      const { customer_name, customer_email, model_name, plan_name, plan_price, payment_id, user_id } = body;

      // Validate inputs
      if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length === 0 || customer_name.length > 200) {
        return new Response(JSON.stringify({ error: "Nome inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!customer_email || typeof customer_email !== "string" || !customer_email.includes("@") || customer_email.length > 255) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!plan_name || typeof plan_name !== "string" || plan_name.length > 100) {
        return new Response(JSON.stringify({ error: "Plano inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const price = Number(plan_price);
      if (isNaN(price) || price < 0 || price > 99999) {
        return new Response(JSON.stringify({ error: "Preço inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase.from("checkout_attempts").insert({
        customer_name: customer_name.trim().slice(0, 200),
        customer_email: customer_email.trim().toLowerCase().slice(0, 255),
        model_name: (model_name || "").slice(0, 100),
        plan_name: plan_name.trim().slice(0, 100),
        plan_price: price,
        payment_status: "pending",
        payment_id: payment_id || null,
        user_id: user_id || null,
      }).select("id").single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "update_status") {
      const { payment_id, status } = body;

      if (!payment_id || typeof payment_id !== "string" || payment_id.length > 200) {
        return new Response(JSON.stringify({ error: "Payment ID inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const allowedStatuses = ["approved", "rejected", "expired"];
      if (!allowedStatuses.includes(status)) {
        return new Response(JSON.stringify({ error: "Status inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("checkout_attempts")
        .update({ payment_status: status })
        .eq("payment_id", payment_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
