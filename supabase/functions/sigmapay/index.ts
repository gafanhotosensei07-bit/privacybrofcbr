const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Most recent product from SigmaPay account
const DEFAULT_PRODUCT_HASH = "inumgwkgzv";
const DEFAULT_OFFER_HASH = "8sodh";

// Map prices to specific product/offer combos (using real data from API)
const OFFER_MAP: Record<string, { productHash: string; offerHash: string; priceCentavos: number }> = {
  "9.90":  { productHash: "rwxuvedcqu", offerHash: "tlkes", priceCentavos: 990 },
  "14.90": { productHash: "inumgwkgzv", offerHash: "8sodh", priceCentavos: 1490 },
};

function findOffer(amountBrl: number) {
  const key = amountBrl.toFixed(2);
  if (OFFER_MAP[key]) return OFFER_MAP[key];
  const centavos = Math.round(amountBrl * 100);
  for (const offer of Object.values(OFFER_MAP)) {
    if (offer.priceCentavos === centavos) return offer;
  }
  return null;
}

const API_BASE = "https://api.sigmapay.com.br/api/public/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get("SIGMAPAY_PUBLIC_KEY");
    const secretKey = Deno.env.get("SIGMAPAY_API_TOKEN");

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const apiToken = publicKey || secretKey;
      if (!apiToken) {
        return new Response(JSON.stringify({ error: "Token não configurado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { amount, customerName, customerEmail, customerDocument, customerPhone, productTitle } = body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
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

      const offer = findOffer(amount);
      const amountCentavos = offer ? offer.priceCentavos : Math.round(amount * 100);
      const productHash = offer ? offer.productHash : DEFAULT_PRODUCT_HASH;
      const offerHash = offer ? offer.offerHash : DEFAULT_OFFER_HASH;

      const payload: any = {
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
        cart: [
          {
            product_hash: productHash,
            title: productTitle || "ACESSO POR 30 DIAS",
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

      console.log("sigmapay v24 - payload:", JSON.stringify(payload).substring(0, 600));

      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      console.log(`sigmapay v24 response (status ${res.status}):`, rawText.substring(0, 800));

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida", raw: rawText.substring(0, 200) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || data, status_code: res.status }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("SigmaPay SUCCESS:", JSON.stringify(data).substring(0, 500));

      return new Response(JSON.stringify({
        id: data.hash || data.id || data.transaction_hash,
        copyPaste: data.pix_copy_paste || data.copyPaste || data.pix?.copy_paste || "",
        qrCode: data.pix_qr_code || data.qrCode || data.pix?.qr_code || "",
        status: data.status || "pending",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "check_status") {
      const apiToken = secretKey || publicKey;
      if (!apiToken) {
        return new Response(JSON.stringify({ error: "Token não configurado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const txHash = body.transactionHash || body.paymentId;
      if (!txHash || typeof txHash !== "string") {
        return new Response(JSON.stringify({ error: "Hash da transação obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusRes = await fetch(`${API_BASE}/transactions/${encodeURIComponent(txHash)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
      });

      if (statusRes.ok) {
        const data = await statusRes.json();
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
      }

      return new Response(JSON.stringify({ error: "Erro ao consultar status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "debug_products") {
      const apiToken = publicKey || secretKey;
      if (!apiToken) {
        return new Response(JSON.stringify({ error: "Token não configurado" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const prodRes = await fetch(`${API_BASE}/products?api_token=${apiToken}`, {
        headers: { "Accept": "application/json" },
      });
      const prodText = await prodRes.text();
      return new Response(prodText, {
        status: prodRes.status,
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
