import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
import "https://deno.land/std@0.170.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.2.3";

const supabase_url = Deno.env.get("SUPABASE_URL"), supabase_key = Deno.env.get("SUPABASE_KEY"), supabase = createClient(supabase_url!, supabase_key!);

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const file = (fp:string) => { return Deno.readFile(fp) };

  if(path === "/") {
    return new Response(await file("./src/index.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/register") {
    return new Response(await file("./src/register.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/login") {
    return new Response(await file("./src/login.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/register-auth") {
    const req_body = await req.json(), email = req_body.email, password = req_body.password;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if(!error) {
      return new Response(JSON.stringify(data), { headers: { "content-type": "text/plain" }});
    } else {
      return new Response(JSON.stringify(error), { headers: { "content-type": "text/plain" }});
    }
  }

  else if(path === "/login-auth") {
    const req_body = await req.json(), email = req_body.email, password = req_body.password;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if(!error) {
      return new Response(JSON.stringify(data), { headers: { "content-type": "text/plain" }});
    } else {
      return new Response(JSON.stringify(error), { headers: { "content-type": "text/plain" }});
    }
  }

  else if(path === "/auth") {
    return new Response("auth", { headers: { "content-type": "text/plain" }});
  }

  else if(path === "/app") {
    return new Response(await file("./src/app.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  
  else {
    return new Response("404", { headers: { "content-type": "text/plain" } });
  }
}
console.log("Listening on http://localhost:8000");
serve(handler);