"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
      toast.error("Please select a company");
      return;
    }

    setLoading(true);
    const result = await addCompanyToEvent(eventId, selectedCompany);

    if (result.success) {
      toast.success("Company added to event");
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
        <Button size="sm">
          <Plus className="mr-1 h-3 w-3" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Company to Event</DialogTitle>
          <DialogDescription>
            Select a company to add to this event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Company</Label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedCompany}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
