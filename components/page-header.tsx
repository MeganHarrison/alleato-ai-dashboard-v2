import type React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    component?: React.ReactNode;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 pb-6 border-b border-border/30 brand-accent">
      <div className="flex-1 space-y-3 pl-5">
        <div className="space-y-2">
          <h1 className="text-brand text-2xl font-semibold tracking-tight uppercase">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {action?.component && (
        <div className="flex-shrink-0 ml-6">
          {action.component}
        </div>
      )}
    </div>
  );
}
