"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const senderColors = {
  gmail: "#22c55e",
  domain: "#3b82f6",
  mask: "#f59e0b",
  remaining: "#e2e8f0",
};

export function SenderCapacityChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ name: string; used: number; remaining: number; color?: string }>;
}) {
  return (
    <div className="dashboard-card min-w-0">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <div className="mt-6 h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <BarChart data={data} barGap={12}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
              }}
              labelStyle={{ color: "#64748b" }}
            />
            <Bar dataKey="used" stackId="usage" radius={[16, 16, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color ?? "#0f172a"} />
              ))}
            </Bar>
            <Bar
              dataKey="remaining"
              stackId="usage"
              radius={[16, 16, 0, 0]}
              fill={senderColors.remaining}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SingleSenderCollectionChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ name: string; used: number; remaining: number; color?: string }>;
}) {
  return (
    <div className="dashboard-card min-w-0">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <div className="mt-6 h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <BarChart data={data} barCategoryGap={24}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
              }}
              labelStyle={{ color: "#64748b" }}
            />
            <Bar dataKey="used" radius={[16, 16, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color ?? "#0f172a"} />
              ))}
            </Bar>
            <Bar
              dataKey="remaining"
              radius={[16, 16, 0, 0]}
              fill={senderColors.remaining}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OverallDistributionChart({
  data,
}: {
  data: Array<{ name: string; used: number; remaining: number; color?: string }>;
}) {
  return (
    <div className="dashboard-card min-w-0">
      <p className="text-sm font-medium text-slate-900">
        Sender distribution overall
      </p>
      <div className="mt-6 h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
              }}
              labelStyle={{ color: "#64748b" }}
            />
            <Bar dataKey="used" stackId="distribution" radius={[0, 16, 16, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color ?? "#0f172a"} />
              ))}
            </Bar>
            <Bar
              dataKey="remaining"
              stackId="distribution"
              radius={[0, 16, 16, 0]}
              fill={senderColors.remaining}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
