// deno-lint-ignore-file
import "https://deno.land/std@0.170.0/dotenv/load.ts";

import { serve, getCookies } from "https://deno.land/std@0.171.0/http/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.2.3";

const supabase_url = Deno.env.get("SUPABASE_URL"), supabase_key = Deno.env.get("SUPABASE_KEY"), supabase = createClient(supabase_url!, supabase_key!);

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const origin = url.origin;
  const file = (fp:string) => { return Deno.readFile(fp) };
  const route = (route:string) => { const regexRoute = new RegExp(route, "gmi"); if(regexRoute.test(path)){ return path } else { return null }}

  const access_token = getCookies(req.headers)["access-token"], refresh_token = getCookies(req.headers)["refresh-token"];

  if(path === "/") {
    if(access_token && refresh_token) {
      await supabase.auth.setSession({
        refresh_token: refresh_token,
        access_token: access_token
      })
      return Response.redirect(`${origin}/app`, 302);
    } else {
      return new Response(await file("./src/index.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
  }

  else if(path === "/register") {
    if(access_token && refresh_token) {
      await supabase.auth.setSession({
        refresh_token: refresh_token,
        access_token: access_token
      })
      return Response.redirect(`${origin}/app`, 302);
    } else {
      return new Response(await file("./src/register.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
  }

  else if(path === "/register-auth") {
    const auth = JSON.parse(await req.text()), username = auth.username, email = auth.email, password = auth.password;
    const register = supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username
        }
      }
    });
    const { data, error } = await register;
    if(!error) {
      const register_auth_headers = new Headers();
      register_auth_headers.append('Set-Cookie', `access-token=${data.session?.access_token}; path=/; max-age=3153600000; SameSite=Lax; secure`);
      register_auth_headers.append('Set-Cookie', `refresh-token=${data.session?.refresh_token}; path=/; max-age=3153600000; SameSite=Lax; secure`);
      return new Response("registered", { headers: register_auth_headers });
    } else {
      return new Response(String(error));
    }
  }

  else if(path === "/login") {
    if(access_token && refresh_token) {
      await supabase.auth.setSession({
        refresh_token: refresh_token,
        access_token: access_token
      })
      return Response.redirect(`${origin}/app`, 302);
    } else {
      return new Response(await file("./src/login.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
  }

  else if(path === "/login-auth") {
    const auth = JSON.parse(await req.text()), email = auth.email, password = auth.password;
    const login = supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    const { data, error } = await login;
    if(!error) {
      const login_auth_headers = new Headers();
      login_auth_headers.append('Set-Cookie', `access-token=${data.session?.access_token}; path=/; max-age=3153600000; SameSite=Lax; secure`);
      login_auth_headers.append('Set-Cookie', `refresh-token=${data.session?.refresh_token}; path=/; max-age=3153600000; SameSite=Lax; secure`);
      return new Response("logged in", { headers: login_auth_headers });
    } else {
      return new Response(String(error));
    }
  }

  else if(path === "/app") {
    if(access_token && refresh_token) {
      await supabase.auth.setSession({
        refresh_token: refresh_token,
        access_token: access_token
      })
      return new Response(await file("./src/app.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
    } else {
      return Response.redirect(`${origin}`, 302);
    }
  }

  else if(path === "/feed") {
    return new Response(await file("./src/feed.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/settings") {
    return new Response(await file("./src/settings.html"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  else if(path === "/logout") {
    const expires = new Date(0).toUTCString();
    const logout_headers = new Headers();
    logout_headers.append('Set-Cookie', `access-token=; path=/; expires=${expires}; SameSite=Lax; secure`);
    logout_headers.append('Set-Cookie', `refresh-token=; path=/; expires=${expires}; SameSite=Lax; secure`);
    return new Response("logout", { headers: logout_headers });
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
            user_posts.push(`<li>&#8212; <a href="/post/${post.id}">${post.content}</a>`);
          }
        })

        const profile = `
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, shrink-to-fit=no" />
            <link rel="preload" href="/index.css" as="style" />
            <link rel="stylesheet" media="all" href="/index.css" type="text/css" />
          </head>

          <nav>
            <ul>
              <li><a href="/">home</a></li>
              <li><a href="/login">login</a></li>
            </ul>
          </nav>

          <h1>~${username}</h1>
          <ul>
            ${user_posts}
          </ul>
        `;

        return new Response(profile, { headers: { "content-type": "text/html; charset=utf-8" } });
      } else {
        return new Response('not found', { status: 404 });
      }
    }
  }

  else if(path === route("/post\/.*")) {
    if(path.split("/").length > 3) {
      return new Response("not found", { status: 404 });
    } else {
      const post_id = path.split("/")[2];

      const { data } = await supabase.from('posts').select();

      let post_exists = false;
      let post_content: any;

      data?.forEach(post => {
        if(String(post.id) === post_id) {
          post_exists = true;
          post_content = post;
        }
      })

      let profiles = await supabase.from('profiles').select();
      profiles = profiles.data;

      let username = undefined;

      profiles.forEach(user => {
        if(user.id === post_content.user_id) {
          username = user.username;
        }
      });

      const post = `
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, shrink-to-fit=no" />
        <link rel="preload" href="/index.css" as="style" />
        <link rel="stylesheet" media="all" href="/index.css" type="text/css" />
      </head>

      <nav>
        <ul>
          <li><a href="/">home</a></li>
          <li><a href="/login">login</a></li>
        </ul>
      </nav>

      <h1><a href="/~${username}" style="text-decoration: none">~${username}</a></h1>
      <p>${post_content.content}</p>
      `;
      

      if(post_exists) {
        return new Response(post, { headers: { "content-type": "text/html; charset=utf-8" } });
      } else {
        return new Response('not found', { status: 404 });
      }
    }
  }
  
  else {
    return new Response("not found", { status: 404 });
  }
}
serve(handler);
