import { TrendingUp, FileText, DollarSign, Target } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HealthCard } from "@/components/dashboard/HealthCard";
import { SalesBarChart, ProposalsLineChart } from "@/components/dashboard/Charts";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Progress } from "@/components/ui/progress";
import { useCountUp } from "@/hooks/useCountUp";

export default function Dashboard() {
  const conversionValue = useCountUp(68, 1200, 300);

  return (
    <PageWrapper title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Vendas do mês"
          value={47}
          icon={TrendingUp}
          badge="+12% vs mês anterior"
          index={0}
        />
        <KpiCard
          title="Propostas ativas"
          value={23}
          icon={FileText}
          subtitle="em andamento"
          index={1}
        />
        <KpiCard
          title="Ticket médio"
          value={1840}
          prefix="R$ "
          icon={DollarSign}
          badge="+5%"
          index={2}
        />
        <KpiCard
          title="Taxa de conversão"
          value={68}
          suffix="%"
          icon={Target}
          index={3}
        >
          <Progress value={conversionValue} className="h-2 [&>div]:bg-brand" />
        </KpiCard>
      </div>

      {/* Health + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <HealthCard index={4} />
        <SalesBarChart index={5} />
        <ProposalsLineChart index={6} />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ActivityFeed index={7} />
        <AlertsPanel index={8} />
      </div>
    </PageWrapper>
  );
}
