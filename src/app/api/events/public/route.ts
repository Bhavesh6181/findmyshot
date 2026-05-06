import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-url";

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetchBackend("/events?limit=100", {
      next: { revalidate: 30 },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    const events = (data.events ?? []).map((event: Record<string, unknown>) => ({
      name: event.name,
      code: event.code,
      photoCount: event.photoCount ?? 0,
      createdAt: event.createdAt ?? null,
      updatedAt: event.updatedAt ?? null,
    }));
    return NextResponse.json(
      { events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch public events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
