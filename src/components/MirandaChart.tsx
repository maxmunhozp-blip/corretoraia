import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface ChartData {
  tipo: "bar" | "line" | "pie" | "area";
  titulo: string;
  dados: { nome: string; valor: number; valor2?: number }[];
  label_valor: string;
  label_valor2?: string;
}

const COLORS = [
  "hsl(1, 30%, 45%)",    // brand
  "hsl(210, 60%, 50%)",  // blue
  "hsl(150, 50%, 40%)",  // green
  "hsl(40, 80%, 50%)",   // yellow
  "hsl(280, 50%, 50%)",  // purple
  "hsl(20, 70%, 50%)",   // orange
  "hsl(190, 60%, 45%)",  // teal
  "hsl(340, 60%, 50%)",  // pink
];

export function MirandaChart({ data }: { data: ChartData }) {
  const chartData = useMemo(() =>
    data.dados.map(d => ({
      name: d.nome,
      [data.label_valor]: d.valor,
      ...(d.valor2 !== undefined && data.label_valor2
        ? { [data.label_valor2]: d.valor2 }
        : {}),
    })),
    [data]
  );

  return (
    <div className="my-3 rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-semibold text-foreground mb-2">{data.titulo}</p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {data.tipo === "bar" ? (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey={data.label_valor} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              {data.label_valor2 && (
                <Bar dataKey={data.label_valor2} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          ) : data.tipo === "line" ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey={data.label_valor} stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
              {data.label_valor2 && (
                <Line type="monotone" dataKey={data.label_valor2} stroke={COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
              )}
            </LineChart>
          ) : data.tipo === "area" ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey={data.label_valor} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
              {data.label_valor2 && (
                <Area type="monotone" dataKey={data.label_valor2} stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
              )}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Pie
                data={data.dados.map(d => ({ name: d.nome, value: d.valor }))}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: 9 }}
              >
                {data.dados.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Parse message content and extract chart blocks.
 * Returns an array of segments: either { type: 'text', content } or { type: 'chart', data }.
 */
export function parseMessageWithCharts(content: string): Array<
  { type: "text"; content: string } | { type: "chart"; data: ChartData }
> {
  const segments: Array<{ type: "text"; content: string } | { type: "chart"; data: ChartData }> = [];
  const regex = /```chart\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Text before the chart block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: "text", content: text });
    }

    // Parse the chart JSON
    try {
      const chartData = JSON.parse(match[1].trim()) as ChartData;
      if (chartData.tipo && chartData.dados && chartData.titulo) {
        segments.push({ type: "chart", data: chartData });
      }
    } catch {
      // If JSON is invalid, treat as text
      segments.push({ type: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last chart
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: "text", content: text });
  }

  // If no charts found, return single text segment
  if (segments.length === 0) {
    segments.push({ type: "text", content });
  }

  return segments;
}
