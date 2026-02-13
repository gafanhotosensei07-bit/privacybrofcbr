const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://api.sigmapay.com.br/api/public/v1";

async function apiCall(endpoint: string, method: string, body?: any) {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${API_BASE}${endpoint}`, opts);
}

async function createProductWithOffer(apiToken: string, amount: number, title: string) {
  console.log("sigmapay v27 - creating product with amount:", amount);
  const productRes = await apiCall("/products", "POST", {
    api_token: apiToken,
    title: title,
    product_type: "digital",
    sale_page: "https://tikads.com.br",
    guaranted_days: 7,
    cover: "https://placehold.co/400x400/png",
    amount: amount, // centavos - this should auto-create an offer
  });

  const productText = await productRes.text();
  console.log("sigmapay v26 - product response:", productText.substring(0, 800));

  if (!productRes.ok) {
    throw new Error(`Erro ao criar produto: ${productText.substring(0, 300)}`);
  }

  const productData = JSON.parse(productText);
  const product = productData.data || productData;
  const productHash = product.hash;

  if (!productHash) {
    throw new Error("Produto criado mas sem hash: " + JSON.stringify(product).substring(0, 200));
  }

  // Extract offer hash from the product's offers array
  const offers = product.offers || [];
  const offerHash = offers[0]?.hash;

  if (!offerHash) {
    throw new Error("Produto criado sem oferta: " + JSON.stringify(product).substring(0, 200));
  }

  return { productHash, offerHash };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("SIGMAPAY_API_TOKEN") || "";
    const publicKey = Deno.env.get("SIGMAPAY_PUBLIC_KEY") || "";
    console.log("sigmapay v27 - secretKey starts:", secretKey.substring(0, 6), "publicKey starts:", publicKey.substring(0, 6));
    const apiToken = secretKey || publicKey;

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      if (!apiToken) {
        return new Response(JSON.stringify({ error: "Token não configurado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // Dynamically create product + offer
      const { productHash, offerHash } = await createProductWithOffer(apiToken, amountCentavos, title);

      console.log("sigmapay v26 - creating transaction with product:", productHash, "offer:", offerHash);

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
        cart: [
          {
            product_hash: productHash,
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

      console.log("sigmapay v25 - transaction payload:", JSON.stringify(payload).substring(0, 600));

      const res = await apiCall("/transactions", "POST", payload);
      const rawText = await res.text();
      console.log(`sigmapay v25 - transaction response (${res.status}):`, rawText.substring(0, 800));

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida", raw: rawText.substring(0, 200) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.message || "Erro ao criar pagamento", details: data.errors || data, status_code: res.status }), {
          status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      if (!apiToken) {
        return new Response(JSON.stringify({ error: "Token não configurado" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const txHash = body.transactionHash || body.paymentId;
      if (!txHash || typeof txHash !== "string") {
        return new Response(JSON.stringify({ error: "Hash da transação obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusRes = await apiCall(`/transactions/${encodeURIComponent(txHash)}?api_token=${apiToken}`, "GET");

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
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("SigmaPay function error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
