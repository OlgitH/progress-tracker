import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value);
        }

        response = NextResponse.next({
          request,
        });

        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname.startsWith('/login');
  const isAuthCallbackRoute = pathname.startsWith('/auth/callback');
  const isPublicAuthRoute = isLoginRoute || isAuthCallbackRoute;

  if (!user && !isPublicAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const requestedPath = request.nextUrl.searchParams.get('next');
    const url = request.nextUrl.clone();

    if (requestedPath && requestedPath.startsWith('/') && !requestedPath.startsWith('//')) {
      url.pathname = requestedPath;
      url.search = '';
      return NextResponse.redirect(url);
    }

    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
