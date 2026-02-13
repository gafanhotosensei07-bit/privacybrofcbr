const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Try multiple API base URLs
const API_BASES = [
  "https://api.sigmapay.com.br/api/public/v1",
  "https://api.sigmapay.com.br/api/v1",
  "https://api.sigmapay.com.br/api",
];

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
      const offerHash = offer ? offer.hash : "1juqsagaaq"; // fallback

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
          city: "Rio de Janeiro",
          state: "RJ",
          zip_code: "20040020",
        },
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

      // Try each API base URL until one works
      let lastRes: Response | null = null;
      let lastRawText = "";
      
      for (let i = 0; i < API_BASES.length; i++) {
        const baseUrl = API_BASES[i];
        console.log(`sigmapay v21 - trying base ${i + 1}: ${baseUrl}/transactions`);
        
        try {
          lastRes = await fetch(`${baseUrl}/transactions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });

          lastRawText = await lastRes.text();
          console.log(`Base ${i + 1} response (status ${lastRes.status}):`, lastRawText.substring(0, 500));

          if (lastRes.ok) break; // Success!
          
          // If 403 with public key, try secret key on same base
          if (lastRes.status === 403 && secretKey && apiToken !== secretKey) {
            const payload2 = { ...payload, api_token: secretKey };
            console.log(`sigmapay v21 - retrying base ${i + 1} with secret key`);
            lastRes = await fetch(`${baseUrl}/transactions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify(payload2),
            });
            lastRawText = await lastRes.text();
            console.log(`Base ${i + 1} (secret) response (status ${lastRes.status}):`, lastRawText.substring(0, 500));
            if (lastRes.ok) break;
          }
        } catch (fetchErr: any) {
          console.error(`Base ${i + 1} fetch error:`, fetchErr.message);
        }
      }

      if (!lastRes) {
        return new Response(JSON.stringify({ error: "Não foi possível conectar à SigmaPay" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let data: any;
      try {
        data = JSON.parse(lastRawText);
      } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida", raw: lastRawText.substring(0, 200) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!lastRes.ok) {
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || null }), {
          status: lastRes.status,
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

      // Try checking status on each base URL
      for (const baseUrl of API_BASES) {
        try {
          const res = await fetch(`${baseUrl}/transactions/${encodeURIComponent(txHash)}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
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
        } catch {
          continue;
        }
      }

      return new Response(JSON.stringify({ error: "Erro ao consultar status" }), {
        status: 500,
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
