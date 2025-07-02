import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.cookies.set(name, value),
          );
        },
      },
    },
  );

  const isAuthRoute =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/sign-up" ||
    request.nextUrl.pathname === "/";

  function getWeekOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = (date.getTime() - start.getTime()) / 86400000;
    return Math.ceil((diff + start.getDay() + 1) / 7);
  }

  if (isAuthRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const now = new Date();
      const weekOfYear = getWeekOfYear(now);
      const year = now.getFullYear();

      return NextResponse.redirect(
        new URL(
          `/${year}/week/${weekOfYear}`,
          process.env.NEXT_PUBLIC_BASE_URL,
        ),
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabaseResponse;
}
