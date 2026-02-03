import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") || "Mid-server-7xgnPcTTB7beSXoPywrEHkaV";

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
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === signatureKey;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("📨 Webhook received:", JSON.stringify(body, null, 2));

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

    const isValid = await verifySignature(
      order_id,
      status_code,
      gross_amount,
      MIDTRANS_SERVER_KEY,
      signature_key
    );

    if (!isValid) {
      console.error("❌ Invalid signature for order:", order_id);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid signature" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Signature verified for order:", order_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let shouldActivate = false;

    if (transaction_status === "capture") {
      shouldActivate = fraud_status === "accept";
    } else if (transaction_status === "settlement") {
      shouldActivate = true;
    } else if (["deny", "cancel", "expire"].includes(transaction_status)) {
      // Handle failed payment for both subscription and video credits
      
      // Check if it's a video credit order
      if (order_id.startsWith("VCRED-")) {
        await supabase
          .from("credit_purchases")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", order_id);
        
        console.log("❌ Video credit payment failed:", order_id);
      } else {
        // Original subscription logic
        await supabase
          .from("payments")
          .update({
            status: "failed",
            status_message: transaction_status,
            midtrans_response: body,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", order_id);

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

        console.log("❌ Subscription payment failed/cancelled:", order_id);
      }
    }

    if (shouldActivate) {
      // Check if it's a video credit order
      if (order_id.startsWith("VCRED-")) {
        console.log("🎉 Processing video credit payment:", order_id);
        
        // Get purchase details
        const { data: purchase, error: purchaseError } = await supabase
          .from("credit_purchases")
          .select("*")
          .eq("order_id", order_id)
          .single();
        
        if (purchaseError || !purchase) {
          console.error("❌ Purchase not found:", order_id);
        } else if (purchase.status === "paid") {
          console.log("⏭️ Already processed:", order_id);
        } else {
          // Update purchase status
          await supabase
            .from("credit_purchases")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", order_id);
          
          // Add credits to user
          const { data: currentCredits } = await supabase
            .from("user_credits")
            .select("balance, total_purchased")
            .eq("user_id", purchase.user_id)
            .single();
          
          if (currentCredits) {
            await supabase
              .from("user_credits")
              .update({
                balance: currentCredits.balance + purchase.credits,
                total_purchased: (currentCredits.total_purchased || 0) + purchase.credits,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", purchase.user_id);
            
            console.log(`✅ Added ${purchase.credits} credits to user ${purchase.user_id}`);
          } else {
            // Create new credit record
            await supabase
              .from("user_credits")
              .insert({
                user_id: purchase.user_id,
                balance: purchase.credits,
                total_purchased: purchase.credits,
                total_used: 0,
                total_refunded: 0,
              });
            
            console.log(`✅ Created credits for user ${purchase.user_id} with ${purchase.credits} credits`);
          }
        }
      } else {
        // Original subscription activation logic
        console.log("🎉 Activating subscription for order:", order_id);

        const { error } = await supabase.rpc("activate_subscription", {
          p_order_id: order_id,
          p_transaction_id: transaction_id || null,
          p_payment_type: payment_type || null,
          p_midtrans_response: body,
        });

        if (error) {
          console.error("❌ Failed to activate subscription:", error);
        } else {
          console.log("✅ Subscription activated!");
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
