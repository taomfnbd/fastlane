"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { addCompanyToEvent } from "@/server/actions/events";

interface AddCompanyToEventProps {
  eventId: string;
  companies: { id: string; name: string }[];
}

export function AddCompanyToEvent({ eventId, companies }: AddCompanyToEventProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");

  async function handleSubmit() {
    if (!selectedCompany) {
      toast.error("Veuillez selectionner une entreprise");
      return;
    }
    setLoading(true);
    const result = await addCompanyToEvent(eventId, selectedCompany);
    if (result.success) {
      toast.success("Entreprise ajoutee");
      setOpen(false);
      setSelectedCompany("");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-3 w-3" />Ajouter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une entreprise</DialogTitle>
          <DialogDescription>Selectionner une entreprise a ajouter a cet evenement.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Entreprise</Label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="mt-2"><SelectValue placeholder="Selectionner..." /></SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedCompany}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
