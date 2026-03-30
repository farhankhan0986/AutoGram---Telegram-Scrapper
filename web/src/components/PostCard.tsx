"use client";

import { useState } from "react";
import { Check, X, Edit2, Save, Trash2 } from "lucide-react";

export default function PostCard({ post, onUpdate }: { post: any, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(post.aiRewrittenText);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    setIsLoading(true);
    try {
      await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiRewrittenText: editedText }),
      });
      setIsEditing(false);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: any = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    published: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden glassmorphism transition-all duration-300 hover:border-gray-700">
      <div className="bg-gray-800/50 px-5 py-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-sm font-medium">#{post.sourceMessageId}</span>
          <span className="text-indigo-400 font-semibold text-sm">@{post.sourceChannel}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[post.status]}`}>
            {post.status.toUpperCase()}
          </span>
        </div>
        <span className="text-gray-500 text-xs">{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Original Scraped</h3>
          <div className="bg-gray-950 rounded-lg p-4 h-48 overflow-y-auto custom-scrollbar text-gray-300 text-sm whitespace-pre-wrap">
            {post.originalText}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Groq AI Rewrite
            </h3>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-gray-400 hover:text-white transition-colors"
                title="Edit AI Output"
              >
                <Edit2 size={14} />
              </button>
            ) : null}
          </div>
          
          {isEditing ? (
            <div className="relative h-48">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-full bg-gray-950 text-gray-200 text-sm rounded-lg p-4 border border-indigo-500/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none whitespace-pre-wrap"
              />
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-md shadow-lg transition-all"
              >
                <Save size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-gray-800/40 rounded-lg p-4 h-48 overflow-y-auto custom-scrollbar text-white font-medium text-sm whitespace-pre-wrap border border-gray-800 shadow-inner">
              {post.aiRewrittenText || "Generating..."}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-950/50 px-5 py-4 flex justify-end gap-3 border-t border-gray-800">
        <button
          disabled={isLoading || post.status === "rejected"}
          onClick={() => handleStatusUpdate("rejected")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
        >
          <X size={16} /> Reject
        </button>
        <button
          disabled={isLoading || post.status === "approved" || post.status === "published"}
          onClick={() => handleStatusUpdate("approved")}
          className="flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:bg-gray-700 disabled:shadow-none"
        >
          <Check size={16} /> Approve
        </button>
      </div>
    </div>
  );
}
