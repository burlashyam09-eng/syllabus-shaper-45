import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function validateAdminToken(supabase: any, adminToken: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_tokens")
    .select("id")
    .eq("token", adminToken)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return !error && !!data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminToken, facultyUserId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate admin token against database
    if (!adminToken || typeof adminToken !== "string" || !(await validateAdminToken(supabase, adminToken))) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!facultyUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Faculty user ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete user role
    await supabase.from("user_roles").delete().eq("user_id", facultyUserId);

    // Delete profile
    await supabase.from("profiles").delete().eq("id", facultyUserId);

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(facultyUserId);

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
