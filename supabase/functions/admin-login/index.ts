import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, password } = await req.json();

    // Validate admin credentials server-side
    const ADMIN_USER_ID = "syamalarao@2005";
    const ADMIN_PASSWORD = "9951778399";

    if (userId === ADMIN_USER_ID && password === ADMIN_PASSWORD) {
      // Generate a simple session token
      const token = crypto.randomUUID();
      return new Response(
        JSON.stringify({ success: true, token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid admin credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
