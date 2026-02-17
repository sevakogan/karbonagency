import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function handleSignOut(request: NextRequest) {
  const cookieStore = await cookies();
  const { origin } = new URL(request.url);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore cookie errors during sign-out
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignore cookie errors during sign-out
          }
        },
      },
    }
  );

  await supabase.auth.signOut();

  // Use 303 See Other to ensure browsers follow redirect as GET
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}

export async function POST(request: NextRequest) {
  return handleSignOut(request);
}

// GET fallback for browsers that don't follow POST redirects
export async function GET(request: NextRequest) {
  return handleSignOut(request);
}
