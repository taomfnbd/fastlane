"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { addStrategyItem } from "@/server/actions/strategy";

interface AddStrategyItemDialogProps { strategyId: string; }

export function AddStrategyItemDialog({ strategyId }: AddStrategyItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("strategyId", strategyId);
    const result = await addStrategyItem(formData);
    if (result.success) {
      toast.success("Element ajoute");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full border-dashed">
          <Plus className="mr-1 h-3 w-3" />Ajouter un element
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader><DialogTitle>Ajouter un element</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" placeholder="Prospection LinkedIn" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea id="description" name="description" placeholder="Decrivez cet element..." rows={3} disabled={loading} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
