"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  PENDING_REVIEW: "#f59e0b",
  APPROVED: "#22c55e",
  CHANGES_REQUESTED: "#ef4444",
  REVISED: "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En revision",
  APPROVED: "Approuve",
  CHANGES_REQUESTED: "Modifications",
  REVISED: "Revise",
};

const TYPE_LABELS: Record<string, string> = {
  EMAIL_TEMPLATE: "Email",
  LANDING_PAGE: "Landing page",
  SOCIAL_POST: "Social",
  SCRIPT: "Script",
  DOCUMENT: "Document",
  AD_CREATIVE: "Publicite",
  OTHER: "Autre",
};

interface ActivityChartProps {
  data: { month: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#6961ff"
          strokeWidth={2}
          dot={{ fill: "#6961ff", r: 4 }}
          activeDot={{ r: 6 }}
          name="Activites"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface StatusPieChartProps {
  data: { status: string; count: number }[];
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const formatted = data.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? "#94a3b8",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {formatted.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface TypeBarChartProps {
  data: { type: string; count: number }[];
}

export function TypeBarChart({ data }: TypeBarChartProps) {
  const formatted = data.map((d) => ({
    name: TYPE_LABELS[d.type] ?? d.type,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={formatted}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          stroke="#94a3b8"
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        />
        <Bar
          dataKey="count"
          fill="#6961ff"
          radius={[4, 4, 0, 0]}
          name="Livrables"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
