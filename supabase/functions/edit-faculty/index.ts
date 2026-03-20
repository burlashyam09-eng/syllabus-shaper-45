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
    const { adminToken, facultyUserId, name, password } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!adminToken || !(await validateAdminToken(supabase, adminToken))) {
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

    if (!name && !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Nothing to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update name in profiles
    if (name && name.trim()) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: name.trim() })
        .eq("id", facultyUserId);

      if (profileError) {
        return new Response(
          JSON.stringify({ success: false, error: profileError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update password via admin API
    if (password) {
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(facultyUserId, {
        password,
      });

      if (authError) {
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
