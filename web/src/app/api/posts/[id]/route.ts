import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, aiRewrittenText } = await req.json();

    await dbConnect();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (status) post.status = status;
    if (aiRewrittenText !== undefined) post.aiRewrittenText = aiRewrittenText;

    await post.save();

    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error: any) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    await Post.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
