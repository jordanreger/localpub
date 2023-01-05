import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
import "https://deno.land/std@0.170.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.2.3";

const supabase_url = Deno.env.get("SUPABASE_URL"), supabase_key = Deno.env.get("SUPABASE_KEY"), supabase = createClient(supabase_url!, supabase_key!);

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const file = (fp:string) => { return Deno.readFile(fp) };
  const route = (route:string) => { const regexRoute = new RegExp(route, "gmi"); if(regexRoute.test(path)){ return path } else { return null }}

  if(path === "/") {
    return new Response(await file("./src/index.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/register") {
    return new Response(await file("./src/register.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/login") {
    return new Response(await file("./src/login.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/app") {
    return new Response(await file("./src/app.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/settings") {
    return new Response(await file("./src/settings.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/index.css") {
    return new Response(await file("./src/index.css"), { headers: { "content-type": "text/css" } });
  }

  else if(path === route("\/\~.*")) {
    if(path.split("/").length > 2) {
      return new Response("not found", { status: 404 });
    } else {
      const username = path.split("/")[1].replaceAll("~", "");
      const { data } = await supabase.from('profiles').select();

      let user_exists = false;
      let user_id: string;

      data?.forEach(user => {
        if(user.username === username) {
          user_exists = true;
          user_id = user.id;
        }
      })

      if(user_exists) {
        const user_posts: Array<string> = [];
        const { data } = await supabase.from('posts').select();
        data?.forEach(post => {
          if(post.user_id === user_id) {
            user_posts.push(post);
          }
        })

        return new Response(JSON.stringify(user_posts), { headers: { "content-type": "application/json" } });
      } else {
        return new Response('not found', { status: 404 });
      }
    }
  }
  
  else {
    return new Response("not found", { status: 404 });
  }
}
console.log("Listening on http://localhost:8000");
serve(handler);