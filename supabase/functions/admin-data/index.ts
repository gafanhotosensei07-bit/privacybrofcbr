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
    const body = await req.json();
    const { password, table } = body;
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
      const conversationId = body.conversation_id;
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (conversationId) {
        query = query.eq("conversation_id", conversationId);
      }
      ({ data, error } = await query);
    } else if (table === "checkouts") {
      ({ data, error } = await supabase
        .from("checkout_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500));
    } else if (table === "page_views") {
      ({ data, error } = await supabase
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000));
    } else if (table === "dashboard") {
      // Return aggregated stats
      const [profilesRes, conversationsRes, checkoutsRes, pageViewsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("checkout_attempts").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("page_views").select("*").order("created_at", { ascending: false }).limit(2000),
      ]);

      const checkouts = checkoutsRes.data || [];
      const pageViews = pageViewsRes.data || [];
      const approved = checkouts.filter((c: any) => c.payment_status === "approved");
      const revenue = approved.reduce((sum: number, c: any) => sum + Number(c.plan_price || 0), 0);

      // Model interest ranking
      const modelViewCounts: Record<string, number> = {};
      pageViews.filter((pv: any) => pv.page_type === "modelo").forEach((pv: any) => {
        modelViewCounts[pv.page_slug] = (modelViewCounts[pv.page_slug] || 0) + 1;
      });

      const modelCheckoutCounts: Record<string, number> = {};
      checkouts.forEach((c: any) => {
        modelCheckoutCounts[c.model_name] = (modelCheckoutCounts[c.model_name] || 0) + 1;
      });

      // Page type breakdown
      const pageTypeCounts: Record<string, number> = {};
      pageViews.forEach((pv: any) => {
        pageTypeCounts[pv.page_type] = (pageTypeCounts[pv.page_type] || 0) + 1;
      });

      // Recent activity (last 24h)
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentViews = pageViews.filter((pv: any) => new Date(pv.created_at) > last24h).length;
      const recentCheckouts = checkouts.filter((c: any) => new Date(c.created_at) > last24h).length;

      data = {
        totalUsers: profilesRes.count || 0,
        totalConversations: conversationsRes.count || 0,
        totalCheckouts: checkouts.length,
        approvedCheckouts: approved.length,
        totalRevenue: revenue,
        totalPageViews: pageViews.length,
        recentViews24h: recentViews,
        recentCheckouts24h: recentCheckouts,
        modelViews: modelViewCounts,
        modelCheckouts: modelCheckoutCounts,
        pageTypeBreakdown: pageTypeCounts,
        conversionRate: pageViews.length > 0 ? ((checkouts.length / pageViews.length) * 100).toFixed(1) : "0",
      };
      error = null;
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
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
