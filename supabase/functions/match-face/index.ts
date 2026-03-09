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
    const { studio_id, event_id, name, phone, selfie_base64 } = await req.json();

    if (!studio_id || !event_id || !name || !phone || !selfie_base64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: studio_id, event_id, name, phone, selfie_base64" }),
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
        JSON.stringify({ error: "Python API URL not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = settings.python_api_url;

    // Convert base64 to a file blob for multipart/form-data
    const binaryStr = atob(selfie_base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("event_id", event_id);
    formData.append("name", name);
    formData.append("mobile", phone);
    formData.append("file", blob, "selfie.jpg");
    formData.append("threshold", "0.55");

    console.log(`Calling ${apiUrl}/match with event_id=${event_id}, name=${name}`);

    const matchRes = await fetch(`${apiUrl}/match`, {
      method: "POST",
      body: formData,
    });

    const responseText = await matchRes.text();
    console.log(`Match API response: status=${matchRes.status}, body=${responseText.substring(0, 1000)}`);

    let matchData: any;
    try {
      matchData = JSON.parse(responseText);
    } catch {
      matchData = { raw_response: responseText.substring(0, 500) };
    }

    // Save the search request to Supabase
    await supabase.from("photo_search_requests").insert({
      studio_id,
      name,
      phone,
      selfie_url: `event:${event_id}`,
      status: matchRes.ok ? "completed" : "pending",
    });

    const matchedPhotos = matchData?.matched_photos || matchData?.results || [];

    return new Response(
      JSON.stringify({
        success: matchRes.ok,
        matched_photos: matchedPhotos,
        total_matches: matchedPhotos.length,
        raw: matchData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
