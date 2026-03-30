import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { messageText, sourceChannel, messageId } = await req.json();

    if (!messageText || !sourceChannel) {
      return NextResponse.json(
        { error: "messageText and sourceChannel are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Try to get an AI rewrite
    let aiRewrittenText = "";
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert copywriter. Rewrite the following Telegram post to be more engaging, professional, and clear. Remove any excessive emojis, spammy links, or overly promotional tones. Output ONLY the rewritten text without any additional commentary.",
          },
          {
            role: "user",
            content: messageText,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });

      aiRewrittenText = completion.choices[0]?.message?.content || "";
    } catch (groqError) {
      console.error("Groq API error:", groqError);
      aiRewrittenText = "Error generating AI text. Please edit manually.";
    }

    // Save to database
    const newPost = new Post({
      originalText: messageText,
      aiRewrittenText,
      sourceChannel,
      sourceMessageId: messageId,
      status: "pending",
    });

    await newPost.save();

    return NextResponse.json(
      { success: true, postId: newPost._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
