import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Verify calling user is super_admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check super_admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Super admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, slug, ownerEmail, ownerPassword, contactPhone, location } = await req.json();

    if (!name || !slug || !ownerEmail || !ownerPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create auth user using admin API (won't affect current session)
    const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    });

    if (createUserError) {
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ownerId = newUser.user.id;

    // 2. Create studio
    const { data: studio, error: studioError } = await adminClient
      .from('studios')
      .insert({ name, slug, owner_id: ownerId, is_active: true, is_public: true })
      .select()
      .single();

    if (studioError) {
      return new Response(JSON.stringify({ error: studioError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Assign studio_admin role
    await adminClient.from('user_roles').insert({ user_id: ownerId, role: 'studio_admin' });

    // 4. Add as studio member
    await adminClient.from('studio_members').insert({ studio_id: studio.id, user_id: ownerId, role: 'admin' });

    // 5. Create default settings
    await adminClient.from('studio_settings').insert({
      studio_id: studio.id,
      contact_phone: contactPhone || null,
      address: location || null,
    });

    return new Response(JSON.stringify({ success: true, studio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
