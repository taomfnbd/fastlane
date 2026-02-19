"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Reply, Pencil, Trash2, Check, X } from "lucide-react";
import { addComment, deleteComment, updateComment } from "@/server/actions/feedback";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; image: string | null };
  authorId?: string;
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    author: { name: string; image: string | null };
    authorId?: string;
  }[];
}

interface CommentSectionProps {
  comments: Comment[];
  currentUserId?: string;
  strategyId?: string;
  strategyItemId?: string;
  deliverableId?: string;
}

export function CommentSection({
  comments,
  currentUserId,
  strategyId,
  strategyItemId,
  deliverableId,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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
      setReplyTo(null);
      setReplyContent("");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    setLoading(true);
    const result = await deleteComment(commentId);
    if (!result.success) toast.error(result.error);
    setLoading(false);
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim()) return;
    setLoading(true);
    const result = await updateComment(commentId, editContent);
    if (result.success) {
      setEditingId(null);
      setEditContent("");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  function isOwner(authorId?: string) {
    return currentUserId && authorId && currentUserId === authorId;
  }

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <p className="text-[11px] text-muted-foreground">{comments.length} commentaire{comments.length !== 1 && "s"}</p>
      )}

      {comments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <div className="flex gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium mt-0.5">
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{comment.author.name}</span>
                <span className="text-[11px] text-muted-foreground/80">
                  {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isOwner(comment.authorId) && editingId !== comment.id && (
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-foreground transition-colors p-0.5"
                      onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                      title="Modifier"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-destructive transition-colors p-0.5"
                      onClick={() => handleDelete(comment.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="mt-1 space-y-1.5">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    className="text-xs"
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && editContent.trim()) {
                        e.preventDefault();
                        handleEdit(comment.id);
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleEdit(comment.id)} disabled={loading || !editContent.trim()}>
                      <Check className="h-3 w-3 mr-1" /> Sauver
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setEditingId(null); setEditContent(""); }}>
                      <X className="h-3 w-3 mr-1" /> Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs mt-0.5 whitespace-pre-wrap">{comment.content}</p>
              )}

              {editingId !== comment.id && (
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1 inline-flex items-center gap-1"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                >
                  <Reply className="h-3 w-3" />
                  repondre
                </button>
              )}
            </div>
          </div>

          {/* Replies */}
          {comment.replies.map((reply) => (
            <div key={reply.id} className="ml-7 flex gap-2.5">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium mt-0.5">
                {reply.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{reply.author.name}</span>
                  <span className="text-[11px] text-muted-foreground/80">
                    {new Date(reply.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOwner(reply.authorId) && (
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-destructive transition-colors p-0.5 ml-auto"
                      onClick={() => handleDelete(reply.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs mt-0.5 whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))}

          {/* Reply form */}
          {replyTo === comment.id && (
            <div className="ml-7 flex gap-2">
              <Textarea
                placeholder="Repondre... (Ctrl+Entree pour envoyer)"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && replyContent.trim()) {
                    e.preventDefault();
                    handleReply(comment.id);
                  }
                }}
                rows={1}
                className="text-xs min-h-8"
                disabled={loading}
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleReply(comment.id)}
                  disabled={loading || !replyContent.trim()}
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Repondre"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => { setReplyTo(null); setReplyContent(""); }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* New comment */}
      <div className="flex gap-2 pt-1">
        <Textarea
          placeholder="Ecrire un commentaire... (Ctrl+Entree pour envoyer)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && content.trim()) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          className="text-xs min-h-8"
          disabled={loading}
        />
        <Button
          size="sm"
          className="h-8 text-xs shrink-0"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
        >
          {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Publier
        </Button>
      </div>
    </div>
  );
}
