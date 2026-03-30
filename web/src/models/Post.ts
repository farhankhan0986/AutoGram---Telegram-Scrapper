import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  originalText: string;
  aiRewrittenText: string;
  status: "pending" | "approved" | "rejected" | "published";
  sourceChannel: string;
  sourceMessageId?: number;
  publishedMessageId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    originalText: { type: String, required: true },
    aiRewrittenText: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "published"],
      default: "pending",
    },
    sourceChannel: { type: String, required: true },
    sourceMessageId: { type: Number },
    publishedMessageId: { type: Number },
  },
  {
    timestamps: true,
  }
);

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
