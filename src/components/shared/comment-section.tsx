"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageSquare, Reply } from "lucide-react";
import { addComment } from "@/server/actions/feedback";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; image: string | null };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    author: { name: string; image: string | null };
  }[];
}

interface CommentSectionProps {
  comments: Comment[];
  strategyId?: string;
  strategyItemId?: string;
  deliverableId?: string;
}

export function CommentSection({
  comments,
  strategyId,
  strategyItemId,
  deliverableId,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("content", content);
    if (strategyId) formData.set("strategyId", strategyId);
    if (strategyItemId) formData.set("strategyItemId", strategyItemId);
    if (deliverableId) formData.set("deliverableId", deliverableId);

    const result = await addComment(formData);
    if (result.success) {
      toast.success("Comment added");
      setContent("");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("content", replyContent);
    formData.set("parentId", parentId);
    if (strategyId) formData.set("strategyId", strategyId);
    if (deliverableId) formData.set("deliverableId", deliverableId);

    const result = await addComment(formData);
    if (result.success) {
      toast.success("Reply added");
      setReplyTo(null);
      setReplyContent("");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {comment.author.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="mr-1 h-3 w-3" />
                    Reply
                  </Button>
                </div>
              </div>

              {/* Replies */}
              {comment.replies.map((reply) => (
                <div key={reply.id} className="ml-11 flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                    {reply.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{reply.author.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              ))}

              {/* Reply form */}
              {replyTo === comment.id && (
                <div className="ml-11 flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    className="text-sm"
                    disabled={loading}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={loading || !replyContent.trim()}
                    >
                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setReplyTo(null); setReplyContent(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="text-sm"
          disabled={loading}
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="shrink-0"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Post
        </Button>
      </div>
    </div>
  );
}
