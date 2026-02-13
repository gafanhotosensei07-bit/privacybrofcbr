const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIGMAPAY_BASE = "https://api.sigmapay.com.br/api/public/v1";
const PRODUCT_CODE = "xdoszqormp";
const OFFER_CODE = "1juqsagaaq";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiToken = Deno.env.get("SIGMAPAY_API_TOKEN");
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "API token não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { amount, customerName, customerEmail, customerDocument, customerPhone, productTitle } = body;

      // Validate inputs
      if (!amount || typeof amount !== "number" || amount <= 0 || amount > 999999) {
        return new Response(JSON.stringify({ error: "Valor inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!customerName || typeof customerName !== "string" || customerName.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Nome obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!customerEmail || typeof customerEmail !== "string" || !customerEmail.includes("@")) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Amount in centavos
      const amountCentavos = Math.round(amount * 100);

      // Build form-urlencoded payload - URLSearchParams as body object (not .toString())
      const formData = new URLSearchParams();
      formData.append("api_token", apiToken);
      formData.append("offer_hash", OFFER_CODE);
      formData.append("product_hash", PRODUCT_CODE);
      formData.append("operation_type", "1");
      formData.append("amount", String(amountCentavos));
      formData.append("title", productTitle || "Assinatura");
      formData.append("payment_method", "pix");
      formData.append("cart[0][product_hash]", PRODUCT_CODE);
      formData.append("cart[0][offer_hash]", OFFER_CODE);
      formData.append("cart[0][title]", productTitle || "Assinatura");
      formData.append("cart[0][price]", String(amountCentavos));
      formData.append("cart[0][quantity]", "1");
      formData.append("customer[name]", customerName.trim().slice(0, 200));
      formData.append("customer[email]", customerEmail.trim().toLowerCase().slice(0, 255));
      if (customerDocument) formData.append("customer[document]", customerDocument);
      if (customerPhone) formData.append("customer[phone]", customerPhone);

      console.log("sigmapay v14 - URLSearchParams body object, amount:", amount.toFixed(2));
      const res = await fetch(`${SIGMAPAY_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const fullError = JSON.stringify(data);
        console.error("SigmaPay create error (status " + res.status + "):", fullError);
        console.error("SigmaPay full response headers:", JSON.stringify(Object.fromEntries(res.headers.entries())));
        return new Response(JSON.stringify({ error: data.message || data.error || fullError || "Erro ao criar pagamento", details: data.errors || null }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return only necessary data to client
      return new Response(JSON.stringify({
        id: data.hash || data.id || data.transaction_hash,
        copyPaste: data.pix_copy_paste || data.copyPaste || data.pix?.copy_paste || "",
        qrCode: data.pix_qr_code || data.qrCode || data.pix?.qr_code || "",
        status: data.status || "pending",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "check_status") {
      const { transactionHash } = body;

      if (!transactionHash || typeof transactionHash !== "string") {
        return new Response(JSON.stringify({ error: "Hash da transação obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${SIGMAPAY_BASE}/transactions/${encodeURIComponent(transactionHash)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("SigmaPay status error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: data.message || "Erro ao consultar status" }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map SigmaPay status to our status
      let status = "pending";
      const sigmaStatus = (data.status || "").toLowerCase();
      if (sigmaStatus === "paid" || sigmaStatus === "approved" || sigmaStatus === "completed") {
        status = "approved";
      } else if (sigmaStatus === "rejected" || sigmaStatus === "refused" || sigmaStatus === "cancelled" || sigmaStatus === "expired") {
        status = "rejected";
      }

      return new Response(JSON.stringify({ status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("SigmaPay function error:", err.message);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
