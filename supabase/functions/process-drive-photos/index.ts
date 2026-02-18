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
    const { studio_id } = await req.json();

    if (!studio_id) {
      return new Response(
        JSON.stringify({ error: "studio_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error: settingsError } = await supabase
      .from("studio_settings")
      .select("python_api_url, google_drive_folder")
      .eq("studio_id", studio_id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "Studio settings not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { python_api_url, google_drive_folder } = settings;

    if (!python_api_url || !google_drive_folder) {
      return new Response(
        JSON.stringify({ error: "Missing required settings (Python API URL or Google Drive folder)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Calling ${python_api_url}/process-drive-folder with folder_link and event_id=${studio_id}`);

    const apiRes = await fetch(`${python_api_url}/process-drive-folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder_link: google_drive_folder,
        event_id: studio_id,
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
      JSON.stringify({
        success: apiRes.ok,
        status: apiRes.status,
        data: responseData,
      }),
      {
        status: apiRes.ok ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
