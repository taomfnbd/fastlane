"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRef } from "react";

interface SearchInputProps {
  basePath: string;
  placeholder?: string;
}

export function SearchInput({ basePath, placeholder = "Rechercher..." }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleChange(value: string) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 300);
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        defaultValue={currentQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 h-8 text-xs"
      />
    </div>
  );
}
