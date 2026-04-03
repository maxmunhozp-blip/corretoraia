import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

export interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  badge?: string;
  badgePositive?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  index?: number;
  className?: string;
  children?: ReactNode;
}

export function KpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  badge,
  subtitle,
  icon: Icon,
  index,
  className,
  children,
}: KpiCardProps) {
  const idx = index ?? 0;
  const animatedValue = useCountUp(value, 1200, idx * 100);

  return (
    <div
      className={`rounded-lg border border-border bg-card p-5 flex flex-col gap-3 opacity-0 ${className || ""}`}
      style={{
        animation: `staggerIn 0.4s ease-out ${idx * 100}ms forwards`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="h-9 w-9 rounded-md bg-brand-light flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-foreground tracking-tight">
          {prefix}{animatedValue.toLocaleString("pt-BR")}{suffix}
        </span>
        {badge && (
          <span className="mb-1 inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
      {children}
    </div>
  );
}
