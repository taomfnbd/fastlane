"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SplitViewLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  basePath: string;
  className?: string;
}

export function SplitViewLayout({ list, detail, basePath, className }: SplitViewLayoutProps) {
  const pathname = usePathname();
  const isDetailRoute = pathname !== basePath && pathname.startsWith(basePath + "/");

  return (
    <div className={cn("flex h-[calc(100vh-4rem)] gap-0", className)}>
      {/* List panel: always visible on desktop, hidden on mobile when detail is active */}
      <div className={cn(
        "w-full lg:w-[340px] lg:min-w-[300px] lg:max-w-[400px] lg:border-r shrink-0",
        isDetailRoute && "hidden lg:block"
      )}>
        <div className="h-full overflow-y-auto">
          {list}
        </div>
      </div>

      {/* Detail panel: always visible on desktop, shown on mobile only when detail is active */}
      <div className={cn(
        "flex-1 min-w-0",
        isDetailRoute ? "block" : "hidden lg:block"
      )}>
        <div className="h-full overflow-y-auto">
          {isDetailRoute && (
            <div className="lg:hidden p-3 border-b">
              <Button variant="ghost" size="sm" asChild>
                <Link href={basePath}>
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Retour a la liste
                </Link>
              </Button>
            </div>
          )}
          {detail}
        </div>
      </div>
    </div>
  );
}
