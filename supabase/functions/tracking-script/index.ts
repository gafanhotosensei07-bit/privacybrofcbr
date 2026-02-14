const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // JavaScript tracking script that runs on external domains
  const script = `
(function() {
  try {
    var params = new URLSearchParams(window.location.search);
    var data = {
      page_type: "external",
      page_slug: window.location.hostname + window.location.pathname,
      referrer: document.referrer || "",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || ""
    };
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "${supabaseUrl}/rest/v1/page_views", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("apikey", "${supabaseAnonKey}");
    xhr.setRequestHeader("Authorization", "Bearer ${supabaseAnonKey}");
    xhr.setRequestHeader("Prefer", "return=minimal");
    xhr.send(JSON.stringify(data));
  } catch(e) {}
})();
`;

  return new Response(script, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
