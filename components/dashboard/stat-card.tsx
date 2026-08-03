import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, hint, className }: Props) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </span>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <div className="mt-2 font-serif text-3xl tracking-tight tabular-nums">
          {value}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
