// supabase/functions/check-expired/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Verify cron secret (optional, untuk keamanan)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the function to check expired subscriptions
    const { data, error } = await supabase.rpc("check_expired_subscriptions");

    if (error) {
      throw error;
    }

    console.log(`Checked expired subscriptions. Downgraded: ${data} users`);

    return new Response(
      JSON.stringify({ success: true, downgraded: data }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Cron error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
