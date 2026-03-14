// @ts-nocheck
// Deno globals (Deno.serve, Request, Response, etc.) are provided by the
// Supabase Edge Runtime. VS Code TypeScript does not have Deno type definitions
// installed, so we suppress TS checking here. The Supabase CLI uses Deno's own
// type checker when bundling/deploying.

const PYTHON_API_URL = Deno.env.get("PYTHON_API_URL") || "https://sharmastudioadr.onrender.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── GET /match-face → health-check proxy ─────────────────────────────────
  // The browser calls this every few seconds to see if the Python API is awake.
  if (req.method === "GET") {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000); // 8 s timeout
      const r = await fetch(`${PYTHON_API_URL}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      const healthy = r.ok;
      return new Response(JSON.stringify({ healthy }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ healthy: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── POST /match-face → face-match proxy ──────────────────────────────────
  try {
    console.log("Received match request");
    const body = await req.json();
    const { name, mobile, event_id, threshold, file_base64, file_name, file_type } = body;

    console.log("Fields:", { name, mobile, event_id, threshold, file_name, file_type, b64len: file_base64?.length });

    if (!name || !mobile || !event_id || !file_base64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, mobile, event_id, file_base64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 image
    const binaryString = atob(file_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const fileBlob = new Blob([bytes], { type: file_type || "image/jpeg" });

    // Build FormData for Python API
    const formData = new FormData();
    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("event_id", event_id);
    formData.append("threshold", threshold || "0.35");
    formData.append("file", fileBlob, file_name || "selfie.jpg");

    console.log(`Calling ${PYTHON_API_URL}/match …`);

    let response: Response;
    try {
      // 150-second timeout — server is already awake by the time we call this
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 150000);
      response = await fetch(`${PYTHON_API_URL}/match`, { method: "POST", body: formData, signal: ctrl.signal });
      clearTimeout(timer);
    } catch (err) {
      console.error("Fetch to Python API failed:", err);
      return new Response(
        JSON.stringify({ error: "Python API unreachable", details: String(err) }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseText = await response.text();
    console.log(`Python API HTTP ${response.status} — body (first 1000):`, responseText.substring(0, 1000));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Python API error (${response.status})`, raw: responseText.substring(0, 500), status: response.status }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseBody: Record<string, unknown>;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      console.error("Invalid JSON from Python API:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Python API", raw: responseText.substring(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Python API response keys:", Object.keys(responseBody));
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
