"use client";

import { Trash2 } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { deleteCompany } from "@/server/actions/companies";
import { useRouter } from "next/navigation";

interface CompanyDeleteButtonProps {
  companyId: string;
  hasUsersOrEvents: boolean;
}

export function CompanyDeleteButton({ companyId, hasUsersOrEvents }: CompanyDeleteButtonProps) {
  const router = useRouter();

  if (hasUsersOrEvents) return null;

  return (
    <InlineActions
      actions={[
        {
          label: "Supprimer",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          action: async () => {
            const result = await deleteCompany(companyId);
            if (result.success) router.push("/admin/companies");
            return result;
          },
          confirm: "Supprimer cette entreprise ? Cette action est irreversible.",
          variant: "destructive",
        },
      ]}
    />
  );
}
