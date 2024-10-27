const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  async function handleOptions(request) {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  async function handlePost(request) {
    try {
      const { email } = await request.json();
      
      // Basic email validation
      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ error: 'Invalid email' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
  
      // Store email in KV
      await EMAIL_LIST.put(email, JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'pending'
      }));
  
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  addEventListener('fetch', event => {
    if (event.request.method === 'OPTIONS') {
      return event.respondWith(handleOptions(event.request));
    }
    if (event.request.method === 'POST') {
      return event.respondWith(handlePost(event.request));
    }
  });