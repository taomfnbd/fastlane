"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateEvent } from "@/server/actions/events";

interface EditEventDialogProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
  };
}

export function EditEventDialog({ event }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const startStr = new Date(event.startDate).toISOString().slice(0, 10);
  const endStr = new Date(event.endDate).toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", event.id);
    const result = await updateEvent(formData);
    if (result.success) {
      toast.success("Evenement mis a jour");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;evenement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-event-name">Nom</Label>
            <Input id="edit-event-name" name="name" defaultValue={event.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-desc">Description</Label>
            <Textarea id="edit-event-desc" name="description" defaultValue={event.description ?? ""} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-event-start">Date de debut</Label>
              <Input id="edit-event-start" name="startDate" type="date" defaultValue={startStr} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-end">Date de fin</Label>
              <Input id="edit-event-end" name="endDate" type="date" defaultValue={endStr} required />
            </div>
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
