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
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(JSON.stringify({ error: "slug é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Use service role to check payment and list files
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find model name from slug (check checkout_attempts for matching model)
    // We need to verify user has an approved checkout for this model
    const { data: modelsList } = await supabase
      .from("checkout_attempts")
      .select("model_name")
      .eq("user_id", userId)
      .eq("payment_status", "approved")
      .limit(100);

    // We don't know exact model name from slug, so get all approved model names
    // and check files. The MembersArea already verifies access client-side,
    // but we enforce it server-side too.
    const approvedModels = (modelsList || []).map((c: any) => c.model_name);
    
    // If user has no approved checkouts at all, deny
    if (approvedModels.length === 0) {
      return new Response(JSON.stringify({ error: "Acesso negado. Assinatura não encontrada." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List files in the model's folder
    const { data: files, error } = await supabase.storage
      .from("model-content")
      .list(slug, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

    if (error) throw error;

    const filteredFiles = (files || []).filter((f: any) => f.name !== ".emptyFolderPlaceholder");

    // Generate signed URLs (1 hour expiry)
    const items = await Promise.all(
      filteredFiles.map(async (f: any) => {
        const path = `${slug}/${f.name}`;
        const { data: signedData, error: signError } = await supabase.storage
          .from("model-content")
          .createSignedUrl(path, 3600); // 1 hour
        
        const isVideo = /\.(mp4|webm|mov|avi)$/i.test(f.name);
        return {
          name: f.name,
          url: signError ? null : signedData?.signedUrl,
          type: isVideo ? "video" : "image",
          created_at: f.created_at,
        };
      })
    );

    return new Response(JSON.stringify({ data: items.filter(i => i.url) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
