import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ✅ SANDBOX MIDTRANS
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") || "Mid-server-miTgH21efvE9ucKHvbauulFW";
const IS_PRODUCTION = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
const MIDTRANS_API_URL = IS_PRODUCTION 
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    const body = await req.json();
    const { plan_id, order_id, amount, plan_name } = body;

    console.log("Creating payment:", { plan_id, order_id, amount, user_email: user.email, is_production: IS_PRODUCTION });

    if (!order_id || !amount) {
      throw new Error("Missing order_id or amount");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const customerName = userData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer";
    const customerEmail = user.email || "customer@email.com";

    const midtransPayload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
      item_details: [
        {
          id: plan_id,
          price: amount,
          quantity: 1,
          name: `OrbitBot ${plan_name || plan_id} - 30 Hari`,
        },
      ],
    };

    console.log("Calling Midtrans API:", MIDTRANS_API_URL);

    const authString = btoa(MIDTRANS_SERVER_KEY + ":");
    
    const midtransResponse = await fetch(MIDTRANS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransResult = await midtransResponse.json();
    console.log("Midtrans result:", midtransResult);

    if (!midtransResponse.ok || midtransResult.error_messages) {
      const errorMsg = midtransResult.error_messages?.join(", ") || "Midtrans API error";
      console.error("Midtrans error:", errorMsg);
      throw new Error(errorMsg);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order_id,
        snap_token: midtransResult.token,
        redirect_url: midtransResult.redirect_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
