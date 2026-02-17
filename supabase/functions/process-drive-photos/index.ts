import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const sa = JSON.parse(serviceAccountKey);

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  let pemContent = sa.private_key;
  pemContent = pemContent.replace(/-----BEGIN PRIVATE KEY-----/g, "");
  pemContent = pemContent.replace(/-----END PRIVATE KEY-----/g, "");
  pemContent = pemContent.replace(/\\n/g, "");
  pemContent = pemContent.replace(/\n/g, "");
  pemContent = pemContent.replace(/\r/g, "");
  pemContent = pemContent.replace(/\s+/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signInput = `${headerB64}.${claimB64}`;

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${signInput}.${sigB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

function extractFolderId(folderUrl: string): string {
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = folderUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return folderUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studio_id, batch_size = 1, page_token = "" } = await req.json();

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
      .select("python_api_url, mongodb_uri, google_drive_folder, google_service_account_key")
      .eq("studio_id", studio_id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "Studio settings not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { python_api_url, mongodb_uri, google_drive_folder, google_service_account_key } = settings;

    if (!python_api_url || !mongodb_uri || !google_drive_folder || !google_service_account_key) {
      return new Response(
        JSON.stringify({ error: "Missing required settings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Getting Google Drive access token...");
    let accessToken: string;
    try {
      accessToken = await getAccessToken(google_service_account_key);
    } catch (e) {
      console.error("Auth error:", e);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Google Drive", details: String(e) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const folderId = extractFolderId(google_drive_folder);
    console.log(`Listing images in folder: ${folderId}, pageToken: ${page_token ? 'yes' : 'initial'}`);

    const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name),nextPageToken&pageSize=${batch_size}${page_token ? `&pageToken=${page_token}` : ""}`;

    let listRes: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (listRes.ok) break;
      if (attempt < 2) {
        console.log(`Drive listing attempt ${attempt + 1} failed (${listRes.status}), retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!listRes || !listRes.ok) {
      const errText = listRes ? await listRes.text() : "No response";
      return new Response(
        JSON.stringify({ error: "Failed to list Drive files", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const listData = await listRes.json();
    const imageFiles: Array<{ id: string; name: string }> = listData.files || [];
    const nextPageToken = listData.nextPageToken || "";

    console.log(`Got ${imageFiles.length} images, has_more: ${!!nextPageToken}`);

    if (imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, batch_processed: 0, failed: 0, has_more: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process only the FIRST image to stay within memory limits
    const file = imageFiles[0];
    try {
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const driveImageUrl = `https://lh3.googleusercontent.com/d/${file.id}`;

      const embedRes = await fetch(`${python_api_url}/generate-embedding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: downloadUrl,
          access_token: accessToken,
        }),
      });

      if (!embedRes.ok) {
        const errText = await embedRes.text();
        errors.push(`Embedding failed for ${file.name}: ${errText}`);
        failed++;
      } else {
        const embedData = await embedRes.json();

        if (!embedData.embedding || embedData.embedding.length === 0) {
          console.log(`No face in ${file.name}, skipping`);
        } else {
          const storeRes = await fetch(`${python_api_url}/store-embedding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mongodb_uri,
              studio_id,
              file_id: file.id,
              file_name: file.name,
              image_url: driveImageUrl,
              embedding: embedData.embedding,
            }),
          });

          if (!storeRes.ok) {
            const errText = await storeRes.text();
            errors.push(`Store failed for ${file.name}: ${errText}`);
            failed++;
          } else {
            processed++;
            console.log(`Processed: ${file.name}`);
          }
        }
      }
    } catch (e) {
      errors.push(`Error: ${file.name}: ${String(e)}`);
      failed++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        batch_processed: processed,
        failed,
        has_more: !!nextPageToken,
        next_page_token: nextPageToken,
        errors: errors.slice(0, 5),
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
