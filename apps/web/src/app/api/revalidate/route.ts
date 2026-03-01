import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Revalidation handler
  return NextResponse.json({ revalidated: true });
}
