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
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(JSON.stringify({ error: "slug é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // List files in the model's folder
    const { data: files, error } = await supabase.storage
      .from("model-content")
      .list(slug, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

    if (error) throw error;

    const items = (files || [])
      .filter((f: any) => f.name !== ".emptyFolderPlaceholder")
      .map((f: any) => {
        const path = `${slug}/${f.name}`;
        const { data: urlData } = supabase.storage.from("model-content").getPublicUrl(path);
        const isVideo = /\.(mp4|webm|mov|avi)$/i.test(f.name);
        return {
          name: f.name,
          url: urlData?.publicUrl,
          type: isVideo ? "video" : "image",
          created_at: f.created_at,
        };
      });

    return new Response(JSON.stringify({ data: items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
