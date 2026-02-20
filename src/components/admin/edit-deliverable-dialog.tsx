"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateDeliverable } from "@/server/actions/deliverables";

const DELIVERABLE_TYPES = [
  { value: "EMAIL_TEMPLATE", label: "Email template" },
  { value: "LANDING_PAGE", label: "Landing page" },
  { value: "SOCIAL_POST", label: "Post social" },
  { value: "SCRIPT", label: "Script" },
  { value: "DOCUMENT", label: "Document" },
  { value: "AD_CREATIVE", label: "Publicite" },
  { value: "OTHER", label: "Autre" },
];

interface EditDeliverableDialogProps {
  deliverable: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    content: unknown;
  };
}

export function EditDeliverableDialog({ deliverable }: EditDeliverableDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(deliverable.type);

  const textContent = deliverable.content && typeof deliverable.content === "object" && deliverable.content !== null && "text" in deliverable.content
    ? String((deliverable.content as Record<string, unknown>).text ?? "")
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", deliverable.id);
    formData.set("type", type);
    const result = await updateDeliverable(formData);
    if (result.success) {
      toast.success("Livrable mis a jour");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le livrable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-del-title">Titre</Label>
              <Input id="edit-del-title" name="title" defaultValue={deliverable.title} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-del-desc">Description</Label>
            <Textarea id="edit-del-desc" name="description" defaultValue={deliverable.description ?? ""} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-del-content">Contenu</Label>
            <Textarea id="edit-del-content" name="content" defaultValue={textContent} rows={8} placeholder="Contenu du livrable (texte, script, etc.)" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
