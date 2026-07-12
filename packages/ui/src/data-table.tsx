import type { ReactNode } from "react";
import { cn } from "./cn";
import { Panel } from "./panel";

export interface DataTableColumn {
  label: string;
  align?: "left" | "right";
}

/*
 * The portal's data table: a Panel with a semantic table inside, scrolling
 * horizontally within its own frame on narrow screens. Edge paddings are
 * handled here with child selectors so row and cell components stay
 * position-agnostic.
 */
export function DataTable({
  columns,
  caption,
  children,
  className,
}: {
  columns: DataTableColumn[];
  /** Accessible summary of what the table holds (sr-only) */
  caption: string;
  /** Rows: DataTableRow with DataTableRowHeader / DataTableCell inside */
  children: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm [&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4 sm:[&_tr>*:first-child]:pl-6 sm:[&_tr>*:last-child]:pr-6">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-surface-sunken/10 font-medium text-ink-muted">
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={cn("p-2 sm:p-3", column.align === "right" && "text-right")}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
    </Panel>
  );
}

export function DataTableRow({
  children,
  emphasis = false,
}: {
  children: ReactNode;
  /** Highlights group rows (a district over its sections) */
  emphasis?: boolean;
}) {
  return (
    <tr className={emphasis ? "bg-surface-sunken/20" : "transition-colors hover:bg-surface-sunken/20"}>
      {children}
    </tr>
  );
}

/** First cell of a row: the row's name, as a real row header */
export function DataTableRowHeader({
  children,
  indent = false,
  className,
}: {
  children: ReactNode;
  /** Indents child rows under a group row */
  indent?: boolean;
  className?: string;
}) {
  /* The indent lives on an inner block: the cell's own edge padding is
     set by the table's child selectors and must not be fought over */
  return (
    <th scope="row" className={cn("p-2 text-left font-normal text-ink sm:p-3", className)}>
      <span className={cn("block", indent && "pl-4")}>{children}</span>
    </th>
  );
}

export function DataTableCell({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "p-2 tabular-nums text-ink-muted sm:p-3",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
