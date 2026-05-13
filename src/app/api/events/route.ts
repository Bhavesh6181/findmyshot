import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-url";

function normalizeFastApiDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "msg" in item) {
        const m = (item as { msg?: unknown }).msg;
        return typeof m === "string" ? m : JSON.stringify(item);
      }
      return typeof item === "object" ? JSON.stringify(item) : String(item);
    });
    const joined = parts.filter(Boolean).join("; ");
    return joined || null;
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: unknown }).message;
    return typeof m === "string" ? m : null;
  }
  return null;
}

async function extractBackendError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  const trimmed = raw.trim();

  if (contentType.includes("application/json") && trimmed) {
    try {
      const payload = JSON.parse(trimmed) as {
        detail?: unknown;
        error?: unknown;
      };
      const fromDetail = normalizeFastApiDetail(payload?.detail);
      if (fromDetail) return fromDetail;
      if (typeof payload?.error === "string" && payload.error.trim())
        return payload.error.trim();
    } catch {
      return trimmed.replace(/^"+|"+$/g, "");
    }
  }

  return trimmed ? trimmed.replace(/^"+|"+$/g, "") : `Backend error (${response.status})`;
}

function isBackendUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("aborted") ||
    message.includes("econnrefused") ||
    message.includes("localhost:8000")
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    console.log("[GET /api/events] BACKEND_URL:", backendUrl ? "SET" : "MISSING");

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
      const backendError = await extractBackendError(response);
      return NextResponse.json({ error: backendError }, { status: response.status });
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
    console.log("[POST /api/events] BACKEND_URL:", process.env.BACKEND_URL ? "SET" : "MISSING");
    console.log("[POST /api/events] body:", JSON.stringify({ name, code }));

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
      const backendError = await extractBackendError(response);
      console.error("[POST /api/events] Backend error:", response.status, backendError);
      return NextResponse.json({ error: backendError }, { status: response.status });
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
