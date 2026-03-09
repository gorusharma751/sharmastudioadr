import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studio_id, folder_link, event_id } = await req.json();

    if (!studio_id || !folder_link || !event_id) {
      return new Response(
        JSON.stringify({ error: "studio_id, folder_link, and event_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error: settingsError } = await supabase
      .from("studio_settings")
      .select("python_api_url")
      .eq("studio_id", studio_id)
      .single();

    if (settingsError || !settings?.python_api_url) {
      return new Response(
        JSON.stringify({ error: "Python API URL not configured in studio settings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = settings.python_api_url;
    console.log(`Calling ${apiUrl}/process-drive-folder with folder_link and event_id=${event_id}`);

    const apiRes = await fetch(`${apiUrl}/process-drive-folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder_link: folder_link,
        event_id: event_id,
      }),
    });

    const responseText = await apiRes.text();
    console.log(`Python API response: status=${apiRes.status}, body=${responseText.substring(0, 1000)}`);

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText.substring(0, 500) };
    }

    return new Response(
      JSON.stringify({ success: apiRes.ok, status: apiRes.status, data: responseData }),
      { status: apiRes.ok ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
