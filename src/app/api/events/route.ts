import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-url";

function isBackendUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("econnrefused") ||
    message.includes("localhost:8000")
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      // Mock data when no backend configured
      return NextResponse.json({
        events: [
          { name: "College Fest 2025", code: "PICT25", photoCount: 42 },
          { name: "Wedding Reception", code: "WED2025", photoCount: 128 },
        ],
      });
    }

    const response = await fetchBackend("/events", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to fetch events from backend");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return NextResponse.json(
        {
          error:
            "Backend service is unreachable at BACKEND_URL. Start the Python backend on http://localhost:8000 or update BACKEND_URL.",
        },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { name, code } = body as { name: string; code: string };

    if (!name || !code) {
      return NextResponse.json(
        { error: "Missing name or code" },
        { status: 400 }
      );
    }

    // Validate: uppercase alphanumeric, max 8 chars
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

    if (cleanCode.length === 0) {
      return NextResponse.json(
        { error: "Event code must contain at least one alphanumeric character" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json({
        success: true,
        event: { name, code: cleanCode, photoCount: 0 },
      });
    }

    const response = await fetchBackend("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code: cleanCode }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return NextResponse.json(
        {
          error:
            "Backend service is unreachable at BACKEND_URL. Start the Python backend on http://localhost:8000 or update BACKEND_URL.",
        },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
