const PYTHON_API_URL = "https://deepface-api-43ft.onrender.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function forwardToPythonAPI(formData: FormData, attempt: number): Promise<Response> {
  console.log(`Attempt ${attempt}: Forwarding FormData to Python API: ${PYTHON_API_URL}/match`);
  const response = await fetch(`${PYTHON_API_URL}/match`, {
    method: "POST",
    body: formData,
  });
  console.log(`Attempt ${attempt}: Python API response status: ${response.status}`);
  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request for /match");
    console.log("Content-Type:", req.headers.get("content-type"));

    const body = await req.json();
    const { name, mobile, event_id, threshold, file_base64, file_name, file_type } = body;

    console.log("Parsed fields:", { name, mobile, event_id, threshold, file_name, file_type, file_base64_length: file_base64?.length });

    if (!name || !mobile || !event_id || !file_base64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, mobile, event_id, file_base64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Retry up to 2 times for 502/503 (Render cold start)
    let response: Response | null = null;
    let responseText = "";
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rebuild FormData for each attempt (body can only be consumed once)
        const retryFormData = new FormData();
        retryFormData.append("name", name);
        retryFormData.append("mobile", mobile);
        retryFormData.append("event_id", event_id);
        retryFormData.append("threshold", threshold || "0.55");
        retryFormData.append("file", fileBlob, file_name || "selfie.jpg");

        response = await forwardToPythonAPI(retryFormData, attempt);
        responseText = await response.text();
        console.log(`Attempt ${attempt}: Response body (first 2000 chars):`, responseText.substring(0, 2000));

        // If not a 502/503, break out
        if (response.status !== 502 && response.status !== 503) {
          break;
        }

        // If it's a retryable error and we have more attempts, wait and retry
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt}: Got ${response.status}, retrying in 5 seconds...`);
          await new Promise(r => setTimeout(r, 5000));
        }
      } catch (fetchError) {
        console.error(`Attempt ${attempt}: Fetch error:`, fetchError);
        if (attempt < maxRetries) {
          console.log(`Retrying in 5 seconds...`);
          await new Promise(r => setTimeout(r, 5000));
        } else {
          return new Response(
            JSON.stringify({ error: "Python API is unreachable. The server may be starting up. Please try again in 30-60 seconds.", details: String(fetchError) }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({ error: "Failed to reach Python API after retries" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle non-OK responses
    if (!response.ok) {
      console.error(`Python API error: status=${response.status}, body=${responseText}`);
      return new Response(
        JSON.stringify({ 
          error: response.status === 502 || response.status === 503 
            ? "The AI server is waking up. Please wait 30-60 seconds and try again." 
            : "Error from Python API", 
          status: response.status,
          raw: responseText.substring(0, 500) 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON response
    let responseBody: any;
    try {
      responseBody = JSON.parse(responseText);
      console.log("Successfully parsed Python API response as JSON");
    } catch {
      console.error("Failed to parse Python API response as JSON. Raw:", responseText.substring(0, 500));
      responseBody = { error: "Invalid JSON from Python API", raw: responseText.substring(0, 500) };
      return new Response(JSON.stringify(responseBody), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(responseBody), {
      status: 200,
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
