import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { vendasSemanais, propostasDiarias } from "@/data/mock";

const last7Days = propostasDiarias.slice(-7);

export function SalesBarChart({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Vendas por semana</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={vendasSemanais}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
          <XAxis dataKey="semana" tick={{ fontSize: 12, fill: "#71717A" }} />
          <YAxis tick={{ fontSize: 12, fill: "#71717A" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E4E7", fontSize: 13 }} />
          <Bar dataKey="vendas" fill="#955251" radius={[4, 4, 0, 0]} animationDuration={1200} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProposalsLineChart({ index }: { index: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Propostas criadas vs fechadas</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={last7Days}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
          <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#71717A" }} />
          <YAxis tick={{ fontSize: 12, fill: "#71717A" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E4E7", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="criadas" stroke="#955251" strokeWidth={2} dot={{ r: 4, fill: "#955251" }} animationDuration={1200} />
          <Line type="monotone" dataKey="fechadas" stroke="#E4E4E7" strokeWidth={2} dot={{ r: 4, fill: "#E4E4E7", stroke: "#71717A" }} animationDuration={1200} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
