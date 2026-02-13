const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIGMAPAY_BASE = "https://api.sigmapay.com.br/api/public/v1";
const PRODUCT_CODE = "xdoszqormp";

// Real offers from SigmaPay product (fetched via API)
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
    const publicKey = Deno.env.get("SIGMAPAY_PUBLIC_KEY");
    const secretKey = Deno.env.get("SIGMAPAY_API_TOKEN");

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      if (!publicKey) {
        return new Response(JSON.stringify({ error: "Chave pública não configurada" }), {
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
      if (!offer) {
        return new Response(JSON.stringify({ 
          error: `Nenhuma oferta para R$ ${amount.toFixed(2)}. Disponíveis: ${Object.keys(OFFER_MAP).join(', ')}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use PUBLIC key for creating transactions (as per reference implementation)
      const payload = {
        api_token: publicKey,
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

      console.log("sigmapay v20 - PUBLIC key, offer:", offer.hash, "price:", offer.priceCentavos);
      let res = await fetch(`${SIGMAPAY_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let rawText = await res.text();
      console.log("Attempt 1 (public key in body) status:", res.status, "response:", rawText.substring(0, 500));

      // If failed with public key, try secret key
      if (!res.ok) {
        if (secretKey) {
          const payload2 = { ...payload, api_token: secretKey };
          console.log("sigmapay v20 - retrying with SECRET key");
          res = await fetch(`${SIGMAPAY_BASE}/transactions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload2),
          });
          rawText = await res.text();
          console.log("Attempt 2 (secret key) status:", res.status, "response:", rawText.substring(0, 500));
        }
      }

      // If still failed, try without offer_hash (dynamic creation)
      if (!res.ok) {
        const amountCentavos = Math.round(amount * 100);
        const dynamicPayload = {
          api_token: publicKey,
          amount: amountCentavos,
          payment_method: "pix",
          customer: payload.customer,
          cart: [
            {
              product_hash: PRODUCT_CODE,
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
        console.log("sigmapay v20 - retrying WITHOUT offer_hash");
        res = await fetch(`${SIGMAPAY_BASE}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(dynamicPayload),
        });
        rawText = await res.text();
        console.log("Attempt 3 (no offer_hash) status:", res.status, "response:", rawText.substring(0, 500));
      }

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
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || null }), {
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
      // Use SECRET key for checking status (as per reference implementation)
      const apiToken = secretKey || publicKey;
      if (!apiToken) {
        return new Response(JSON.stringify({ error: "Token não configurado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { transactionHash } = body;
      // Also accept paymentId from reference implementation
      const txHash = transactionHash || body.paymentId;

      if (!txHash || typeof txHash !== "string") {
        return new Response(JSON.stringify({ error: "Hash da transação obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${SIGMAPAY_BASE}/transactions/${encodeURIComponent(txHash)}`, {
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
