import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth-server";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || !["strategies", "deliverables", "companies", "events"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be strategies, deliverables, companies, or events" },
      { status: 400 }
    );
  }

  let csv: string;
  let filename: string;

  switch (type) {
    case "strategies": {
      const strategies = await prisma.strategy.findMany({
        include: {
          eventCompany: {
            include: {
              company: { select: { name: true } },
              event: { select: { name: true } },
            },
          },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      csv = toCsv(
        ["ID", "Titre", "Description", "Statut", "Version", "Entreprise", "Evenement", "Nb elements", "Date creation", "Derniere MAJ"],
        strategies.map((s) => [
          s.id,
          s.title,
          s.description,
          s.status,
          s.version,
          s.eventCompany.company.name,
          s.eventCompany.event.name,
          s.items.length,
          formatDate(s.createdAt),
          formatDate(s.updatedAt),
        ])
      );
      filename = "strategies.csv";
      break;
    }

    case "deliverables": {
      const deliverables = await prisma.deliverable.findMany({
        include: {
          eventCompany: {
            include: {
              company: { select: { name: true } },
              event: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      csv = toCsv(
        ["ID", "Titre", "Description", "Type", "Statut", "Version", "Entreprise", "Evenement", "Fichier", "Date creation", "Derniere MAJ"],
        deliverables.map((d) => [
          d.id,
          d.title,
          d.description,
          d.type,
          d.status,
          d.version,
          d.eventCompany.company.name,
          d.eventCompany.event.name,
          d.fileName,
          formatDate(d.createdAt),
          formatDate(d.updatedAt),
        ])
      );
      filename = "livrables.csv";
      break;
    }

    case "companies": {
      const companies = await prisma.company.findMany({
        include: {
          users: { select: { id: true } },
          events: {
            include: {
              strategies: { select: { id: true, status: true } },
              deliverables: { select: { id: true, status: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      csv = toCsv(
        ["ID", "Nom", "Site web", "Industrie", "Plan", "Nb utilisateurs", "Nb evenements", "Nb strategies", "Nb livrables", "Date creation"],
        companies.map((c) => {
          const totalStrategies = c.events.reduce((sum, ec) => sum + ec.strategies.length, 0);
          const totalDeliverables = c.events.reduce((sum, ec) => sum + ec.deliverables.length, 0);
          return [
            c.id,
            c.name,
            c.website,
            c.industry,
            c.plan,
            c.users.length,
            c.events.length,
            totalStrategies,
            totalDeliverables,
            formatDate(c.createdAt),
          ];
        })
      );
      filename = "entreprises.csv";
      break;
    }

    case "events": {
      const events = await prisma.event.findMany({
        include: {
          companies: {
            include: {
              company: { select: { name: true } },
              strategies: { select: { id: true } },
              deliverables: { select: { id: true } },
            },
          },
        },
        orderBy: { startDate: "desc" },
      });

      csv = toCsv(
        ["ID", "Nom", "Description", "Statut", "Date debut", "Date fin", "Nb entreprises", "Nb strategies", "Nb livrables", "Date creation"],
        events.map((e) => {
          const totalStrategies = e.companies.reduce((sum, ec) => sum + ec.strategies.length, 0);
          const totalDeliverables = e.companies.reduce((sum, ec) => sum + ec.deliverables.length, 0);
          return [
            e.id,
            e.name,
            e.description,
            e.status,
            formatDate(e.startDate),
            formatDate(e.endDate),
            e.companies.length,
            totalStrategies,
            totalDeliverables,
            formatDate(e.createdAt),
          ];
        })
      );
      filename = "evenements.csv";
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
