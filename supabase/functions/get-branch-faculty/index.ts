import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminToken, branchId } = await req.json();

    if (!adminToken || typeof adminToken !== "string" || !branchId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate admin token and check branch scope
    const { data: tokenData } = await supabase
      .from("admin_tokens")
      .select("branch_id")
      .eq("token", adminToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!tokenData) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the token's branch matches the requested branch
    const { data: branchData } = await supabase
      .from("branches")
      .select("name")
      .eq("id", branchId)
      .maybeSingle();

    const branchKey = branchData?.name?.toLowerCase();
    if (branchKey !== tokenData.branch_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: branch mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch faculty for this branch (using service role)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, faculty_code, branch_id, name, created_at")
      .eq("branch_id", branchId)
      .not("faculty_code", "is", null);

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count subjects for this branch
    const { count } = await supabase
      .from("subjects")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId);

    return new Response(
      JSON.stringify({ success: true, faculty: profiles || [], subjectCount: count || 0 }),
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
