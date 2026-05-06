import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-url";

type Params = { params: { code: string } };

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const response = await fetchBackend(`/events/${params.code}`, { cache: "no-store" });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const response = await fetchBackend(`/events/${params.code}`, { method: "DELETE" });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
