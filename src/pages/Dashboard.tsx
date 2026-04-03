import { TrendingUp, FileText, DollarSign, Target } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HealthCard } from "@/components/dashboard/HealthCard";
import { SalesBarChart, ProposalsLineChart } from "@/components/dashboard/Charts";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { useDashboardKpis, useSalesWeekly, useProposalsDaily, useRecentActivities, usePendingAlerts, useHealthStatus } from "@/hooks/useDashboardData";

function KpiSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[240px] w-full" />
    </div>
  );
}

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: health } = useHealthStatus(kpis?.taxaConversao ?? -1);
  const { data: salesData, isLoading: salesLoading } = useSalesWeekly();
  const { data: proposalsData, isLoading: proposalsLoading } = useProposalsDaily();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities();
  const { data: alerts, isLoading: alertsLoading } = usePendingAlerts();

  const conversionValue = useCountUp(kpis?.taxaConversao ?? 0, 1200, 300);

  if (kpisLoading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => <ChartSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </PageWrapper>
    );
  }

  const k = kpis!;

  return (
    <PageWrapper title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Vendas do mês" value={k.vendasMes} icon={TrendingUp} index={0} />
        <KpiCard title="Propostas ativas" value={k.propostasAtivas} icon={FileText} subtitle="em andamento" index={1} />
        <KpiCard title="Ticket médio" value={k.ticketMedio} prefix="R$ " icon={DollarSign} index={2} />
        <KpiCard title="Taxa de conversão" value={k.taxaConversao} suffix="%" icon={Target} index={3}>
          <Progress value={conversionValue} className="h-2 [&>div]:bg-brand" />
        </KpiCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <HealthCard index={4} status={health?.status ?? "Saudável"} />
        {salesLoading ? <ChartSkeleton /> : <SalesBarChart index={5} data={salesData!} />}
        {proposalsLoading ? <ChartSkeleton /> : <ProposalsLineChart index={6} data={proposalsData!} />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {activitiesLoading ? <ChartSkeleton /> : <ActivityFeed index={7} activities={activities!} />}
        {alertsLoading ? <ChartSkeleton /> : <AlertsPanel index={8} alerts={alerts!} />}
      </div>
    </PageWrapper>
  );
}
