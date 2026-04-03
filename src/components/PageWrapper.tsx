import { ReactNode } from "react";

export interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <div className="animate-page-in p-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
