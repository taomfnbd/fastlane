"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRef, useState } from "react";

interface SearchInputProps {
  basePath: string;
  placeholder?: string;
}

export function SearchInput({ basePath, placeholder = "Rechercher..." }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  function navigate(newValue: string) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (newValue) {
        params.set("q", newValue);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 300);
  }

  function handleChange(newValue: string) {
    setValue(newValue);
    navigate(newValue);
  }

  function handleClear() {
    setValue("");
    clearTimeout(timeoutRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("q");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8 h-8 text-xs"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
