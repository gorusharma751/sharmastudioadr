// @ts-nocheck
// Deno runtime globals are provided by Supabase Edge Runtime — not in VS Code TS config.

const PYTHON_API_URL = Deno.env.get("PYTHON_API_URL") || "https://sharmastudioadr.onrender.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchJson(url: string, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const text = await r.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 300) }; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, data: null, error: String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // ── Action: status diagnostics ────────────────────────────────────────
    // Called by admin panel to check API health, DB, and per-event embeddings.
    if (body.action === "status") {
      const health = await fetchJson(`${PYTHON_API_URL}/health`, 12000);
      const db = await fetchJson(`${PYTHON_API_URL}/test-db`, 15000);

      const events: Record<string, unknown> = {};
      if (Array.isArray(body.event_ids)) {
        for (const eid of body.event_ids) {
          events[eid] = await fetchJson(`${PYTHON_API_URL}/event-stats/${encodeURIComponent(eid)}`, 15000);
        }
      }

      return new Response(
        JSON.stringify({ health, db, events }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Normal action: process drive folder and embed faces ───────────────
    const { folder_link, event_id } = body;

    if (!folder_link || !event_id) {
      return new Response(
        JSON.stringify({ error: "folder_link and event_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing drive folder for event_id=${event_id}`);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000); // 2-minute timeout for photo processing
    let apiRes: Response;
    try {
      apiRes = await fetch(`${PYTHON_API_URL}/process-drive-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_link, event_id }),
        signal: ctrl.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      return new Response(
        JSON.stringify({ success: false, error: "Python API unreachable", details: String(fetchErr) }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timer);

    const responseText = await apiRes.text();
    console.log(`Python API status=${apiRes.status} body=${responseText.substring(0, 500)}`);

    let responseData: unknown;
    try { responseData = JSON.parse(responseText); } catch { responseData = { raw_response: responseText.substring(0, 500) }; }

    // Surface backend auth/config errors clearly
    const dataObj = responseData as Record<string, unknown>;
    if (dataObj?.error && String(dataObj.error).includes("bad auth")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database authentication failed",
          detail: "The Python API cannot connect to its database. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY in your Render.com service dashboard.",
          raw: dataObj.error,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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