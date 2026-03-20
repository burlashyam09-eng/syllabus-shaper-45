import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Debug: log credential comparison (remove after fixing)
    console.log("Input userId:", JSON.stringify(userId), "Input password:", JSON.stringify(password));
    console.log("CSE userId:", JSON.stringify(adminCredentials.cse.userId), "CSE password:", JSON.stringify(adminCredentials.cse.password));
    console.log("IT userId:", JSON.stringify(adminCredentials.it.userId), "IT password:", JSON.stringify(adminCredentials.it.password));

    // Find matching admin credentials for the branch
    const branchKey = Object.keys(adminCredentials).find(key => {
      const creds = adminCredentials[key];
      return creds.userId === userId && creds.password === password;
    });

    if (branchKey) {
      const token = crypto.randomUUID();

      // Store token in admin_tokens table with 30-minute expiry
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

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
