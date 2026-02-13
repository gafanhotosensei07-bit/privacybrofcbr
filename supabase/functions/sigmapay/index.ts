const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIGMAPAY_BASE = "https://api.sigmapay.com.br/api/public/v1";
const PRODUCT_CODE = "xdoszqormp";

// Real offers from SigmaPay product
const OFFER_MAP: Record<string, { hash: string; priceCentavos: number }> = {
  "9.90":  { hash: "99ep6", priceCentavos: 990 },
  "14.90": { hash: "1juqsagaaq", priceCentavos: 1490 },
  "19.90": { hash: "xdoszqormp_np94iv58pz", priceCentavos: 1990 },
  "21.90": { hash: "xotre", priceCentavos: 2190 },
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

    if (action === "get_offers") {
      const offers = Object.entries(OFFER_MAP).map(([price, o]) => ({
        priceBrl: parseFloat(price),
        priceCentavos: o.priceCentavos,
        offerHash: o.hash,
      }));
      return new Response(JSON.stringify({ offers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "create") {
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
      if (!offer) {
        return new Response(JSON.stringify({ 
          error: `Nenhuma oferta para R$ ${amount.toFixed(2)}. Disponíveis: ${Object.keys(OFFER_MAP).join(', ')}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try approach: api_token in body + full payload matching docs exactly
      const payload = {
        api_token: apiToken,
        amount: offer.priceCentavos,
        offer_hash: offer.hash,
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
          city: "Rio de Janeiro",
          state: "RJ",
          zip_code: "20040020",
        },
        cart: [
          {
            product_hash: PRODUCT_CODE,
            title: productTitle || "ACESSO POR 30 DIAS",
            cover: null,
            price: offer.priceCentavos,
            quantity: 1,
            operation_type: 1,
            tangible: false,
          },
        ],
        expire_in_days: 1,
        transaction_origin: "api",
      };

      console.log("sigmapay v19 - trying with api_token in body");
      let res = await fetch(`${SIGMAPAY_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let rawText = await res.text();
      console.log("Attempt 1 (token in body) status:", res.status, "response:", rawText.substring(0, 500));

      // If failed, try with Authorization header instead
      if (!res.ok) {
        const { api_token: _removed, ...payloadNoToken } = payload;
        console.log("sigmapay v19 - trying with Authorization header");
        res = await fetch(`${SIGMAPAY_BASE}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${apiToken}`,
          },
          body: JSON.stringify(payloadNoToken),
        });

        rawText = await res.text();
        console.log("Attempt 2 (Bearer header) status:", res.status, "response:", rawText.substring(0, 500));
      }

      // If still failed, try with api_token as query param
      if (!res.ok) {
        const { api_token: _removed2, ...payloadNoToken2 } = payload;
        console.log("sigmapay v19 - trying with query param");
        res = await fetch(`${SIGMAPAY_BASE}/transactions?api_token=${encodeURIComponent(apiToken)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payloadNoToken2),
        });

        rawText = await res.text();
        console.log("Attempt 3 (query param) status:", res.status, "response:", rawText.substring(0, 500));
      }
      
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida da SigmaPay", raw: rawText.substring(0, 200) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || null, raw: rawText.substring(0, 300) }), {
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
