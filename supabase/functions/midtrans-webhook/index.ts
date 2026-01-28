// supabase/functions/midtrans-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!;

// Verify Midtrans signature
async function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): Promise<boolean> {
  const payload = orderId + statusCode + grossAmount + serverKey;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === signatureKey;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    const {
      order_id,
      transaction_id,
      transaction_status,
      payment_type,
      status_code,
      gross_amount,
      signature_key,
      fraud_status,
    } = body;

    // Verify signature
    const isValid = await verifySignature(
      order_id,
      status_code,
      gross_amount,
      MIDTRANS_SERVER_KEY,
      signature_key
    );

    if (!isValid) {
      console.error("Invalid signature!");
      return new Response(
        JSON.stringify({ success: false, message: "Invalid signature" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different transaction statuses
    let paymentStatus = "pending";
    let shouldActivate = false;

    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        paymentStatus = "paid";
        shouldActivate = true;
      } else if (fraud_status === "challenge") {
        paymentStatus = "pending";
      }
    } else if (transaction_status === "settlement") {
      paymentStatus = "paid";
      shouldActivate = true;
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      paymentStatus = "failed";
      
      // Update payment status to failed
      await supabase
        .from("payments")
        .update({
          status: paymentStatus,
          status_message: transaction_status,
          midtrans_response: body,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", order_id);
        
      // Update subscription status
      const { data: payment } = await supabase
        .from("payments")
        .select("subscription_id")
        .eq("order_id", order_id)
        .single();
        
      if (payment?.subscription_id) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", payment.subscription_id);
      }
    } else if (transaction_status === "refund") {
      paymentStatus = "refunded";
    }

    // Activate subscription if payment successful
    if (shouldActivate) {
      const { data, error } = await supabase.rpc("activate_subscription", {
        p_order_id: order_id,
        p_transaction_id: transaction_id,
        p_payment_type: payment_type,
        p_midtrans_response: body,
      });

      if (error) {
        console.error("Failed to activate subscription:", error);
      } else {
        console.log("Subscription activated successfully");
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: paymentStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
