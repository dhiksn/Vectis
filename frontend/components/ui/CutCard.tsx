import React from "react";
import { clsx } from "clsx";

interface CutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  action?: React.ReactNode;
  graphite?: boolean;
}

export const CutCard: React.FC<CutCardProps> = ({
  children,
  header,
  action,
  graphite = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "cut p-5 transition-colors",
        graphite ? "graphite" : "bg-paper-2 border-rule",
        className
      )}
      {...props}
    >
      {(header || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rule">
          {header && typeof header === "string" ? (
            <h3 className="text-sm font-display font-medium text-muted tracking-display uppercase">
              {header}
            </h3>
          ) : (
            header
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
