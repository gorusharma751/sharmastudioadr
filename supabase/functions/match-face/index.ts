const PYTHON_API_URL = "https://deepface-api-43ft.onrender.com";

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
    console.log("Received request for /match");

    // Forward the FormData directly to Python API
    const formData = await req.formData();

    console.log("FormData fields received:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(name=${value.name}, size=${value.size}, type=${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    console.log(`Forwarding request to Python API: ${PYTHON_API_URL}/match`);

    const response = await fetch(`${PYTHON_API_URL}/match`, {
      method: "POST",
      body: formData,
    });

    console.log("Python API response status:", response.status);

    const responseText = await response.text();
    console.log("Python API response body:", responseText.substring(0, 2000));

    let responseBody: any;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { error: "Invalid JSON from Python API", raw: responseText.substring(0, 500) };
    }

    return new Response(JSON.stringify(responseBody), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
