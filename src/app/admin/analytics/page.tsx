import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Truck, Clock, Calendar } from "lucide-react";
import { ActivityChart, StatusPieChart, TypeBarChart } from "@/components/admin/analytics-charts";
import { ExportButtons } from "@/components/admin/export-buttons";
import Link from "next/link";

export const metadata = { title: "Analytiques" };

interface AnalyticsData {
  approvalRate: number;
  deliveryRate: number;
  avgReviewTime: number;
  activeEventsCount: number;
  monthlyActivity: { month: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  deliverablesByType: { type: string; count: number }[];
  topCompanies: { id: string; name: string; approved: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return res.json();
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const data = await fetchAnalytics();

  const kpis = [
    {
      label: "Taux d'approbation",
      value: `${data.approvalRate}%`,
      icon: TrendingUp,
      description: "Strategies approuvees / non-brouillon",
    },
    {
      label: "Taux de livraison",
      value: `${data.deliveryRate}%`,
      icon: Truck,
      description: "Livrables livres / non-brouillon",
    },
    {
      label: "Delai moyen de validation",
      value: `${data.avgReviewTime}j`,
      icon: Clock,
      description: "Creation → approbation strategie",
    },
    {
      label: "Evenements actifs",
      value: String(data.activeEventsCount),
      icon: Calendar,
      description: "Evenements en cours",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytiques"
        description="Vue d'ensemble de l'activite de la plateforme"
        action={<ExportButtons />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="py-4">
            <CardContent className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {kpi.label}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {kpi.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Line Chart + Pie Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Activite mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={data.monthlyActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statuts des strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={data.statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Bar Chart + Top Companies Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Livrables par type</CardTitle>
          </CardHeader>
          <CardContent>
            <TypeBarChart data={data.deliverablesByType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top entreprises</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aucune donnee disponible
              </p>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Entreprise
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                        Elements approuves
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.topCompanies.map((company, i) => (
                      <tr key={company.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/companies/${company.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                              {i + 1}
                            </span>
                            <span className="font-medium">{company.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                          {company.approved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
