const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://api.sigmapay.com.br/api/public/v1";

async function createProductAndGetOffer(apiToken: string, amount: number, title: string) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      api_token: apiToken,
      title,
      product_type: "digital",
      sale_page: "https://tikads.com.br",
      guaranted_days: 7,
      cover: "https://placehold.co/400x400/png",
      amount,
    }),
  });

  const text = await res.text();
  console.log("sigmapay v29 - product response:", text.substring(0, 600));

  if (!res.ok) throw new Error(`Erro ao criar produto: ${text.substring(0, 300)}`);

  const data = JSON.parse(text);
  const product = data.data || data;
  const productHash = product.hash;
  const offerHash = (product.offers || [])[0]?.hash;

  if (!productHash || !offerHash) {
    throw new Error("Produto criado sem hash/oferta: " + JSON.stringify(product).substring(0, 200));
  }

  return { productHash, offerHash };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiToken = Deno.env.get("SIGMAPAY_PUBLIC_KEY") || Deno.env.get("SIGMAPAY_API_TOKEN") || "";
    console.log("sigmapay v30 - using token starts:", apiToken.substring(0, 6));
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

      const { productHash, offerHash } = await createProductAndGetOffer(apiToken, amountCentavos, title);
      console.log("sigmapay v29 - using product:", productHash, "offer:", offerHash);

      const payload = {
        api_token: apiToken,
        amount: amountCentavos,
        offer_hash: offerHash,
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
        cart: [{
          product_hash: productHash,
          title,
          cover: null,
          price: amountCentavos,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        }],
        expire_in_days: 1,
        transaction_origin: "api",
        postback_url: "https://api.utmify.com.br/webhooks/sigma-pay?id=6993fa94130641aac9d1a617",
      };

      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      console.log(`sigmapay v29 - tx response (${res.status}):`, rawText.substring(0, 600));

      let data: any;
      try { data = JSON.parse(rawText); } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || data, status_code: res.status }), {
          status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pixData = data.pix || {};
      return new Response(JSON.stringify({
        id: data.hash || data.id,
        copyPaste: pixData.pix_qr_code || "",
        qrCode: pixData.qr_code_base64 || "",
        status: data.payment_status || "pending",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "check_status") {
      const txHash = body.transactionHash || body.paymentId;
      if (!txHash || typeof txHash !== "string") {
        return new Response(JSON.stringify({ error: "Hash obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${API_BASE}/transactions/${encodeURIComponent(txHash)}?api_token=${apiToken}`, {
        headers: { "Accept": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        const s = (data.payment_status || data.status || "").toLowerCase();
        let status = "pending";
        if (["paid", "approved", "completed"].includes(s)) status = "approved";
        else if (["rejected", "refused", "cancelled", "expired"].includes(s)) status = "rejected";
        return new Response(JSON.stringify({ status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao consultar status" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("SigmaPay error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
