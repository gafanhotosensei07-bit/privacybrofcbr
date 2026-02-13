const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://api.sigmapay.com.br/api/public/v1";
const PRODUCT_HASH = "xdoszqormp";
const OFFER_HASH = "1juqsagaaq";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiToken = Deno.env.get("SIGMAPAY_API_TOKEN") || Deno.env.get("SIGMAPAY_PUBLIC_KEY") || "";
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Token não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { amount, customerName, customerEmail, customerDocument, customerPhone, productTitle } = body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return new Response(JSON.stringify({ error: "Valor inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!customerName || typeof customerName !== "string" || customerName.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Nome obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!customerEmail || typeof customerEmail !== "string" || !customerEmail.includes("@")) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const amountCentavos = Math.round(amount * 100);
      const title = productTitle || "ACESSO VIP 30 DIAS";

      const payload = {
        api_token: apiToken,
        amount: amountCentavos,
        offer_hash: OFFER_HASH,
        payment_method: "pix",
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone_number: customerPhone || "11999999999",
          document: customerDocument || "00000000000",
          street_name: "Rua Exemplo",
          number: "100",
          complement: "",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zip_code: "01001000",
        },
        cart: [
          {
            product_hash: PRODUCT_HASH,
            title: title,
            cover: null,
            price: amountCentavos,
            quantity: 1,
            operation_type: 1,
            tangible: false,
          },
        ],
        expire_in_days: 1,
        transaction_origin: "api",
      };

      console.log("sigmapay v28 - creating transaction with fixed product/offer");

      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      console.log(`sigmapay v28 - response (${res.status}):`, rawText.substring(0, 600));

      let data: any;
      try { data = JSON.parse(rawText); } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida", raw: rawText.substring(0, 200) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || data, status_code: res.status }), {
          status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pixData = data.pix || {};
      const pixCopyPaste = pixData.pix_qr_code || data.pix_copy_paste || "";

      return new Response(JSON.stringify({
        id: data.hash || data.id || data.transaction_hash,
        copyPaste: pixCopyPaste,
        qrCode: pixData.qr_code_base64 || "",
        status: data.payment_status || data.status || "pending",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "check_status") {
      const txHash = body.transactionHash || body.paymentId;
      if (!txHash || typeof txHash !== "string") {
        return new Response(JSON.stringify({ error: "Hash da transação obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusRes = await fetch(`${API_BASE}/transactions/${encodeURIComponent(txHash)}?api_token=${apiToken}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      if (statusRes.ok) {
        const data = await statusRes.json();
        let status = "pending";
        const sigmaStatus = (data.payment_status || data.status || "").toLowerCase();
        if (["paid", "approved", "completed"].includes(sigmaStatus)) status = "approved";
        else if (["rejected", "refused", "cancelled", "expired"].includes(sigmaStatus)) status = "rejected";
        return new Response(JSON.stringify({ status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao consultar status" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("SigmaPay error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
