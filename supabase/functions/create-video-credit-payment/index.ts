// supabase/functions/create-video-credit-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") || "";
const IS_PRODUCTION = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
const MIDTRANS_API_URL = IS_PRODUCTION 
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    const body = await req.json();
    const { package_id } = body;

    if (!package_id) {
      throw new Error("Missing package_id");
    }

    console.log("Creating credit purchase:", { package_id, user_id: user.id });

    // Create purchase order in database
    const { data: purchaseResult, error: purchaseError } = await supabase
      .rpc("create_credit_purchase", {
        p_user_id: user.id,
        p_package_id: package_id
      });

    if (purchaseError || !purchaseResult?.success) {
      throw new Error(purchaseResult?.error || purchaseError?.message || "Failed to create purchase");
    }

    const { order_id, package_name, credits, amount } = purchaseResult;

    // Get user info for Midtrans
    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const customerName = userData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer";
    const customerEmail = user.email || "customer@email.com";

    // Create Midtrans transaction
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
          id: package_id,
          price: amount,
          quantity: 1,
          name: `Video Credits - ${package_name} (${credits} kredit)`,
        },
      ],
      expiry: {
        unit: "hours",
        duration: 24
      }
    };

    console.log("Calling Midtrans:", MIDTRANS_API_URL);

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
      
      // Mark purchase as failed
      await supabase.rpc("fail_credit_purchase", { 
        p_order_id: order_id, 
        p_reason: errorMsg 
      });
      
      throw new Error(errorMsg);
    }

    // Update purchase with snap token
    await supabase
      .from("credit_purchases")
      .update({ snap_token: midtransResult.token })
      .eq("order_id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order_id,
        snap_token: midtransResult.token,
        redirect_url: midtransResult.redirect_url,
        credits: credits,
        amount: amount
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
