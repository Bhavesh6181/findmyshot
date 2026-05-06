import { NextRequest, NextResponse } from "next/server";
import { MatchRequest, MatchResponse } from "@/types";
import { fetchBackend } from "@/lib/backend-url";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: MatchRequest = await request.json();

    if (!body.selfieBase64 || !body.eventCode) {
      return NextResponse.json(
        { error: "Missing selfieBase64 or eventCode" },
        { status: 400 }
      );
    }

    if (!process.env.BACKEND_URL) {
      // Return mock data when no backend is configured
      const mockPhotos: MatchResponse = {
        photos: [
          {
            url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
            cloudinaryId: "mock_001",
            confidence: 0.95,
          },
          {
            url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
            cloudinaryId: "mock_002",
            confidence: 0.88,
          },
          {
            url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=450&fit=crop",
            cloudinaryId: "mock_003",
            confidence: 0.82,
          },
          {
            url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
            cloudinaryId: "mock_004",
            confidence: 0.79,
          },
          {
            url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
            cloudinaryId: "mock_005",
            confidence: 0.75,
          },
          {
            url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=480&fit=crop",
            cloudinaryId: "mock_006",
            confidence: 0.71,
          },
        ],
      };
      return NextResponse.json(mockPhotos);
    }

    // Forward request to Python backend
    const backendResponse = await fetchBackend("/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selfieBase64: body.selfieBase64,
        eventId: body.eventCode,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    const photos = (data.photos ?? []) as MatchResponse["photos"];
    const totalScanned = Number(data.totalScanned ?? 0);
    return NextResponse.json({ photos, totalScanned });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
