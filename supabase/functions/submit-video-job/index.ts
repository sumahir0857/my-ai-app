// supabase/functions/submit-video-job/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SERVER-SIDE PRICING - Client TIDAK BISA manipulasi ini!
const MODEL_PRICING: Record<string, number> = {
  // Kling
  "kling-2-5-pro": 38,
  "kling-o1-pro-i2v": 56,
  "kling-o1-std-i2v": 42,
  "kling-o1-pro-ref": 84,
  "kling-o1-std-ref": 63,
  "kling-2-6-pro": 35,
  "kling-2-6-motion-pro": 70,
  "kling-2-6-motion-std": 35,
  "kling-2-1-pro": 50,
  "kling-1-6-pro": 51,
  "kling-1-6-std": 30,
  // MiniMax
  "minimax-live": 50,
  "minimax-hailuo-1080p": 49,
  "minimax-hailuo-1080p-fast": 33,
  "minimax-hailuo-768p": 28,
  "minimax-hailuo-768p-fast": 19,
  // WAN
  "wan-i2v-720p": 50,
  "wan-i2v-1080p": 75,
  "wan-t2v-720p": 50,
  "wan-t2v-1080p": 75,
  // Seedance
  "seedance-480p": 13,
  "seedance-720p": 28,
  "seedance-1080p": 31,
  // LTX
  "ltx-t2v": 30,
  "ltx-i2v": 30,
  // Others
  "runway-gen4": 75,
  "omnihuman": 81,
  "vfx": 9,
}

const MAX_JOBS_PER_USER = 5

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate Authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Client untuk validasi user (menggunakan token user)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Admin client untuk operasi database (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Get and validate user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse request body
    const body = await req.json()
    const { model_id, prompt, negative_prompt, settings } = body

    // 5. Validate model_id
    if (!model_id || !MODEL_PRICING[model_id]) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid model: ${model_id}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. SERVER-SIDE: Calculate credits (IGNORE client's credits_used!)
    const requiredCredits = MODEL_PRICING[model_id]

    // 7. Check user's current balance
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('balance, total_used')
      .eq('user_id', user.id)
      .single()

    if (creditError || !creditData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Check sufficient balance
    if (creditData.balance < requiredCredits) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient credits. Required: ${requiredCredits}, Available: ${creditData.balance}` 
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 9. Check active jobs limit
    const { count: activeJobsCount } = await supabaseAdmin
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('service', 'videoapi')
      .in('status', ['pending', 'processing'])

    if (activeJobsCount && activeJobsCount >= MAX_JOBS_PER_USER) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Maximum ${MAX_JOBS_PER_USER} concurrent jobs allowed. Please wait for current jobs to complete.` 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 10. Deduct credits FIRST (atomic operation)
    const newBalance = creditData.balance - requiredCredits
    const newTotalUsed = (creditData.total_used || 0) + requiredCredits

    const { error: deductError } = await supabaseAdmin
      .from('user_credits')
      .update({
        balance: newBalance,
        total_used: newTotalUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('balance', creditData.balance) // Optimistic locking

    if (deductError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to deduct credits. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 11. Create job with SERVER-CALCULATED credits
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        user_id: user.id,
        service: 'videoapi',
        status: 'pending',
        input_data: {
          model_id,
          prompt: prompt || '',
          negative_prompt: negative_prompt || '',
          credits_used: requiredCredits, // SERVER-SIDE VALUE!
          user_id: user.id,
          settings: settings || {}
        },
        total_steps: 4,
        current_step: 0,
        step_name: 'Queued',
        progress_percent: 0
      })
      .select()
      .single()

    if (jobError) {
      // Rollback credits if job creation fails
      await supabaseAdmin
        .from('user_credits')
        .update({
          balance: creditData.balance,
          total_used: creditData.total_used || 0
        })
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 12. Log the transaction for audit
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'deduct',
        amount: requiredCredits,
        balance_after: newBalance,
        reference_type: 'job',
        reference_id: job.id,
        model_id: model_id,
        description: `Video generation: ${model_id}`
      })
      .catch(e => console.log('Transaction log error:', e))

    // 13. Return success
    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        credits_charged: requiredCredits,
        balance_remaining: newBalance,
        message: `Job created successfully. ${requiredCredits} credits charged.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Submit job error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
