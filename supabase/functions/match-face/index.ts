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
    console.log("Content-Type:", req.headers.get("content-type"));

    // Parse JSON body from client (base64-encoded file)
    const body = await req.json();
    const { name, mobile, event_id, threshold, file_base64, file_name, file_type } = body;

    console.log("Parsed fields:", { name, mobile, event_id, threshold, file_name, file_type, file_base64_length: file_base64?.length });

    // Convert base64 back to binary
    const binaryString = atob(file_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const fileBlob = new Blob([bytes], { type: file_type || "image/jpeg" });

    // Build FormData for Python API
    const formData = new FormData();
    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("event_id", event_id);
    formData.append("threshold", threshold || "0.55");
    formData.append("file", fileBlob, file_name || "selfie.jpg");

    console.log(`Forwarding FormData to Python API: ${PYTHON_API_URL}/match`);

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
