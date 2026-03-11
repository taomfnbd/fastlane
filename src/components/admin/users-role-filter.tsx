"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const roles = [
  { value: "all", label: "Tous les roles" },
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "CLIENT_ADMIN", label: "Admin client" },
  { value: "CLIENT_MEMBER", label: "Membre client" },
];

export function UsersRoleFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get("role") ?? "all";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "all") {
      params.delete("role");
    } else {
      params.set("role", value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  return (
    <Select value={currentRole} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="w-44 text-xs">
        <SelectValue placeholder="Filtrer par role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
