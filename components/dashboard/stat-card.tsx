import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold break-words">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive
                    ? "text-accent"
                    : "text-destructive"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className="rounded-full bg-primary/10 p-2 sm:p-3 flex-shrink-0 ml-2">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

