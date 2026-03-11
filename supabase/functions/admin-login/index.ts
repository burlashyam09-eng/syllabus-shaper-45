import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Branch-specific admin credentials
const ADMIN_CREDENTIALS: Record<string, { userId: string; password: string }> = {
  // CSE branch
  "cse": { userId: "syamalarao@2005", password: "995177" },
  // IT branch
  "it": { userId: "syamalarao@1135", password: "939854" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, password, branchId } = await req.json();

    if (!branchId) {
      return new Response(
        JSON.stringify({ success: false, error: "Branch selection required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find matching admin credentials for the branch
    const branchKey = Object.keys(ADMIN_CREDENTIALS).find(key => {
      const creds = ADMIN_CREDENTIALS[key];
      return creds.userId === userId && creds.password === password;
    });

    if (branchKey) {
      const token = crypto.randomUUID();
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
