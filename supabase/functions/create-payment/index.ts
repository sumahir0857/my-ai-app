// supabase/functions/create-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!;
const MIDTRANS_IS_PRODUCTION = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid token");
    }

    // Get request body
    const { plan_id } = await req.json();
    
    if (!plan_id) {
      throw new Error("plan_id is required");
    }

    // Create order in database
    const { data: orderData, error: orderError } = await supabase
      .rpc("create_payment_order", { p_plan_id: plan_id });

    if (orderError || !orderData?.[0]?.success) {
      throw new Error(orderData?.[0]?.message || orderError?.message || "Failed to create order");
    }

    const order = orderData[0];

    // Get user details
    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    // Create Midtrans transaction
    const midtransPayload = {
      transaction_details: {
        order_id: order.order_id,
        gross_amount: order.amount,
      },
      customer_details: {
        first_name: userData?.full_name || user.email?.split("@")[0] || "Customer",
        email: user.email,
      },
      item_details: [
        {
          id: plan_id,
          price: order.amount,
          quantity: 1,
          name: `OrbitBot ${plan_id.charAt(0).toUpperCase() + plan_id.slice(1)} Plan - 30 Days`,
        },
      ],
      callbacks: {
        finish: `${req.headers.get("origin")}/payment-success`,
        error: `${req.headers.get("origin")}/payment-error`,
        pending: `${req.headers.get("origin")}/payment-pending`,
      },
    };

    // Call Midtrans API
    const authString = btoa(MIDTRANS_SERVER_KEY + ":");
    const midtransResponse = await fetch(MIDTRANS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      console.error("Midtrans error:", midtransData);
      throw new Error(midtransData.error_messages?.join(", ") || "Midtrans error");
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.order_id,
        snap_token: midtransData.token,
        redirect_url: midtransData.redirect_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
