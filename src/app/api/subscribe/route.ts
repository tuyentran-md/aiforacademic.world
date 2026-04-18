import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/subscribe
 * Proxies to tuyentranmd.com/api/subscribe (shares same KV).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch("https://tuyentranmd.com/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, lang: "EN", source: "aiforacademic" }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
