import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const sa = JSON.parse(serviceAccountKey);
  
  // Create JWT for Google OAuth2
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Import the private key - clean all non-base64 characters
  let pemContent = sa.private_key;
  // Remove PEM headers/footers
  pemContent = pemContent.replace(/-----BEGIN PRIVATE KEY-----/g, "");
  pemContent = pemContent.replace(/-----END PRIVATE KEY-----/g, "");
  // Remove all whitespace and escape sequences
  pemContent = pemContent.replace(/\\n/g, "");
  pemContent = pemContent.replace(/\n/g, "");
  pemContent = pemContent.replace(/\r/g, "");
  pemContent = pemContent.replace(/\s+/g, "");
  
  console.log("PEM content length:", pemContent.length);
  console.log("PEM first 20 chars:", pemContent.substring(0, 20));
  console.log("PEM last 20 chars:", pemContent.substring(pemContent.length - 20));

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

  // Exchange JWT for access token
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
  // Extract folder ID from various Google Drive URL formats
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = folderUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return folderUrl; // Assume it's already an ID
}

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

    // Get studio settings
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
        JSON.stringify({ error: "Missing required settings: Python API, MongoDB, Google Drive folder, or Service Account Key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get access token using service account
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

    // Step 2: List all image files in the Drive folder
    const folderId = extractFolderId(google_drive_folder);
    console.log(`Listing images in folder: ${folderId}`);

    let imageFiles: Array<{ id: string; name: string }> = [];
    let pageToken = "";
    
    do {
      const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name),nextPageToken&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ""}`;

      const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listRes.ok) {
        const errText = await listRes.text();
        console.error("Drive API error:", errText);
        return new Response(
          JSON.stringify({ error: "Failed to list Drive files", details: errText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const listData = await listRes.json();
      imageFiles = imageFiles.concat(listData.files || []);
      pageToken = listData.nextPageToken || "";
    } while (pageToken);

    console.log(`Found ${imageFiles.length} images in Drive folder`);

    if (imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No images found in the Drive folder", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Process each image - download, generate embedding, store in MongoDB
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const file of imageFiles) {
      try {
        // Download image from Drive
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const imgRes = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!imgRes.ok) {
          errors.push(`Failed to download ${file.name}`);
          failed++;
          continue;
        }

        const imgBuffer = await imgRes.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));

        // Generate embedding via Python API
        const embedRes = await fetch(`${python_api_url}/generate-embedding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64 }),
        });

        if (!embedRes.ok) {
          const errText = await embedRes.text();
          errors.push(`Embedding failed for ${file.name}: ${errText}`);
          failed++;
          continue;
        }

        const embedData = await embedRes.json();

        // If no face detected, skip but don't count as error
        if (!embedData.embedding || embedData.embedding.length === 0) {
          console.log(`No face detected in ${file.name}, skipping`);
          continue;
        }

        // Store in MongoDB via Python API
        const driveImageUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
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
          continue;
        }

        processed++;
        console.log(`Processed ${processed}/${imageFiles.length}: ${file.name}`);
      } catch (e) {
        errors.push(`Error processing ${file.name}: ${String(e)}`);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_images: imageFiles.length,
        processed,
        failed,
        errors: errors.slice(0, 10), // Limit error output
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
