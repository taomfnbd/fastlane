"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCompany } from "@/server/actions/companies";

interface EditCompanyDialogProps {
  company: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    description: string | null;
  };
}

export function EditCompanyDialog({ company }: EditCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", company.id);
    const result = await updateCompany(formData);
    if (result.success) {
      toast.success("Entreprise mise a jour");
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
          <DialogTitle>Modifier l&apos;entreprise</DialogTitle>
        </DialogHeader>
        <form key={String(open)} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-company-name">Nom</Label>
            <Input id="edit-company-name" name="name" defaultValue={company.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company-industry">Industrie</Label>
            <Input id="edit-company-industry" name="industry" defaultValue={company.industry ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company-website">Site web</Label>
            <Input id="edit-company-website" name="website" defaultValue={company.website ?? ""} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company-desc">Description</Label>
            <Textarea id="edit-company-desc" name="description" defaultValue={company.description ?? ""} rows={3} />
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
