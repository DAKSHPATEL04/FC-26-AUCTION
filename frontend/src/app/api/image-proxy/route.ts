import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["cdn.sofifa.net", "cdn.jsdelivr.net", "media.futdb.app"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url query param", { status: 400 });
  }

  // Fix known bad paths stored in DB (sofifa.net dropped /meta/ prefix)
  url = url.replace("cdn.sofifa.net/meta/teams/", "cdn.sofifa.net/teams/");
  url = url.replace("cdn.sofifa.net/meta/flags/", "cdn.sofifa.net/flags/");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new NextResponse("Invalid protocol", { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const imageRes = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "FC26-Auction-Image-Proxy",
        // sofifa.net requires a Referer to serve images
        Referer: "https://sofifa.com/",
      },
      // Don't cache the fetch itself; we'll set our own cache headers
      cache: "no-store",
    });

    if (!imageRes.ok) {
      return new NextResponse(`Upstream error: ${imageRes.status}`, {
        status: imageRes.status,
      });
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/*";
    const imageBuffer = await imageRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache images in the browser for 24 hours
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[image-proxy] fetch error:", err);
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
