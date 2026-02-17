"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { createDeliverable } from "@/server/actions/deliverables";

const deliverableTypes = [
  { value: "EMAIL_TEMPLATE", label: "Template email" },
  { value: "LANDING_PAGE", label: "Landing page" },
  { value: "SOCIAL_POST", label: "Post social" },
  { value: "SCRIPT", label: "Script" },
  { value: "DOCUMENT", label: "Document" },
  { value: "AD_CREATIVE", label: "Creative pub" },
  { value: "OTHER", label: "Autre" },
];

interface CreateDeliverableDialogProps {
  eventCompanyId: string;
  companyName: string;
}

export function CreateDeliverableDialog({ eventCompanyId, companyName }: CreateDeliverableDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("EMAIL_TEMPLATE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventCompanyId", eventCompanyId);
    formData.set("type", type);
    const result = await createDeliverable(formData);
    if (result.success) {
      toast.success("Livrable cree");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-3 w-3" />Nouveau livrable</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Creer un livrable</DialogTitle>
            <DialogDescription>Nouveau livrable pour {companyName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" placeholder="Template cold email" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {deliverableTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea id="description" name="description" placeholder="Decrivez le livrable..." rows={3} disabled={loading} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Creer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
