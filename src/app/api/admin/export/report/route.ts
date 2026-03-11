import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth-server";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PREPARATION: "Preparation",
  ACTIVE: "Actif",
  REVIEW: "Revision",
  COMPLETED: "Termine",
  ARCHIVED: "Archive",
  PENDING_REVIEW: "En revision",
  APPROVED: "Approuve",
  CHANGES_REQUESTED: "Modifications demandees",
  REVISED: "Revise",
  IN_REVIEW: "En revision",
  DELIVERED: "Livre",
  PENDING: "En attente",
  REJECTED: "Refuse",
  MODIFIED: "Modifie",
};

const TYPE_LABELS: Record<string, string> = {
  EMAIL_TEMPLATE: "Template email",
  LANDING_PAGE: "Landing page",
  SOCIAL_POST: "Post social",
  SCRIPT: "Script",
  DOCUMENT: "Document",
  AD_CREATIVE: "Publicite creative",
  OTHER: "Autre",
};

function statusColor(status: string): string {
  switch (status) {
    case "APPROVED":
    case "DELIVERED":
      return "#16a34a";
    case "PENDING_REVIEW":
    case "IN_REVIEW":
    case "PENDING":
      return "#d97706";
    case "CHANGES_REQUESTED":
    case "REJECTED":
      return "#dc2626";
    default:
      return "#64748b";
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      companies: {
        include: {
          company: { select: { name: true, industry: true, website: true } },
          strategies: {
            include: {
              items: {
                orderBy: { order: "asc" },
                select: { id: true, title: true, status: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          deliverables: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const companySections = event.companies
    .map((ec) => {
      const strategySections = ec.strategies
        .map((s) => {
          const itemRows = s.items
            .map(
              (item) => `
              <tr>
                <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.title)}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
                  <span style="color:${statusColor(item.status)};font-weight:500;">${STATUS_LABELS[item.status] ?? item.status}</span>
                </td>
              </tr>`
            )
            .join("");

          return `
          <div style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <h4 style="margin:0;font-size:14px;">${escapeHtml(s.title)}</h4>
              <span style="color:${statusColor(s.status)};font-size:12px;font-weight:500;">${STATUS_LABELS[s.status] ?? s.status}</span>
            </div>
            ${s.description ? `<p style="color:#64748b;font-size:12px;margin:0 0 8px 0;">${escapeHtml(s.description)}</p>` : ""}
            ${
              s.items.length > 0
                ? `<table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;">
                  <thead><tr style="background:#f8fafc;">
                    <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;">Element</th>
                    <th style="padding:6px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">Statut</th>
                  </tr></thead>
                  <tbody>${itemRows}</tbody>
                </table>`
                : '<p style="color:#94a3b8;font-size:12px;">Aucun element</p>'
            }
          </div>`;
        })
        .join("");

      const deliverableRows = ec.deliverables
        .map(
          (d) => `
          <tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(d.title)}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${TYPE_LABELS[d.type] ?? d.type}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
              <span style="color:${statusColor(d.status)};font-weight:500;">${STATUS_LABELS[d.status] ?? d.status}</span>
            </td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">v${d.version}</td>
          </tr>`
        )
        .join("");

      return `
      <div style="margin-bottom:32px;page-break-inside:avoid;">
        <h3 style="font-size:16px;margin:0 0 4px 0;padding-bottom:8px;border-bottom:2px solid #6961ff;">
          ${escapeHtml(ec.company.name)}
        </h3>
        ${ec.company.industry ? `<p style="color:#64748b;font-size:12px;margin:4px 0;">${escapeHtml(ec.company.industry)}</p>` : ""}

        <h4 style="font-size:13px;color:#6961ff;margin:16px 0 8px 0;text-transform:uppercase;letter-spacing:0.05em;">Strategies (${ec.strategies.length})</h4>
        ${ec.strategies.length > 0 ? strategySections : '<p style="color:#94a3b8;font-size:12px;">Aucune strategie</p>'}

        <h4 style="font-size:13px;color:#6961ff;margin:16px 0 8px 0;text-transform:uppercase;letter-spacing:0.05em;">Livrables (${ec.deliverables.length})</h4>
        ${
          ec.deliverables.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;">
              <thead><tr style="background:#f8fafc;">
                <th style="padding:6px 12px;text-align:left;border-bottom:1px solid #e2e8f0;">Titre</th>
                <th style="padding:6px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">Type</th>
                <th style="padding:6px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">Statut</th>
                <th style="padding:6px 12px;text-align:center;border-bottom:1px solid #e2e8f0;">Version</th>
              </tr></thead>
              <tbody>${deliverableRows}</tbody>
            </table>`
            : '<p style="color:#94a3b8;font-size:12px;">Aucun livrable</p>'
        }
      </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Rapport - ${escapeHtml(event.name)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.5;
    }
    table { border-radius: 4px; overflow: hidden; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:24px;text-align:right;">
    <button onclick="window.print()" style="padding:8px 16px;background:#6961ff;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
      Imprimer / Enregistrer en PDF
    </button>
  </div>

  <header style="margin-bottom:32px;">
    <h1 style="font-size:22px;margin:0;">${escapeHtml(event.name)}</h1>
    ${event.description ? `<p style="color:#64748b;margin:4px 0 0 0;">${escapeHtml(event.description)}</p>` : ""}
    <div style="display:flex;gap:24px;margin-top:12px;font-size:13px;color:#64748b;">
      <span>Statut : <strong style="color:${statusColor(event.status)}">${STATUS_LABELS[event.status] ?? event.status}</strong></span>
      <span>Du ${formatDate(event.startDate)} au ${formatDate(event.endDate)}</span>
      <span>${event.companies.length} entreprise${event.companies.length !== 1 ? "s" : ""}</span>
    </div>
  </header>

  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />

  ${companySections}

  <footer style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
    Rapport genere le ${formatDate(new Date())} — Fastlane
  </footer>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
