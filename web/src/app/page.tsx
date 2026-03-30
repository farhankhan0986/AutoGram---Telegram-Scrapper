"use client";

import { useState, useEffect } from "react";
import PostCard from "@/components/PostCard";
import { Layers, Activity, Filter } from "lucide-react";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?status=${filter}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Error fetching posts", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers className="text-white" size={18} />
              </div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
                AutoGram
              </span>
            </div>
            
            <div className="flex gap-2">
              <span className="flex h-6 items-center px-2 py-1 text-xs font-semibold bg-gray-900 border border-gray-800 text-indigo-400 rounded-md">
                <Activity size={12} className="mr-1.5 animate-pulse" /> Live
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Content Review</h1>
            <p className="text-gray-400 text-sm font-medium">Approve and edit AI-rewritten posts before they go live.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-900 overflow-hidden rounded-lg p-1 border border-gray-800 shadow-sm">
            <Filter size={14} className="text-gray-500 mx-2" />
            {(["pending", "approved", "rejected", "published"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  filter === status
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
            <p className="text-gray-500 font-medium text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-gray-900/50 rounded-2xl border border-gray-800/80 mt-4 border-dashed">
            <div className="bg-gray-800 p-4 rounded-full mb-4.5">
              <Layers size={24} className="text-gray-500" />
            </div>
            <h3 className="text-gray-300 font-semibold mb-1">No posts found</h3>
            <p className="text-gray-500 text-sm">There are no {filter} posts in the queue right now.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onUpdate={fetchPosts} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
