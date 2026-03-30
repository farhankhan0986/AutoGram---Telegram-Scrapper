import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    await dbConnect();

    // Query filter based on status, or get pending by default
    const filter = status && status !== "all" ? { status } : {};
    
    // Sort by newest first
    const posts = await Post.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
