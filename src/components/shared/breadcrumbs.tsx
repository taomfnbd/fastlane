import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[150px]">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? "text-foreground font-medium truncate max-w-[200px]" : "truncate max-w-[150px]"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
