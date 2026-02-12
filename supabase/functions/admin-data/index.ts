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
    const { password, table } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminPassword || password !== adminPassword) {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let data, error;

    if (table === "profiles") {
      ({ data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500));
    } else if (table === "conversations") {
      ({ data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500));
    } else if (table === "messages") {
      const { conversation_id } = await req.json().catch(() => ({}));
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (conversation_id) {
        query = query.eq("conversation_id", conversation_id);
      }
      ({ data, error } = await query);
    } else if (table === "checkouts") {
      ({ data, error } = await supabase
        .from("checkout_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500));
    } else {
      return new Response(JSON.stringify({ error: "Tabela inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
