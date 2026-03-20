import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, password, branchId } = await req.json();

    if (!branchId || !userId || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Branch selection and credentials required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limiting: check recent attempts from this IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

    const { count: attemptCount } = await supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gt("attempted_at", windowStart);

    if ((attemptCount || 0) >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many login attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record this attempt
    await supabase.from("admin_login_attempts").insert({ ip_address: clientIp });

    // Add a constant-time delay to slow brute force
    await new Promise(r => setTimeout(r, 500));

    // Load credentials from environment secrets
    const adminCredentials: Record<string, { userId: string; password: string }> = {
      cse: {
        userId: Deno.env.get("ADMIN_CSE_USERID") || "",
        password: Deno.env.get("ADMIN_CSE_PASSWORD") || "",
      },
      it: {
        userId: Deno.env.get("ADMIN_IT_USERID") || "",
        password: Deno.env.get("ADMIN_IT_PASSWORD") || "",
      },
    };

    // Find matching admin credentials for the branch
    const branchKey = Object.keys(adminCredentials).find(key => {
      const creds = adminCredentials[key];
      return creds.userId === userId && creds.password === password;
    });

    if (branchKey) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase
        .from("admin_tokens")
        .insert({ token, branch_id: branchKey, expires_at: expiresAt });

      if (insertError) {
        console.error("Token insert error:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Server error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clean up old attempts on successful login
      await supabase
        .from("admin_login_attempts")
        .delete()
        .eq("ip_address", clientIp);

      return new Response(
        JSON.stringify({ success: true, token, branchId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid admin credentials for this branch" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
