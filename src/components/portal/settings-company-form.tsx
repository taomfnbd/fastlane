"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateCompanyInfo } from "@/server/actions/client-settings";

interface SettingsCompanyFormProps {
  company: { name: string; website: string; industry: string };
  isAdmin: boolean;
}

export function SettingsCompanyForm({ company, isAdmin }: SettingsCompanyFormProps) {
  const [name, setName] = useState(company.name);
  const [website, setWebsite] = useState(company.website);
  const [industry, setIndustry] = useState(company.industry);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    name !== company.name ||
    website !== company.website ||
    industry !== company.industry;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);
    const result = await updateCompanyInfo({ name, website: website || undefined, industry: industry || undefined });
    if (result.success) {
      toast.success("Informations mises a jour");
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-muted-foreground">apartment</span>
        Entreprise
      </h2>
      <div className="bg-card rounded-xl border border-primary/5 p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Nom</label>
          {isAdmin ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
              placeholder="Nom de l'entreprise"
            />
          ) : (
            <p className="text-sm font-medium">{name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Secteur</label>
          {isAdmin ? (
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="text-sm"
              placeholder="Ex: SaaS, E-commerce..."
            />
          ) : (
            <p className="text-sm">{industry || "—"}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Site web</label>
          {isAdmin ? (
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="text-sm"
              placeholder="https://..."
            />
          ) : (
            <p className="text-sm">{website || "—"}</p>
          )}
        </div>

        {isAdmin && hasChanges && (
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Enregistrer
          </Button>
        )}
      </div>
    </div>
  );
}
