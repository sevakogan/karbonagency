import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/sync/test-connection';
import type { PlatformSlug } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platformSlug, credentials } = body as {
      platformSlug: PlatformSlug;
      credentials: Record<string, string>;
    };

    if (!platformSlug || !credentials) {
      return NextResponse.json(
        { error: 'platformSlug and credentials are required' },
        { status: 400 }
      );
    }

    const result = await testConnection(platformSlug, credentials);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Test failed' },
      { status: 500 }
    );
  }
}
