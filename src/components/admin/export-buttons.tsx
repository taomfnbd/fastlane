"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  eventId?: string;
}

export function ExportButtons({ eventId }: ExportButtonsProps) {
  const [open, setOpen] = useState(false);

  function downloadCsv(type: string) {
    window.open(`/api/admin/export/csv?type=${type}`, "_blank");
    setOpen(false);
  }

  function downloadReport() {
    if (!eventId) return;
    window.open(`/api/admin/export/report?eventId=${eventId}`, "_blank");
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Exporter
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export CSV</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => downloadCsv("strategies")}>
            <FileSpreadsheet className="h-4 w-4" />
            Strategies
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadCsv("deliverables")}>
            <FileSpreadsheet className="h-4 w-4" />
            Livrables
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadCsv("companies")}>
            <FileSpreadsheet className="h-4 w-4" />
            Entreprises
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadCsv("events")}>
            <FileSpreadsheet className="h-4 w-4" />
            Evenements
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {eventId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Rapport evenement</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={downloadReport}>
                <FileText className="h-4 w-4" />
                Rapport HTML / PDF
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
