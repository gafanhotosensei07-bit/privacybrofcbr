import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getAdminUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAuth.auth.getClaims(token);
  if (error || !data?.claims) return null;

  const userId = data.claims.sub as string;

  // Check admin role using service role client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return null;
  return userId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via JWT + admin role
    const adminUserId = await getAdminUserId(req);
    if (!adminUserId) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let table = "";
    let body: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      table = formData.get("table") as string || "";
      body = { table, formData };
    } else {
      body = await req.json();
      table = body.table;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let data: any, error: any;

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
    } else if (table === "update_checkout_status") {
      const { checkout_id, new_status } = body;
      if (!checkout_id || !new_status) {
        return new Response(JSON.stringify({ error: "checkout_id e new_status são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ({ data, error } = await supabase
        .from("checkout_attempts")
        .update({ payment_status: new_status })
        .eq("id", checkout_id)
        .select());
    } else if (table === "upload_content") {
      const formData = body.formData;
      if (!formData) {
        return new Response(JSON.stringify({ error: "FormData necessário" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const file = formData.get("file") as File;
      const filePath = formData.get("file_path") as string;
      if (!file || !filePath) {
        return new Response(JSON.stringify({ error: "file e file_path são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("model-content")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("model-content")
        .getPublicUrl(filePath);
      data = { path: uploadData?.path, publicUrl: urlData?.publicUrl };
      error = null;
    } else if (table === "list_content") {
      const folder = body.folder || "";
      const { data: files, error: listError } = await supabase.storage
        .from("model-content")
        .list(folder, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (listError) throw listError;
      data = (files || []).map((f: any) => {
        const path = folder ? `${folder}/${f.name}` : f.name;
        const { data: urlData } = supabase.storage.from("model-content").getPublicUrl(path);
        return { ...f, path, publicUrl: urlData?.publicUrl };
      });
      error = null;
    } else if (table === "delete_content") {
      const { file_paths } = body;
      if (!file_paths || !Array.isArray(file_paths)) {
        return new Response(JSON.stringify({ error: "file_paths array é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: delError } = await supabase.storage
        .from("model-content")
        .remove(file_paths);
      if (delError) throw delError;
      data = { deleted: file_paths.length };
      error = null;
    } else if (table === "page_views") {
      ({ data, error } = await supabase
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000));
    } else if (table === "tracking") {
      const [pageViewsRes, checkoutsRes] = await Promise.all([
        supabase.from("page_views").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("checkout_attempts").select("*").order("created_at", { ascending: false }).limit(2000),
      ]);

      const pageViews = pageViewsRes.data || [];
      const checkouts = checkoutsRes.data || [];
      const approved = checkouts.filter((c: any) => c.payment_status === "approved");
      const totalRevenue = approved.reduce((sum: number, c: any) => sum + Number(c.plan_price || 0), 0);

      const bySource: Record<string, { clicks: number; checkouts: number; approved: number; revenue: number }> = {};
      const byMedium: Record<string, { clicks: number; checkouts: number; approved: number; revenue: number }> = {};
      const byCampaign: Record<string, { clicks: number; checkouts: number; approved: number; revenue: number }> = {};

      pageViews.forEach((pv: any) => {
        const src = pv.utm_source || "(direto)";
        const med = pv.utm_medium || "(nenhum)";
        const camp = pv.utm_campaign || "(nenhuma)";
        if (!bySource[src]) bySource[src] = { clicks: 0, checkouts: 0, approved: 0, revenue: 0 };
        bySource[src].clicks++;
        if (!byMedium[med]) byMedium[med] = { clicks: 0, checkouts: 0, approved: 0, revenue: 0 };
        byMedium[med].clicks++;
        if (!byCampaign[camp]) byCampaign[camp] = { clicks: 0, checkouts: 0, approved: 0, revenue: 0 };
        byCampaign[camp].clicks++;
      });

      const now = new Date();
      const dailyData: Record<string, { views: number; checkouts: number; revenue: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        dailyData[key] = { views: 0, checkouts: 0, revenue: 0 };
      }
      pageViews.forEach((pv: any) => {
        const day = pv.created_at.split("T")[0];
        if (dailyData[day]) dailyData[day].views++;
      });
      checkouts.forEach((c: any) => {
        const day = c.created_at.split("T")[0];
        if (dailyData[day]) {
          dailyData[day].checkouts++;
          if (c.payment_status === "approved") dailyData[day].revenue += Number(c.plan_price || 0);
        }
      });
      const dailyTrend = Object.entries(dailyData).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({ date, ...d }));

      const utmCombos: Record<string, { clicks: number }> = {};
      pageViews.forEach((pv: any) => {
        if (pv.utm_source) {
          const key = `${pv.utm_source} / ${pv.utm_medium || "(nenhum)"} / ${pv.utm_campaign || "(nenhuma)"}`;
          if (!utmCombos[key]) utmCombos[key] = { clicks: 0 };
          utmCombos[key].clicks++;
        }
      });

      const referrers: Record<string, number> = {};
      pageViews.forEach((pv: any) => {
        const ref = pv.referrer ? (() => { try { return new URL(pv.referrer).hostname; } catch { return pv.referrer; } })() : "(direto)";
        referrers[ref] = (referrers[ref] || 0) + 1;
      });

      data = {
        totalClicks: pageViews.length,
        totalCheckouts: checkouts.length,
        totalApproved: approved.length,
        totalRevenue,
        conversionRate: pageViews.length > 0 ? ((checkouts.length / pageViews.length) * 100).toFixed(2) : "0",
        bySource: Object.entries(bySource).sort(([, a], [, b]) => b.clicks - a.clicks).map(([name, v]) => ({ name, ...v })),
        byMedium: Object.entries(byMedium).sort(([, a], [, b]) => b.clicks - a.clicks).map(([name, v]) => ({ name, ...v })),
        byCampaign: Object.entries(byCampaign).sort(([, a], [, b]) => b.clicks - a.clicks).map(([name, v]) => ({ name, ...v })),
        dailyTrend,
        utmCombos: Object.entries(utmCombos).sort(([, a], [, b]) => b.clicks - a.clicks).slice(0, 20).map(([name, v]) => ({ name, ...v })),
        referrers: Object.entries(referrers).sort(([, a], [, b]) => b - a).slice(0, 15).map(([name, clicks]) => ({ name, clicks })),
      };
      error = null;
    } else if (table === "dashboard") {
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

      const modelViewCounts: Record<string, number> = {};
      pageViews.filter((pv: any) => pv.page_type === "modelo").forEach((pv: any) => {
        modelViewCounts[pv.page_slug] = (modelViewCounts[pv.page_slug] || 0) + 1;
      });

      const modelCheckoutCounts: Record<string, number> = {};
      checkouts.forEach((c: any) => {
        modelCheckoutCounts[c.model_name] = (modelCheckoutCounts[c.model_name] || 0) + 1;
      });

      const pageTypeCounts: Record<string, number> = {};
      pageViews.forEach((pv: any) => {
        pageTypeCounts[pv.page_type] = (pageTypeCounts[pv.page_type] || 0) + 1;
      });

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
    } else if (table === "members") {
      const { data: approvedCheckouts, error: membersError } = await supabase
        .from("checkout_attempts")
        .select("*")
        .eq("payment_status", "approved")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (membersError) throw membersError;

      const userIds = [...new Set((approvedCheckouts || []).map((c: any) => c.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        (profs || []).forEach((p: any) => { profilesMap[p.user_id] = p.display_name; });
      }

      data = (approvedCheckouts || []).map((c: any) => ({
        ...c,
        display_name: profilesMap[c.user_id] || c.customer_name || "—",
      }));
      error = null;
    } else if (table === "revoke_access") {
      const { checkout_id } = body;
      if (!checkout_id) {
        return new Response(JSON.stringify({ error: "checkout_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ({ data, error } = await supabase
        .from("checkout_attempts")
        .update({ payment_status: "rejected" })
        .eq("id", checkout_id)
        .select());
    } else if (table === "domains") {
      ({ data, error } = await supabase
        .from("monitored_domains")
        .select("*")
        .order("created_at", { ascending: false }));
    } else if (table === "add_domain") {
      const { domain, label, notes } = body;
      if (!domain) {
        return new Response(JSON.stringify({ error: "domain é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ({ data, error } = await supabase
        .from("monitored_domains")
        .insert({ domain, label: label || "", notes: notes || "" })
        .select());
    } else if (table === "update_domain") {
      const { domain_id, domain, label, notes, is_active } = body;
      if (!domain_id) {
        return new Response(JSON.stringify({ error: "domain_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const updates: any = {};
      if (domain !== undefined) updates.domain = domain;
      if (label !== undefined) updates.label = label;
      if (notes !== undefined) updates.notes = notes;
      if (is_active !== undefined) updates.is_active = is_active;
      ({ data, error } = await supabase
        .from("monitored_domains")
        .update(updates)
        .eq("id", domain_id)
        .select());
    } else if (table === "delete_domain") {
      const { domain_id } = body;
      if (!domain_id) {
        return new Response(JSON.stringify({ error: "domain_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ({ data, error } = await supabase
        .from("monitored_domains")
        .delete()
        .eq("id", domain_id)
        .select());
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
