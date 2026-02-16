import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studio_id, name, phone, selfie_base64 } = await req.json();

    if (!studio_id || !name || !phone || !selfie_base64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: studio_id, name, phone, selfie_base64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get studio settings from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error: settingsError } = await supabase
      .from("studio_settings")
      .select("python_api_url, mongodb_uri, google_drive_folder")
      .eq("studio_id", studio_id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "Studio settings not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { python_api_url, mongodb_uri } = settings;

    if (!python_api_url || !mongodb_uri) {
      return new Response(
        JSON.stringify({ error: "Python API URL or MongoDB URI not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Send selfie to Python API to generate embedding
    console.log("Generating face embedding via Python API...");
    let embedding: number[];
    try {
      const embedRes = await fetch(`${python_api_url}/generate-embedding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: selfie_base64 }),
      });

      if (!embedRes.ok) {
        const errText = await embedRes.text();
        console.error("Embedding API error:", errText);
        return new Response(
          JSON.stringify({ error: "Failed to generate face embedding", details: errText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const embedData = await embedRes.json();
      embedding = embedData.embedding;
    } catch (e) {
      console.error("Embedding fetch error:", e);
      return new Response(
        JSON.stringify({ error: "Could not connect to Python API server" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Send embedding to Python API for matching against MongoDB
    console.log("Matching face against database...");
    let matchedPhotos: string[] = [];
    try {
      const matchRes = await fetch(`${python_api_url}/match-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedding,
          mongodb_uri,
          studio_id,
          threshold: 0.75,
        }),
      });

      if (!matchRes.ok) {
        const errText = await matchRes.text();
        console.error("Match API error:", errText);
        return new Response(
          JSON.stringify({ error: "Face matching failed", details: errText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const matchData = await matchRes.json();
      matchedPhotos = matchData.matched_photos || [];
    } catch (e) {
      console.error("Match fetch error:", e);
      return new Response(
        JSON.stringify({ error: "Could not connect to Python API for matching" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Save the request and results to Supabase
    await supabase.from("photo_search_requests").insert({
      studio_id,
      name,
      phone,
      selfie_url: selfie_base64.substring(0, 100) + "...", // Don't store full base64
      status: matchedPhotos.length > 0 ? "completed" : "pending",
    });

    // Step 4: Save customer to MongoDB via Python API (for admin search later)
    try {
      await fetch(`${python_api_url}/save-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mongodb_uri,
          studio_id,
          name,
          phone,
          embedding,
          matched_photos: matchedPhotos,
        }),
      });
    } catch (e) {
      console.error("Save customer error (non-critical):", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        matched_photos: matchedPhotos,
        total_matches: matchedPhotos.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
