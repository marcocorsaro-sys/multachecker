import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sanity webhook handler for ISR revalidation.
 * Configure in Sanity: Settings > API > Webhooks
 * URL: https://multacheck.it/api/revalidate
 * Secret: SANITY_REVALIDATE_SECRET
 * Trigger on: Create, Update, Delete
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { _type } = body;

    if (_type) {
      // Revalidate by document type tag
      revalidateTag(_type);
    }

    return NextResponse.json({
      revalidated: true,
      type: _type,
      now: Date.now(),
    });
  } catch {
    return NextResponse.json(
      { message: "Error revalidating" },
      { status: 500 }
    );
  }
}
