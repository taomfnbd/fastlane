"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { createCompany } from "@/server/actions/companies";

export function CreateCompanyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCompany(formData);
    if (result.success) {
      toast.success("Entreprise creee");
      setOpen(false);
      router.push(`/admin/companies/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Nouvelle entreprise</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une entreprise</DialogTitle>
            <DialogDescription>Ajouter une nouvelle entreprise cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;entreprise</Label>
              <Input id="name" name="name" placeholder="Acme Corp" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Secteur (optionnel)</Label>
              <Input id="industry" name="industry" placeholder="SaaS, E-commerce, etc." disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site web (optionnel)</Label>
              <Input id="website" name="website" type="url" placeholder="https://exemple.com" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea id="description" name="description" placeholder="Breve description..." rows={3} disabled={loading} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
